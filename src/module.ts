import { globalTarget } from "./global-target";
import { Provider } from "./provider";

export interface MainProvider {
	start(): any;
}

export interface ModuleOptions {
	imports?: any[];
	providers?: Provider[];
	exports?: Provider[];
}

const checkInstance = (instance: any, provide: string) => {
	if (!instance) {
		console.error(
			`${new Date().toISOString()}: Instance not found for ${provide}. Please check if the provider was imported.`
		);
		throw new Error(`Instance not found for ${provide}`);
	}
};

/**
 * Sets an instance of a module by invoking the constructor function and resolving its dependencies recursively.
 * @param moduleName - The name of the module.
 * @param provide - The name of the provided service.
 * @returns The instance of the module.
 */
const createInstance = (
	importedModules: any[],
	moduleName: string,
	provide: string
) => {
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
					const parameter = Reflect.getMetadata(
						`${provide}:parameters:${index}`,
						globalTarget
					);
					const importedParameter = importedModules
						.map((module) => importFromExportsModule(module, parameter.provide))
						.filter((instance) => instance)
						.pop();

					if (importedParameter) {
						prev.push(importedParameter);
						return prev;
					}
					const parameterCreated = createInstance(
						importedModules,
						moduleName,
						parameter.provide
					);
					prev.push(parameterCreated);
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
		checkInstance(instance, provide);
		Reflect.defineMetadata(`${moduleName}:${provide}`, instance, globalTarget);
		return instance;
	} else {
		const instance = getInstance(moduleName, provide);
		checkInstance(instance, provide);
		return instance;
	}
};

/**
 * Retrieves an instance of a provided module from the global target.
 *
 * @param moduleName - The name of the module.
 * @param provide - The name of the provided instance.
 * @returns The instance of the provided module.
 */
const getInstance = (moduleName: string, provide: string) => {
	return Reflect.getMetadata(`${moduleName}:${provide}`, globalTarget);
};

/**
 * Retrieves an imported instance from a module's export.
 *
 * @param moduleName - The name of the module.
 * @param provide - The name of the exported instance to retrieve.
 * @returns The imported instance.
 */
const importFromExportsModule = (moduleName: string, provide: string) => {
	return Reflect.getMetadata(`export:${moduleName}:${provide}`, globalTarget);
};

/**
 * Retrieves the metadata for a module.
 * @param name - The name of the module.
 * @returns An object containing the providers, handler, and mainProvider metadata.
 */
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

/**
 * Sets the module data by storing the provided providers under the given name.
 * @param name - The name of the module.
 * @param providers - An object containing the providers.
 */
const setModuleData = (name: string, providers: Record<string, object>) => {
	Reflect.defineMetadata(`${name}:providers`, providers, globalTarget);
};

/**
 * Finds the instance of a provider within the imported modules or sets a new instance if not found.
 * @param currentModuleName - The name of the current module.
 * @param importedModulesNames - An array of imported module names.
 * @param providerName - The name of the provider to find.
 * @returns The instance of the provider if found, otherwise a new instance set for the current module.
 */
const findInstance = (
	currentModuleName: string,
	importedModulesNames: string[],
	providerName: string
) => {
	return (
		importedModulesNames
			.map((moduleName) => importFromExportsModule(moduleName, providerName))
			.filter((instance) => instance)
			.pop() ??
		createInstance(importedModulesNames, currentModuleName, providerName)
	);
};

/**
 * Sets the providers for a module.
 *
 * @param currentModuleName - The name of the current module.
 * @param importedModules - An array of imported module names.
 * @param providers - An array of providers.
 * @returns A record of providers with their corresponding instances.
 */
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
		if (importedInstance) {
			prev[currentProvide] = importedInstance;
			return prev;
		}

		const factoryInstance = provider.useFactory?.();

		if (factoryInstance) {
			Reflect.defineMetadata(
				`${currentModuleName}:${currentProvide}`,
				factoryInstance,
				globalTarget
			);
			prev[currentProvide] = factoryInstance;
			return prev;
		}

		const instanceCreated = createInstance(
			importedModules,
			currentModuleName,
			currentProvide
		);

		prev[currentProvide] = instanceCreated;
		return prev;
	}, {}) as Record<string, object>;
};

/**
 * Sets the exports for a module.
 * @param moduleName - The name of the module.
 * @param exports - An array of providers to be exported.
 */
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

/**
 * Decorator function that defines a module.
 *
 * @param moduleOptions - The options for the module.
 * @returns A class decorator function.
 */
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
