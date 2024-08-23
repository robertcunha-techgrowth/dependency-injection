import { globalTarget } from "./global-target";
import { ModuleMetadata } from "./module-metadata";
export abstract class BaseProvider {
	provide?: string;
	protected moduleMetadata: ModuleMetadata;

	constructor() {
		this.moduleMetadata = new ModuleMetadata();
	}

	public abstract createInstance(moduleName: string, provide: string): any;
}

export class FactoryProvider extends BaseProvider {
	inject?: any[];
	useFactory: Function;

	constructor({
		provide,
		inject,
		useFactory,
	}: {
		provide: string;
		inject?: any[];
		useFactory: Function;
	}) {
		super();
		this.provide = provide;
		this.inject = inject;
		this.useFactory = useFactory;
	}

	public createInstance(moduleName: string, provide: string) {
		const instance = this.useFactory();
		this.moduleMetadata.setProviderMetadata(moduleName, provide, instance);
		return instance;
	}
}

export class ClassProvider extends BaseProvider {
	useClass: any;

	constructor({ provide, useClass }: { provide: string; useClass: any }) {
		super();
		this.provide = provide;
		this.useClass = useClass;
	}

	public createInstance(moduleName: string, provide: string) {
		// Check if we're already in the process of creating this instance
		if (this.moduleMetadata.isInCreation(moduleName, provide)) {
			throw new Error(
				`Circular dependency detected for ${provide} in module ${moduleName}`
			);
		}

		const instance = this.moduleMetadata.getInstance(moduleName, provide);
		if (instance) {
			return instance;
		}

		const constructorFunction = this.useClass;
		const className = this.useClass.name;

		if (constructorFunction) {
			// Mark this instance as in creation
			this.moduleMetadata.markAsInCreation(moduleName, provide);

			const parameters = this.findInstanceParameters(
				constructorFunction,
				className,
				moduleName
			);

			const instance = new constructorFunction(...parameters);
			this.checkInstance(instance, provide);

			this.moduleMetadata.setProviderMetadata(moduleName, provide, instance);

			// Remove from the "in creation" cache
			this.moduleMetadata.unmarkAsInCreation(moduleName, provide);

			return instance;
		} else {
			throw new Error(
				`Instance not found for ${provide} for module ${moduleName}`
			);
		}
	}

	private findInstanceParameters(
		constructorFunction: any,
		provide: string,
		moduleName: string
	) {
		const maxIndex = constructorFunction.length;
		return Array(maxIndex)
			.fill(0)
			.reduce((prev, _, index) => {
				const parameter = this.findParameter(provide, index, moduleName);
				prev.push(parameter);
				return prev;
			}, []);
	}

	private findParameter(provide: string, index: number, moduleName: string) {
		const parameter = Reflect.getMetadata(
			`${provide}:parameters:${index}`,
			globalTarget
		);
		return this.createInstance(moduleName, parameter.provide);
	}

	private checkInstance(instance: any, provide: string) {
		if (!instance) {
			console.error(
				`${new Date().toISOString()}: Instance not found for ${provide}. Please check if the provider was imported.`
			);
			throw new Error(`Instance not found for ${provide}`);
		}
	}
}
