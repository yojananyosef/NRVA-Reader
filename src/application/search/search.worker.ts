export interface VerseEntry {
    b: string;
    bn: string;
    c: number;
    v: number;
    t: string;
}

export interface WorkerSearchRequest {
    query: string;
    index: VerseEntry[];
    limit?: number;
}

export interface WorkerSearchResponse {
    results: VerseEntry[];
    query: string;
    durationMs: number;
}

function normalize(text: string): string {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

self.onmessage = (e: MessageEvent<WorkerSearchRequest>) => {
    const { query, index, limit = 150 } = e.data;

    if (!query || query.trim().length < 3 || !index || index.length === 0) {
        self.postMessage({ results: [], query, durationMs: 0 });
        return;
    }

    const startTime = performance.now();
    const normalizedQuery = normalize(query.trim());
    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

    const results: VerseEntry[] = [];

    for (let i = 0; i < index.length; i++) {
        const entry = index[i];
        const normalizedText = normalize(entry.t);

        // Check if all tokens match (FTS-style AND condition)
        let matchesAll = true;
        for (let j = 0; j < queryTokens.length; j++) {
            if (!normalizedText.includes(queryTokens[j])) {
                matchesAll = false;
                break;
            }
        }

        if (matchesAll) {
            results.push(entry);
            if (results.length >= limit) break;
        }
    }

    const durationMs = performance.now() - startTime;
    self.postMessage({ results, query, durationMs } as WorkerSearchResponse);
};
