import { ModuleMetadata } from "./module-metadata";

const moduleMetadataObj = new ModuleMetadata();

export class TestModule {
	private providers: any;

	constructor(name: string) {
		const moduleMetadata = moduleMetadataObj.getModuleMetadata(name);
		this.providers = moduleMetadata.providers;
	}

	get<ProviderType>(typeProvider: string): ProviderType {
		const provider = this.providers[typeProvider] as ProviderType;
		return provider;
	}
}
