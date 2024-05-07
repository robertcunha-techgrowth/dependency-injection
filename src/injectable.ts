import "reflect-metadata";
import { globalTarget } from "./global-target";

export const Injectable = (): ClassDecorator => {
	return (target: Function) => {
		const className = target.name;
		Reflect.defineMetadata(`${className}:constructor`, target, globalTarget);
	};
};
