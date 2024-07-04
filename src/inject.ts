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
				provide: propertyClassName,
			},
			globalTarget,
			propertyKey as string
		);
	};
};
