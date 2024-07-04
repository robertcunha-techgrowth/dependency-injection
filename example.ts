import { Inject } from "./src/inject";
import { Injectable } from "./src/injectable";
import { Module } from "./src/module";
import { Provider } from "./src/provider";
import { TechgrowthLabsLambdaHandler } from "./src/techgrowth-labs-lambda-handler";
import dotenv from "dotenv";

dotenv.config({
	path: ".env.test",
});

@Injectable()
export class A {
	constructor(
		@Inject("FactoryAttribute") private readonly factoryAttribute: string
	) {}

	show() {
		console.log(this.factoryAttribute);
		return "MOTHER FUCKER";
	}
}

@Injectable()
export class B {
	constructor(@Inject("A") private readonly a: A) {}

	callA() {
		return this.a.show();
	}
}

@Injectable()
export class C {
	constructor(
		@Inject("A") private readonly a: A,
		@Inject("B") private readonly b: B
	) {}

	callB() {
		return this.b.callA();
	}
}

const FactoryAttributeProvider: Provider = {
	provide: "FactoryAttribute",
	useFactory: () => {
		return "MOTHER FUCKER BITCH CHRORIMPAM, FODA DEMAIS";
	},
};

const AProvider: Provider = {
	useClass: A,
	provide: "A",
};

const BProvider: Provider = {
	useClass: B,
	provide: "B",
};

@Module({
	providers: [FactoryAttributeProvider, AProvider, BProvider],
	exports: [AProvider, BProvider, FactoryAttributeProvider],
})
export class BModule {}

const CProvider: Provider = {
	useClass: C,
	provide: "C",
};

@Module({
	imports: [BModule],
	providers: [CProvider],
})
export class CModule {}

export class Handler extends TechgrowthLabsLambdaHandler {
	async startHandlerFunction(event: any, context: any): Promise<any> {
		const { APP_MAIN_MODULE } = process.env;
		const providers = this.getProviders(APP_MAIN_MODULE as string);
		return providers.C.callB();
	}
}

const handler = new Handler();
handler.startHandlerFunction(null, null);
