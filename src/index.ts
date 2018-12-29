import argnames from "@chengaoyuan/argnames";

export interface CacheProtocol {
    get(cache: string, key: string, cb: (value: any | undefined) => void): void;
    set(cache: string, key: string, expire: undefined | number, value: any): void;
    del(cache: string, key: string): void;
    clear(cache: string): void;
}
const $info$: { protocol?: CacheProtocol } = {};

type DescriptorType = TypedPropertyDescriptor<(...args: any[]) => Promise<any>>;
export function Cacheable(config: { cache: string; key: string; expire: undefined | number; condition?: string }) {
    return (target: any, methodName: string, des: DescriptorType) => {
        const args = argnames(des.value as Function).join(",");
        des.value = new Function(
            "$function$",
            "$info$",
            "$cache$",
            `
            return function(${args}) {
                var $self$ = this;
                var $key$ = ${config.key};
                return new Promise(function(resolve, reject){
                    var $protocol$ = $info$.protocol;
                    $protocol$.get($cache$, $key$, function($cacheValue$) {
                        if ($cacheValue$ !== undefined) {
                            resolve($cacheValue$);
                        } else {
                            $function$.call($self$${args ? ", " + args : ""})
                                    .then(function($retValue$){
                                        if ($retValue$ !== undefined) {
                                            if(${config.condition}) {
                                                $protocol$.set($cache$, $key$, ${config.expire}, $retValue$);
                                            }
                                        }
                                        resolve($retValue$);
                                    }, reject);
                        }
                    });
                })
            }
        `
        )(des.value, $info$, config.cache);
    };
}
