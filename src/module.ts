import { globalTarget } from "./global-target";
import { ModuleMetadata } from "./module-metadata";
import { BaseProvider } from "./provider";

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
	providers?: BaseProvider[];

	/**
	 * An array of providers to be exported from the module.
	 */
	exports?: BaseProvider[];
}

const getExportFromModule = (moduleName: string, provide: string) => {
	return Reflect.getMetadata(`export:${moduleName}:${provide}`, globalTarget);
};

export const findInstanceFromExportModule = (
	importedModules: string[],
	currentProvide: string
) => {
	return importedModules
		.map((moduleName) => getExportFromModule(moduleName, currentProvide))
		.filter((instance) => instance)
		.pop();
};

const setExports = (moduleName: string, exports: BaseProvider[]) => {
	Reflect.defineMetadata(`${moduleName}:exports`, exports, globalTarget);
};

export const Module = (moduleOptions: ModuleOptions = {}): ClassDecorator => {
	return (target: Function) => {
		const moduleMetadata = new ModuleMetadata();
		const moduleName = target.name;
		const { providers, imports, exports } = moduleOptions;

		imports?.map((module) => {
			const { exports: exportsFromImports } = moduleMetadata.getModuleMetadata(
				module.name
			);
			return exportsFromImports.map((exportedProvider) => {
				const instance = moduleMetadata.getInstance(
					module.name,
					exportedProvider.provide as string
				);
				moduleMetadata.setProviderMetadata(
					moduleName,
					exportedProvider.provide as string,
					instance
				);
				return instance;
			});
		});

		const instancesAsObject = providers?.reduce<Record<string, object>>(
			(prev, provider) => {
				const instance = provider.createInstance(
					moduleName,
					provider.provide as string
				);
				const key = provider.provide as string;
				prev[key] = instance;
				return prev;
			},
			{}
		);

		Reflect.defineMetadata(
			`${moduleName}:providers`,
			instancesAsObject,
			globalTarget
		);

		setExports(target.name, exports ?? []);
	};
};
