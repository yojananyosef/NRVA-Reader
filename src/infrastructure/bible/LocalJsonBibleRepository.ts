import type { IBibleRepository } from '../../domain/bible/IBibleRepository';
import { fetchWithCache } from '../../utils/fetchWithCache';

export class LocalJsonBibleRepository implements IBibleRepository {
    async getChapterData(bookCode: string): Promise<any> {
        if (!bookCode) return null;
        try {
            return await fetchWithCache(`/data/bible/${bookCode.toLowerCase()}.json`);
        } catch (error) {
            console.error(`LocalJsonBibleRepository error fetching book ${bookCode}:`, error);
            throw error;
        }
    }

    async getCommentaryData(bookCode: string): Promise<any> {
        if (!bookCode) return null;
        try {
            return await fetchWithCache(`/data/commentary/${bookCode.toLowerCase()}.json`);
        } catch (error) {
            // Commentary is optional; return null gracefully if missing
            return null;
        }
    }
}

export const bibleRepository = new LocalJsonBibleRepository();
