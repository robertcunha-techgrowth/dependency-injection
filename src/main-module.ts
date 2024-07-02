import { globalTarget } from "./global-target";
import { ModuleOptions, setProviders, setModuleData } from "./module";
import { Provider } from "./provider";

const setMainModuleData = (
	name: string,
	providersFormated: Record<string, object>,
	handler: ((event: any, context: any, provider: Provider) => any) | undefined,
	mainProvider: string
) => {
	setModuleData(name, providersFormated);
	Reflect.defineMetadata(`${name}:handler`, handler, globalTarget);
	Reflect.defineMetadata(
		`${name}:mainProvider`,
		providersFormated[mainProvider as string],
		globalTarget
	);
};

export interface MainModuleOptions extends ModuleOptions {
	handler: (event: any, context: any, provider: Provider) => any;
	mainProvider: string;
}

export const MainModule = (
	moduleOptions: MainModuleOptions
): ClassDecorator => {
	// target is the constructor function of the class
	return (target: any) => {
		const moduleName = target.name;
		const { providers, handler, mainProvider, imports } = moduleOptions;
		const importsModulesNames = imports?.map((module) => module.name) ?? [];

		const providersFormated = setProviders(
			moduleName,
			importsModulesNames,
			providers ?? []
		);

		setMainModuleData(
			moduleName,
			providersFormated,
			handler,
			mainProvider as string
		);

		// target.getMainProvider = () => {
		// 	return Reflect.getMetadata(`${moduleName}:mainProvider`, globalTarget);
		// };
	};
};
