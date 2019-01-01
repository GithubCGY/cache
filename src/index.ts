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
        )(des.value, $info$, config.cache);
    };
}

export function CachePut(config: { cache: string; key: string; expire: undefined | number; condition?: string }) {
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
        )(des.value, $info$, config.cache);
    };
}

export function CacheEvict(config: { cache: string; key: string; condition?: string }) {
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
        )(des.value, $info$, config.cache);
    };
}

export function CacheEvictAll(config: { cache: string; condition?: string }) {
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
        )(des.value, $info$, config.cache);
    };
}

import { RedisClient } from "redis";
function errorPrint(err: Error | null) {
    if (err) {
        console.error(err);
    }
}

export default class RedisCache implements CacheProtocol {
    redisClient: RedisClient;
    constructor(redisClient: RedisClient) {
        this.redisClient = redisClient;
    }
    get(cache: string, key: string, cb: (value: any | undefined) => void): void {
        this.redisClient.get(`${cache}::${key}`, function(err, reply) {
            if (err) {
                errorPrint(err);
                cb(undefined);
            } else {
                try {
                    var value = JSON.parse(reply);
                } catch (parseErr) {
                    errorPrint(parseErr);
                    cb(undefined);
                    return;
                }
                cb(value);
            }
        });
    }
    set(cache: string, key: string, expire: undefined | number, value: any): void {
        try {
            var data = JSON.stringify(value);
        } catch (err) {
            errorPrint(err);
            return;
        }
        if (expire === undefined) {
            this.redisClient.set(`${cache}::${key}`, data, errorPrint);
        } else {
            this.redisClient.setex(`${cache}::${key}`, expire, data, errorPrint);
        }
    }
    del(cache: string, key: string): void {
        this.redisClient.del(`${cache}::${key}`, errorPrint);
    }
    clear(cache: string): void {
        this.scanAndDel(`${cache}::*`, "0");
    }
    scanAndDel(match: string, cursor: string) {
        this.redisClient.scan(cursor, "MATCH", match, "COUNT", "100", (err, reply) => {
            if (err) {
                errorPrint(err);
            } else {
                const [newCursor, keys] = reply;
                if (keys.length) {
                    this.redisClient.del(keys);
                }
                if (newCursor !== "0") {
                    this.scanAndDel(match, newCursor);
                }
            }
        });
    }
}
