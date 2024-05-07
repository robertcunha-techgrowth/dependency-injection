import { globalTarget } from "./global-target";
import { Provider } from "./provider";

export interface MainProvider {
	start(): any;
}

export interface ModuleOptions {
	imports?: ModuleOptions[];
	providers?: Provider[];
	exports?: [];
	handler?: (event: any, context: any) => any;
	mainProvider?: string;
}

const createInstance = (provide: string) => {
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
				const parameterCreated = createInstance(parameter.provide);
				prev.push(parameterCreated);
				return prev;
			}, []);
		return new constructorFunction(...parameters);
	}
	return new constructorFunction();
};

const setModuleMetadata = (
	name: string,
	providersFormated: any,
	handler: (event: any, context: any) => any,
	mainProvider: MainProvider
) => {
	Reflect.defineMetadata(`${name}:providers`, providersFormated, globalTarget);
	Reflect.defineMetadata(`${name}:handler`, handler, globalTarget);
	Reflect.defineMetadata(`${name}:mainProvider`, mainProvider, globalTarget);
};

export const getModuleMetadata = (name: string) => {
	const providers = Reflect.getMetadata(`${name}:providers`, globalTarget);
	const handler: (event: any, context: any) => any = Reflect.getMetadata(
		`${name}:handler`,
		globalTarget
	);
	const mainProvider: MainProvider = Reflect.getMetadata(
		`${name}:mainProvider`,
		globalTarget
	);

	return {
		providers,
		handler,
		mainProvider,
	};
};

export const Module = (moduleOptions: ModuleOptions = {}): ClassDecorator => {
	return (target: Function) => {
		const { providers, handler, mainProvider } = moduleOptions;
		const providersFormated: any = providers?.reduce<Record<string, object>>(
			(prev, provider) => {
				const currentProvide = provider.provide as string;
				prev[currentProvide] = createInstance(currentProvide);
				return prev;
			},
			{}
		);
		Reflect.defineMetadata(
			`${target.name}:providers`,
			providersFormated,
			globalTarget
		);
		Reflect.defineMetadata(`${target.name}:handler`, handler, globalTarget);
		Reflect.defineMetadata(
			`${target.name}:mainProvider`,
			providersFormated[mainProvider as string],
			globalTarget
		);
	};
};
