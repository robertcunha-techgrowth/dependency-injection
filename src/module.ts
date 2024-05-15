import { globalTarget } from "./global-target";
import { Provider } from "./provider";

export interface MainProvider {
	start(): any;
}

export interface ModuleOptions {
	imports?: ModuleOptions[];
	providers: Provider[];
	exports?: Provider[];

	inject?: any[];
	useFactory?: Function;
}

export interface MainModuleOptions extends ModuleOptions {
	handler: (event: any, context: any) => any;
	mainProvider: string;
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

const setModuleData = (name: string, providers: Record<string, object>) => {
	Reflect.defineMetadata(`${name}:providers`, providers, globalTarget);
};

const setMainModuleData = (
	name: string,
	providersFormated: Record<string, object>,
	handler: ((event: any, context: any) => any) | undefined,
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

const formatProviders = (providers: Provider[]) => {
	return providers?.reduce<Record<string, object>>((prev, provider) => {
		const currentProvide = provider.provide as string;
		prev[currentProvide] = createInstance(currentProvide);
		return prev;
	}, {}) as Record<string, object>;
};

export const Module = (moduleOptions: ModuleOptions): ClassDecorator => {
	return (target: Function) => {
		const { providers } = moduleOptions;
		const providersFormated = formatProviders(providers);

		setModuleData(target.name, providersFormated);
	};
};

export const MainModule = (
	moduleOptions: MainModuleOptions
): ClassDecorator => {
	// target is the constructor function of the class
	return (target: Function) => {
		const { providers, handler, mainProvider } = moduleOptions;
		const providersFormated = formatProviders(providers);

		setMainModuleData(
			target.name,
			providersFormated,
			handler,
			mainProvider as string
		);
	};
};
