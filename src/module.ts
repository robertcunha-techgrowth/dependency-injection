import { globalTarget } from "./global-target";
import { ModuleMetadata } from "./module-metadata";
import { BaseProvider } from "./provider";

export interface ModuleOptions {
	imports?: any[];

	providers?: BaseProvider[];

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

const setImportedModules = (module: any, moduleName: string) => {
	const moduleMetadata = new ModuleMetadata();
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
};

export const Module = (moduleOptions: ModuleOptions = {}): ClassDecorator => {
	return (target: Function) => {
		const moduleName = target.name;
		const { providers, imports, exports } = moduleOptions;

		imports?.map((module) => setImportedModules(module, moduleName));

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
