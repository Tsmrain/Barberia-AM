/**
 * Simple in-memory cache with TTL support
 * High cohesion: Single responsibility for caching
 */

interface CacheEntry<T> {
    data: T;
    expires: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export const memoryCache = {
    /**
     * Get cached value if not expired
     */
    get<T>(key: string): T | null {
        const entry = cache.get(key) as CacheEntry<T> | undefined;

        if (!entry) return null;

        if (Date.now() > entry.expires) {
            cache.delete(key);
            return null;
        }

        return entry.data;
    },

    /**
     * Set value with optional TTL
     */
    set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL): void {
        cache.set(key, {
            data,
            expires: Date.now() + ttlMs,
        });
    },

    /**
     * Invalidate specific key
     */
    invalidate(key: string): void {
        cache.delete(key);
    },

    /**
     * Invalidate all keys matching prefix
     */
    invalidatePrefix(prefix: string): void {
        for (const key of cache.keys()) {
            if (key.startsWith(prefix)) {
                cache.delete(key);
            }
        }
    },

    /**
     * Clear entire cache
     */
    clear(): void {
        cache.clear();
    },
};

// Cache keys constants for consistency
export const CACHE_KEYS = {
    BRANCHES: 'catalog:branches',
    SERVICES: 'catalog:services',
    BARBERS: (branchId?: string) => branchId ? `catalog:barbers:${branchId}` : 'catalog:barbers:all',
} as const;
