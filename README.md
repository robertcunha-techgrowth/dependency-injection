# Techgrowth Labs Dependency Injection Framework

Dependency injection is a advanced technique of software engine to allow the developers to segregate the responsability of create instance for each dependency they have.

# Decorators

## Injectable()

Injectable is used to make possible a class be used as provider and fit into the Inject decorator.

```javascript
@Injectable()
export class Example {}
```

## Inject(propertyClassName: string)

Inject is used to set a dependency into a class. You must set the propertyClassName, that will be used as provide name. The class needs to be decorated with Injectable to be a valid provider.

```javascript
@Injectable()
export class Example {}

@Injectable()
export class ComposedClass {
	constructor(@Inject("ExampleProvide") example: Example) {}
}
```

## Module(moduleOptions: ModuleOptions)

Module is the decorator for an empty class, and serves as a reference to the module.

```javascript
const ExampleProvider: Provider = {};

@Module({
	providers: [],
})
export class ExampleModule {}
```

### Imports

For each import, there is a processing, to bring the imports, providers, handlers

## How to use?

### Creating Modules

```javascript
import { Module } from "@techgrowth-labs/dependency-injection";

@Injectable()
export class ProviderA {
	sayHi() {
		console.log("HI");
	}
}

@Module({
	providers: [
		{
			provide: "A",
			useClass: ProviderA,
		},
	],
})
export class AModule {}
```

### useFactory

```javascript
@Module({
	providers: [
		{
			provide: "AxiosInstance",
			useFactory: () => {
				return axios.create({
					baseURL: process.env.URL,
					headers: {}
				})
			}
		}
	]
})
```

You are free to use factory in any way you want.

### Create the handler and override the lambda base function

```javascript
import { TechgrowthLabsLambdaHandler } from "@techgrowth-labs/dependency-injection";
export class Handler extends TechgrowthLabsLambdaHandler {
	override startHandlerFunction(event: any, context: any) {
		const providers = this.getProviders();

		// implement your function here, using providers
	}
}
```

### Create the index.ts

```javascript
import { Handler } from "./handler.ts";

const handler = new Handler(MainModule);

export const { handler } = handler;
```

Set MainModule on constructor Handler.

### Complex use of Reflect

We use reflect to set some important configuration for Dependency Injection

- Injectable: defines a constructor of a class. The structure to create a key for the injectable classes is `${className}:constructor`

- Inject: defines each parameter from a class. The structure to create a key for the injected parameter is `${className}:parameters:${index}`.
