import { globalTarget } from "./global-target";

export const Inject = (propertyClassName: string): ParameterDecorator => {
	return (
		target: any,
		propertyKey: string | symbol | undefined,
		parameterIndex: number
	) => {
		const className = target.name;
		Reflect.defineMetadata(
			`${className}:parameters:${parameterIndex}`,
			{
				useClass: target,
				provide: propertyClassName,
			},
			globalTarget,
			propertyKey as string
		);
	};
};
