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

/**
 * Sets an instance of a module by invoking the constructor function and resolving its dependencies recursively.
 * @param moduleName - The name of the module.
 * @param provide - The name of the provided service.
 * @returns The instance of the module.
 */
const setInstance = (moduleName: string, provide: string) => {
	const constructorFunction = Reflect.getMetadata(
		`${provide}:constructor`,
		globalTarget
	);
	const maxIndex = constructorFunction.length;
	if (maxIndex > 0) {
		const parameters = Array(maxIndex)
			.fill(0)
			.reduce((prev, _, index) => {
				const parameter = Reflect.getMetadata(
					`${provide}:parameters:${index}`,
					globalTarget
				);
				const parameterCreated = setInstance(moduleName, parameter.provide);
				prev.push(parameterCreated);
				return prev;
			}, []);
		const instance = new constructorFunction(...parameters);
		Reflect.defineMetadata(`${moduleName}:${provide}`, instance, globalTarget);
		return instance;
	}
	const instance = new constructorFunction();
	Reflect.defineMetadata(`${moduleName}:${provide}`, instance, globalTarget);
	return instance;
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
const getImportedInstanceFromExport = (moduleName: string, provide: string) => {
	return getInstance(`export:${moduleName}`, provide);
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
			.map((moduleName) =>
				getImportedInstanceFromExport(moduleName, providerName)
			)
			.filter((instance) => instance)
			.pop() ?? setInstance(currentModuleName, providerName)
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
const setProviders = (
	currentModuleName: string,
	importedModules: string[],
	providers: Provider[]
) => {
	return providers?.reduce<Record<string, object>>((prev, provider) => {
		const currentProvide = provider.provide as string;
		prev[currentProvide] = findInstance(
			currentModuleName,
			importedModules,
			currentProvide
		);
		return prev;
	}, {}) as Record<string, object>;
};

/**
 * Retrieves the providers for a given module.
 * @param moduleName - The name of the module.
 * @param providers - An array of providers.
 * @returns An array of metadata values corresponding to the providers.
 */
const getProviders = (moduleName: string, providers: Provider[]) => {
	return providers.map((provider) => {
		return Reflect.getMetadata(
			`${moduleName}:${provider.provide}`,
			globalTarget
		);
	});
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

		const providersFormated = setProviders(
			moduleName,
			importsModulesNames,
			providers ?? []
		);

		setModuleData(target.name, providersFormated);
		setExports(target.name, exports ?? []);
	};
};
