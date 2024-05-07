import { getModuleMetadata } from "./module";

export class TechgrowthLabsApp {
	static startHandlerFunction(event: any, context: any, mainModule: any) {
		const name = mainModule.name;
		const moduleMetadata = getModuleMetadata(name);
		const { handler } = moduleMetadata;
		return handler(event, context);
	}
}
