import type { IBibleRepository } from '../../domain/bible/IBibleRepository';
import { fetchBibleBook } from '../../utils/bibleService';
import { fetchWithCache } from '../../utils/fetchWithCache';

export class LocalJsonBibleRepository implements IBibleRepository {
    async getChapterData(bookCode: string): Promise<any> {
        if (!bookCode) return null;
        try {
            return await fetchBibleBook(bookCode);
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
