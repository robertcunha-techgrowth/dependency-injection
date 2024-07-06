import { globalTarget } from "./global-target";
import { importFromExportsModule } from "./module";
import { Provider } from "./provider";

export interface SetInstanceParams {}

export interface SetInstanceParamsWithModule extends SetInstanceParams {
	currentModuleName: string;
	currentProvide: string;
}

export interface SetInstanceFactoryParams extends SetInstanceParamsWithModule {
	provider: Provider;
}

export interface SetInstanceImportsParams extends SetInstanceParams {
	importedModules: string[];
	currentProvide: string;
}

export interface SetInstanceByNewOneParams extends SetInstanceImportsParams {
	currentModuleName: string;
}

export abstract class SetInstance {
	abstract execute(params: SetInstanceParams): any;
}

export class SetInstanceImports extends SetInstance {
	override execute(params: SetInstanceImportsParams) {
		const { importedModules, currentProvide } = params;
		const instances = importedModules
			.map((moduleName) => importFromExportsModule(moduleName, currentProvide))
			.filter((instance) => instance);
		return instances.pop();
	}
}

export class SetInstanceFactory extends SetInstance {
	override execute(params: SetInstanceFactoryParams) {
		const { provider, currentModuleName, currentProvide } = params;
		const factoryInstance = provider.useFactory?.();

		if (factoryInstance) {
			Reflect.defineMetadata(
				`${currentModuleName}:${currentProvide}`,
				factoryInstance,
				globalTarget
			);
		}

		return factoryInstance;
	}
}

export class SetInstanceByNewOne extends SetInstance {
	override execute(params: SetInstanceByNewOneParams) {
		const { importedModules, currentProvide, currentModuleName } = params;
		return this.createInstance(
			importedModules,
			currentModuleName,
			currentProvide
		);
	}

	private createInstance(
		importedModules: any[],
		moduleName: string,
		provide: string
	) {
		const constructorFunction = Reflect.getMetadata(
			`${provide}:constructor`,
			globalTarget
		);
		if (constructorFunction) {
			const maxIndex = constructorFunction.length;
			if (maxIndex > 0) {
				const parameters = Array(maxIndex)
					.fill(0)
					.reduce((prev, _, index) => {
						const parameter = this.findParameter(
							provide,
							index,
							importedModules,
							moduleName
						);
						prev.push(parameter);
						return prev;
					}, []);
				const instance = new constructorFunction(...parameters);
				Reflect.defineMetadata(
					`${moduleName}:${provide}`,
					instance,
					globalTarget
				);
				return instance;
			}
			const instance = new constructorFunction();
			this.checkInstance(instance, provide);
			Reflect.defineMetadata(
				`${moduleName}:${provide}`,
				instance,
				globalTarget
			);
			return instance;
		} else {
			const instance = this.getInstance(moduleName, provide);
			this.checkInstance(instance, provide);
			return instance;
		}
	}

	private findParameter(
		provide: string,
		index: number,
		importedModules: any[],
		moduleName: string
	) {
		const parameter = Reflect.getMetadata(
			`${provide}:parameters:${index}`,
			globalTarget
		);
		const importedParameter = importedModules
			.map((module) => importFromExportsModule(module, parameter.provide))
			.filter((instance) => instance)
			.pop();

		if (importedParameter) {
			return importedParameter;
		}

		return this.createInstance(importedModules, moduleName, parameter.provide);
	}

	private checkInstance(instance: any, provide: string) {
		if (!instance) {
			console.error(
				`${new Date().toISOString()}: Instance not found for ${provide}. Please check if the provider was imported.`
			);
			throw new Error(`Instance not found for ${provide}`);
		}
	}

	private getInstance(moduleName: string, provide: string) {
		return Reflect.getMetadata(`${moduleName}:${provide}`, globalTarget);
	}
}
