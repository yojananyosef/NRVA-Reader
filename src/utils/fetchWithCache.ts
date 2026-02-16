const CACHE_NAME = 'astro-reader-data-v4';
const TTL = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos

// Clase LRU Cache simple
class LRUCache<K, V> {
    private capacity: number;
    private cache: Map<K, V>;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.cache = new Map<K, V>();
    }

    get(key: K): V | undefined {
        if (!this.cache.has(key)) return undefined;
        const value = this.cache.get(key)!;
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    set(key: K, value: V): void {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.capacity) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
    }

    has(key: K): boolean {
        return this.cache.has(key);
    }

    clear(): void {
        this.cache.clear();
    }
}

// Caché en memoria con LRU (Límite de 50 items)
const memoryCache = new LRUCache<string, any>(50);

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

export async function fetchWithCache<T>(url: string): Promise<T> {
    // 1. Intentar desde la memoria (lo más rápido)
    if (memoryCache.has(url)) {
        return memoryCache.get(url);
    }

    try {
        // 2. Intentar desde Cache Storage API (Persiste tras recargar)
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(url);

        if (cachedResponse) {
            const entry: CacheEntry<T> = await cachedResponse.json();
            const now = Date.now();

            // Verificar si el TTL ha expirado
            if (now - entry.timestamp < TTL) {
                memoryCache.set(url, entry.data);
                return entry.data;
            } else {
                // Si expiró, lo borramos de la caché
                await cache.delete(url);
            }
        }

        // 3. Si no está en caché o expiró, ir a la red
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }

        const data = await response.json();

        // Guardar en memoria
        memoryCache.set(url, data);

        // Guardar en Cache Storage con timestamp para el TTL
        const entryToCache: CacheEntry<T> = {
            data,
            timestamp: Date.now()
        };

        const blob = new Blob([JSON.stringify(entryToCache)], { type: 'application/json' });
        const cacheResponse = new Response(blob);
        await cache.put(url, cacheResponse);

        return data;
    } catch (error) {
        console.error(`Cache API error for ${url}:`, error);

        // Fallback: si falla la Cache API (por ejemplo en modo incógnito), intentar fetch normal
        const response = await fetch(url);
        return await response.json();
    }
}

export async function clearCache() {
    memoryCache.clear();
    if ('caches' in window) {
        await caches.delete(CACHE_NAME);
    }
}
