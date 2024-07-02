# Techgrowth Labs Dependency Injection Framework

Dependency injection is a advanced technique of software engine to allow the developers to segregate the responsability of create instance for each dependency they have.

# Decorators

## Inject(propertyClassName: string)

Inject is used to set a dependency into a class. You must set the propertyClassName, that will be used as provide name. The class needs to be decorated with Injectable to be a valid provider.

```javascript
export class Example {}

export class ComposedClass {
	constructor(@Inject("ExampleProvide") example: Example) {}
}
```

## Injectable()

Injectable is used to make possible a class be used as provider and fit into the Inject decorator.

```javascript
@Injectable()
export class Example {}
```

## Module(moduleOptions: ModuleOptions)

Module is the decorator for an empty class, and serves as a reference to the module.

```javascript
@Module({
	providers: [],
})
export class ExampleModule {}
```

### Imports

For each import, there is a processing, to bring the imports, providers, handlers

## MainModule

- MainProvider: Provider responsible to bear all other providers. It's the core of application
- handler: Handler is the function responsible to process the event and context from lambda. It implements the code that will execute on lambda.
