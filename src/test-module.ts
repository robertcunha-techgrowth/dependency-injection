import { ModuleMetadata } from "./module-metadata";

const moduleMetadataObj = new ModuleMetadata();

export class TestModule {
	private providers: any;
	constructor(module: any) {
		const moduleMetadata = moduleMetadataObj.getModuleMetadata(module.name);
		this.providers = moduleMetadata.providers;
	}

	get<ProviderType>(typeProvider: string): ProviderType {
		const provider = this.providers[typeProvider] as ProviderType;
		return provider;
	}
}
