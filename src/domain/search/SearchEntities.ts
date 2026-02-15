export interface BiblePassage {
    book: string;
    chapter: number;
    verses?: number[];
}

export interface SearchResult {
    passages: BiblePassage[];
    totalCount: number;
}
