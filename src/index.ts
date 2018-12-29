import argnames from "@chengaoyuan/argnames";
import prepare from "@chengaoyuan/prepare";

type DescriptorType = TypedPropertyDescriptor<(...args: any[]) => Promise<any>>;
type DecoratorType = (target: any, methodName: string, des: DescriptorType) => void;
export function Cacheable(cache: string): DecoratorType;
export function Cacheable({  }: {}): DecoratorType;

export function Cacheable(...args: any[]) {
    return (target: any, methodName: string, des: DescriptorType) => {
        //
        console.log(target.constructor.name);
    };
}

class A {
    @Cacheable({})
    async b() {
        return null;
    }
}
