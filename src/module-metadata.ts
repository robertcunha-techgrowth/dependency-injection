import { globalTarget } from "./global-target";
import { BaseProvider } from "./provider";

export class ModuleMetadata {
	public getModuleMetadata(name: string) {
		const providers: Record<string, any> = Reflect.getMetadata(
			`${name}:providers`,
			globalTarget
		);
		const imports = Reflect.getMetadata(`${name}:imports`, globalTarget);
		const exports: BaseProvider[] = Reflect.getMetadata(
			`${name}:exports`,
			globalTarget
		);

		return {
			providers,
			imports,
			exports,
		};
	}

	public getInstance(moduleName: string, provide: string) {
		return Reflect.getMetadata(
			`${moduleName}:provider:${provide}`,
			globalTarget
		);
	}

	public setProviderMetadata(
		moduleName: string,
		provide: string,
		instance: any
	) {
		const tag = `${moduleName}:provider:${provide}`;
		Reflect.defineMetadata(tag, instance, globalTarget);
		return tag;
	}
}
