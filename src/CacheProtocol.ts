interface CacheLocker {
    lock(expire: number, cb: (result: boolean) => void): void;
    unlock(): void;
}
export default interface CacheProtocol {
    get(cache: string, key: string, cb: (value: any | undefined) => void): void;
    set(cache: string, key: string, expire: undefined | number, value: any): void;
    del(cache: string, key: string): void;
    clear(cache: string): void;
    create_locker(cache: string, key: string): CacheLocker;
}
