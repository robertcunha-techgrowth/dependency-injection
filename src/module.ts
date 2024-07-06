import { globalTarget } from "./global-target";
import { Provider } from "./provider";
import {
	SetInstanceByNewOne,
	SetInstanceFactory,
	SetInstanceImports,
} from "./set-instance";

/**
 * Represents the options for a module.
 */
export interface ModuleOptions {
	/**
	 * An array of modules to import.
	 */
	imports?: any[];

	/**
	 * An array of providers to be registered within the module.
	 */
	providers?: Provider[];

	/**
	 * An array of providers to be exported from the module.
	 */
	exports?: Provider[];
}

export const importFromExportsModule = (
	moduleName: string,
	provide: string
) => {
	return Reflect.getMetadata(`export:${moduleName}:${provide}`, globalTarget);
};

export const getModuleMetadata = (name: string) => {
	const providers = Reflect.getMetadata(`${name}:providers`, globalTarget);
	const imports = Reflect.getMetadata(`${name}:imports`, globalTarget);
	const exports = Reflect.getMetadata(`${name}:exports`, globalTarget);

	return {
		providers,
		imports,
		exports,
	};
};

const setModuleData = (name: string, providers: Record<string, object>) => {
	Reflect.defineMetadata(`${name}:providers`, providers, globalTarget);
};

const defineInstanceSeter = (
	importedInstance: any,
	provider: Provider,
	currentModuleName: string,
	currentProvide: string,
	importedModules: string[]
) => {
	if (importedInstance) {
		return {
			params: {
				instance: importedInstance,
			},
			setInstance: new SetInstanceImports(),
		};
	} else if (provider.useFactory) {
		return {
			params: {
				provider,
				currentModuleName,
				currentProvide,
			},
			setInstance: new SetInstanceFactory(),
		};
	} else if (provider.useClass) {
		return {
			params: {
				importedModules,
				currentProvide,
				currentModuleName,
			},
			setInstance: new SetInstanceByNewOne(),
		};
	} else {
		throw new Error(
			"Invalid provider. useFactory or useClass must be provided."
		);
	}
};

const setInstanceProviders = (
	currentModuleName: string,
	importedModules: string[],
	providers: Provider[]
) => {
	return providers?.reduce<Record<string, object>>((prev, provider) => {
		const currentProvide = provider.provide as string;
		const instances = importedModules
			.map((moduleName) => importFromExportsModule(moduleName, currentProvide))
			.filter((instance) => instance);
		const importedInstance = instances.pop();

		const { setInstance, params } = defineInstanceSeter(
			importedInstance,
			provider,
			currentModuleName,
			currentProvide,
			importedModules
		) as any;
		const instance = setInstance.execute(params);
		prev[currentProvide] = instance;
		return prev;
	}, {}) as Record<string, object>;
};

const setExports = (moduleName: string, exports: Provider[]) => {
	return exports.forEach((exp) => {
		const instance = Reflect.getMetadata(
			`${moduleName}:${exp.provide}`,
			globalTarget
		);
		Reflect.defineMetadata(
			`export:${moduleName}:${exp.provide}`,
			instance,
			globalTarget
		);
	});
};

export const Module = (moduleOptions: ModuleOptions = {}): ClassDecorator => {
	return (target: Function) => {
		const moduleName = target.name;
		const { providers, imports, exports } = moduleOptions;
		const importsModulesNames = imports?.map((module) => module.name) ?? [];

		const providersFormated = setInstanceProviders(
			moduleName,
			importsModulesNames,
			providers ?? []
		);

		setModuleData(target.name, providersFormated);
		setExports(target.name, exports ?? []);
	};
};
