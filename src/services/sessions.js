// In-memory sessions with a TTL, so an abandoned chat does not trap a
// rider half-way through the form (and the map cannot grow forever).
// Swap for Redis if this ever runs on more than one instance.
function createStore(ttlMs, now = () => Date.now()) {
    const map = new Map();
    return {
        get(key) {
            const hit = map.get(key);
            if (!hit) return null;
            if (now() - hit.at > ttlMs) { map.delete(key); return null; }
            return hit.session;
        },
        set(key, session) {
            if (session) map.set(key, { session, at: now() });
            else map.delete(key);
        },
        sweep() {
            for (const [k, v] of map) if (now() - v.at > ttlMs) map.delete(k);
        },
        get size() { return map.size; },
    };
}

module.exports = { createStore };
