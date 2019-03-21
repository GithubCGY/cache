import argnames from "@chengaoyuan/argnames";
import CacheProtocol from "./CacheProtocol";

type DescriptorType = TypedPropertyDescriptor<(...args: any[]) => Promise<any>>;

export class Cache {
    readonly protocol: CacheProtocol;
    constructor(protocol: CacheProtocol) {
        this.protocol = protocol;
    }

    Cacheable(config: { cache: string; key: string; expire: undefined | number; condition?: string }) {
        return (target: any, methodName: string, des: DescriptorType) => {
            const args = argnames(des.value as Function).join(",");

            des.value = new Function(
                "$function$",
                "$info$",
                "$cache$",
                `
                return function(${args}) {
                    var $self$ = this;
                    var $key$ = ${config.key ? config.key : ""};
                    return new Promise(function(resolve, reject){
                        var $protocol$ = $info$.protocol;
                        $protocol$.get($cache$, $key$, function($cacheValue$) {
                            if ($cacheValue$ !== undefined) {
                                resolve($cacheValue$);
                            } else {
                                $function$.call($self$${args ? ", " + args : ""})
                                        .then(function($retValue$){
                                            if ($retValue$ !== undefined) {
                                                if(${config.condition ? config.condition : true}) {
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
            )(des.value, this, config.cache);
        };
    }

    CachePut(config: { cache: string; key: string; expire: undefined | number; condition?: string }) {
        return (target: any, methodName: string, des: DescriptorType) => {
            const args = argnames(des.value as Function).join(",");
            des.value = new Function(
                "$function$",
                "$info$",
                "$cache$",
                `
                return function(${args}) {
                    var $self$ = this;
                    var $key$ = ${config.key ? config.key : ""};
                    return new Promise(function(resolve, reject){
                        var $protocol$ = $info$.protocol;
                        $function$.call($self$${args ? ", " + args : ""})
                                .then(function($retValue$){
                                    if ($retValue$ !== undefined) {
                                        if(${config.condition ? config.condition : true}) {
                                            $protocol$.set($cache$, $key$, ${config.expire}, $retValue$);
                                        }
                                    }
                                    resolve($retValue$);
                                }, reject);
                    })
                }
            `
            )(des.value, this, config.cache);
        };
    }

    CacheEvict(config: { cache: string; key: string; condition?: string }) {
        return (target: any, methodName: string, des: DescriptorType) => {
            const args = argnames(des.value as Function).join(",");
            des.value = new Function(
                "$function$",
                "$info$",
                "$cache$",
                `
                return function(${args}) {
                    var $self$ = this;
                    var $key$ = ${config.key ? config.key : ""};
                    return new Promise(function(resolve, reject){
                        var $protocol$ = $info$.protocol;
                        $function$.call($self$${args ? ", " + args : ""})
                                .then(function($retValue$){
                                    resolve($retValue$);
                                    if(${config.condition ? config.condition : true}) {
                                        $protocol$.del($cache$, $key$);
                                    }
                                }, reject);
                    })
                }
            `
            )(des.value, this, config.cache);
        };
    }

    CacheEvictAll(config: { cache: string; condition?: string }) {
        return (target: any, methodName: string, des: DescriptorType) => {
            const args = argnames(des.value as Function).join(",");
            des.value = new Function(
                "$function$",
                "$info$",
                "$cache$",
                `
                return function(${args}) {
                    var $self$ = this;
                    return new Promise(function(resolve, reject){
                        var $protocol$ = $info$.protocol;
                        $function$.call($self$${args ? ", " + args : ""})
                                .then(function($retValue$){
                                    resolve($retValue$);
                                    if(${config.condition ? config.condition : true}) {
                                        $protocol$.clear($cache$);
                                    }
                                }, reject);
                    })
                }
            `
            )(des.value, this, config.cache);
        };
    }

    CacheableLock(config: { cache: string; key: string; expire: undefined | number; lockTime?: number; condition?: string }) {
        return (target: any, methodName: string, des: DescriptorType) => {
            const args = argnames(des.value as Function).join(",");
            const lockTime = config.lockTime ? config.lockTime : 3;
            des.value = new Function(
                "$function$",
                "$info$",
                "$cache$",
                `
                return function(${args}) {
                    var $self$ = this;
                    var $key$ = ${config.key ? config.key : ""};
                    return new Promise(function(resolve, reject){
                        var $protocol$ = $info$.protocol;
                        $protocol$.lock($cache$, $key$, ${lockTime}, function($getLockResult$) {
                            if($getLockResult$) {
                                $protocol$.get($cache$, $key$,  function($cacheValue$) {
                                    $protocol$.unlock($cache$, $key$);
                                    if ($cacheValue$ !== undefined) {
                                        resolve($cacheValue$);
                                    } else {
                                        $function$.call($self$${args ? ", " + args : ""})
                                                .then(function($retValue$){
                                                    if ($retValue$ !== undefined) {
                                                        if(${config.condition ? config.condition : true}) {
                                                            $protocol$.lock($cache$, $key$, ${lockTime}, function($setLockResult$){
                                                                if($setLockResult$) {
                                                                    $protocol$.set($cache$, $key$, ${config.expire}, $retValue$);
                                                                    $protocol$.unlock($cache$, $key$);
                                                                }
                                                            });
                                                        }
                                                    }
                                                    resolve($retValue$);
                                                }, reject);
                                    }
                                });
                            } else {
                                $function$.call($self$${args ? ", " + args : ""})
                                    .then(resolve, reject);
                            }
                            
                        })
                    })
                }
            `
            )(des.value, this, config.cache);
        };
    }

    CacheEvictLock(config: { cache: string; key: string; lockTime?: number; condition?: string }) {
        return (target: any, methodName: string, des: DescriptorType) => {
            const args = argnames(des.value as Function).join(",");
            const lockTime = config.lockTime ? config.lockTime : 3;
            des.value = new Function(
                "$function$",
                "$info$",
                "$cache$",
                `
                return function(${args}) {
                    var $self$ = this;
                    var $key$ = ${config.key ? config.key : ""};
                    return new Promise(function(resolve, reject){
                        var $protocol$ = $info$.protocol;
                        $function$.call($self$${args ? ", " + args : ""})
                                .then(function($retValue$){
                                    resolve($retValue$);
                                    if(${config.condition ? config.condition : true}) {
                                        $protocol$.lock($cache$, $key$, ${lockTime}, function($delLockResult$) {
                                            if($delLockResult$) {
                                                $protocol$.del($cache$, $key$);
                                                $protocol$.unlock($cache$, $key$);
                                            }
                                        });
                                    }
                                }, reject);
                    })
                }
            `
            )(des.value, this, config.cache);
        };
    }
}
