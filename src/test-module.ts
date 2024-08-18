import { ModuleMetadata } from "./module-metadata";

const moduleMetadataObj = new ModuleMetadata();

export class TestModule {
	private module: any;
	private moduleMetadata: ModuleMetadata;

	constructor(module: any) {
		this.module = module;
	}

	get<ProviderType>(moduleName: string, providerName: string): ProviderType {
		const provider = this.moduleMetadata.getProviderMetadata(
			moduleName,
			providerName
		);
		return provider;
	}
}
