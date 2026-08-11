L.cache = {_storage: {}};

L.cache.set = function (key, value, timeoutSeconds) {
    const expiresAt = Date.now() + timeoutSeconds * 1000;
    L.cache._storage[key] = { value, expiresAt };
    setTimeout(() => L.cache.delete(key), timeoutSeconds * 1000 + 1000);
}

L.cache.get = function (key) {
    const cachedItem = L.cache._storage[key];

    if (cachedItem && Date.now() < cachedItem.expiresAt) {
        return cachedItem.value;
    } else {
        delete L.cache._storage[key];
        return undefined;
    }
}

L.cache.getIfExists = function (key) {
    const value = L.cache.get(key);
    return [value !== undefined, value];
}

L.cache.delete = function (key) {
    delete L.cache._storage[key];
}

L.cache.clear = function () {
    L.cache._storage = {};
}