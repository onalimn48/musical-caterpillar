// Polyfill for window.storage (Claude artifact API) using localStorage
// This makes games that were built for Claude artifacts work on a real website

if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    async get(key, shared = false) {
      try {
        const prefix = shared ? '__shared__' : '__local__';
        const val = localStorage.getItem(prefix + key);
        if (val === null) throw new Error('Not found');
        return { key, value: val, shared };
      } catch (e) {
        throw e;
      }
    },
    async set(key, value, shared = false) {
      try {
        const prefix = shared ? '__shared__' : '__local__';
        localStorage.setItem(prefix + key, value);
        return { key, value, shared };
      } catch (e) {
        return null;
      }
    },
    async delete(key, shared = false) {
      try {
        const prefix = shared ? '__shared__' : '__local__';
        localStorage.removeItem(prefix + key);
        return { key, deleted: true, shared };
      } catch (e) {
        return null;
      }
    },
    async list(prefix = '', shared = false) {
      try {
        const storagePrefix = shared ? '__shared__' : '__local__';
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k.startsWith(storagePrefix + prefix)) {
            keys.push(k.slice(storagePrefix.length));
          }
        }
        return { keys, prefix, shared };
      } catch (e) {
        return { keys: [], prefix, shared };
      }
    }
  };
}
