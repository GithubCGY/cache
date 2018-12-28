import argnames from "@chengaoyuan/argnames";
import prepare from "@chengaoyuan/prepare";

export function Cacheable({
    name = "", // 如果不传
    key = "",
    expire = 1,
    condition = ""
}) {
    type FuncType = (...args: any[]) => Promise<any>;
    type DesType = TypedPropertyDescriptor<FuncType>;
    return (target: any, methodName: string, des: DesType) => {
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
