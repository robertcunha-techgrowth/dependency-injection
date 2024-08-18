import { ModuleMetadata } from "./module-metadata";

const moduleMetadataObj = new ModuleMetadata();

export class TestModule {
	private module: any;
	private moduleMetadata: ModuleMetadata;

	constructor(module: any) {
		this.module = module;
		this.moduleMetadata = new ModuleMetadata();
	}

	get<ProviderType>(providerName: string): ProviderType {
		const provider = this.moduleMetadata.getProviderMetadata(
			this.module.name,
			providerName
		);
		return provider;
	}
}
