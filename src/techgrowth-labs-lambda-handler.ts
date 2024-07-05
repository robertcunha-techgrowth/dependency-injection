import { getModuleMetadata } from "./module";

export abstract class TechgrowthLabsLambdaHandler {
	abstract handler(event: any, context: any): Promise<any>;

	protected getProviders(moduleName: string) {
		const module = getModuleMetadata(moduleName);
		return module.providers;
	}
}
