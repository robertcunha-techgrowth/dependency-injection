import { ModuleMetadata } from "./module-metadata";

export abstract class TechgrowthLabsLambdaHandler {
	constructor(protected readonly module: any) {}

	abstract handler(event: any, context: any): Promise<any>;

	protected getProviders(moduleName: string) {
		const moduleMetadata = new ModuleMetadata();
		const module = moduleMetadata.getModuleMetadata(moduleName);
		return module.providers;
	}
}
