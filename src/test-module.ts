import { ModuleOptions, getModuleMetadata } from "./module";

export class TestModule {
	private providers: any;

	constructor(name: string) {
		const moduleMetadata = getModuleMetadata(name);
		this.providers = moduleMetadata.providers;
	}

	get<ProviderType>(typeProvider: string): ProviderType {
		const provider = this.providers[typeProvider] as ProviderType;
		return provider;
	}
}
