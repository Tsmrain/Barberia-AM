export const cacheService = {
    get: <T>(key: string): T | null => {
        if (typeof window === 'undefined') return null;
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        try {
            const { data, timestamp } = JSON.parse(cached);
            // 15 minutes cache to aggressively save reads
            if (Date.now() - timestamp < 15 * 60 * 1000) {
                return data as T;
            }
        } catch (e) {
            console.error("Cache parse error", e);
        }
        return null;
    },

    set: (key: string, data: any) => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(key, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.error("Cache write error", e);
        }
    },

    remove: (key: string) => {
        if (typeof window !== 'undefined') localStorage.removeItem(key);
    }
};
