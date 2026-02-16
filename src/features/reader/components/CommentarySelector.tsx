import { useState, useRef, useEffect } from 'preact/hooks';
import { ChevronDown, Book, Hash, Check } from 'lucide-preact';

interface BookInfo {
    code: string;
    name: string;
    chapters: number;
}

interface Props {
    currentBook: string;
    currentChapter: number;
    books: BookInfo[];
    onNavigate?: (url: string) => void;
}

export default function CommentarySelector({ currentBook, currentChapter, books, onNavigate }: Props) {
    const [bookCode, setBookCode] = useState(currentBook);
    const [chapter, setChapter] = useState(currentChapter);
    const [isBookOpen, setIsBookOpen] = useState(false);
    const [isChapterOpen, setIsChapterOpen] = useState(false);
    
    const bookRef = useRef<HTMLDivElement>(null);
    const chapterRef = useRef<HTMLDivElement>(null);

    const selectedBook = books.find(b => b.code === bookCode);
    const chapters = selectedBook ? Array.from({ length: selectedBook.chapters }, (_, i) => i + 1) : [];

    useEffect(() => {
        setBookCode(currentBook);
        setChapter(currentChapter);
    }, [currentBook, currentChapter]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bookRef.current && !bookRef.current.contains(event.target as Node)) {
                setIsBookOpen(false);
            }
            if (chapterRef.current && !chapterRef.current.contains(event.target as Node)) {
                setIsChapterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBookSelect = (code: string) => {
        setBookCode(code);
        setIsBookOpen(false);
        const url = `/commentary?book=${code}&chapter=1`;
        if (onNavigate) {
            onNavigate(url);
        } else {
            window.location.href = url;
        }
    };

    const handleChapterSelect = (num: number) => {
        setChapter(num);
        setIsChapterOpen(false);
        const url = `/commentary?book=${bookCode}&chapter=${num}`;
        if (onNavigate) {
            onNavigate(url);
        } else {
            window.location.href = url;
        }
    };

    return (
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8 p-2 md:p-3 rounded-2xl bg-[var(--surface-muted-bg)] border border-[var(--surface-muted-border)] max-w-fit mx-auto relative z-50 shadow-sm">
            {/* Book Selector */}
            <div className="relative" ref={bookRef}>
                <button
                    onClick={() => { setIsBookOpen(!isBookOpen); setIsChapterOpen(false); }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 border ${isBookOpen ? 'bg-[var(--color-link)] text-white shadow-lg border-transparent' : 'hover:bg-[var(--surface-hover-bg)] text-[var(--color-text)] border-[var(--surface-muted-border)] shadow-sm'}`}
                >
                    <div className={`p-1 rounded-lg ${isBookOpen ? 'bg-white/20' : 'bg-[var(--color-link)]/10 text-[var(--color-link)]'}`}>
                        <Book className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-base md:text-lg truncate max-w-[120px] md:max-w-[200px]">
                        {selectedBook?.name}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isBookOpen ? 'rotate-180' : ''}`} />
                </button>

                {isBookOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 max-h-[400px] overflow-y-auto bg-[var(--color-bg)] border border-[var(--surface-muted-border)] rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar">
                        <div className="grid grid-cols-1 gap-1">
                            {books.map(b => (
                                <button
                                    key={b.code}
                                    onClick={() => handleBookSelect(b.code)}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${b.code === bookCode ? 'bg-[var(--color-link)]/10 text-[var(--color-link)] font-bold' : 'hover:bg-[var(--surface-hover-bg)] text-[var(--color-text)] opacity-80 hover:opacity-100'}`}
                                >
                                    <span>{b.name}</span>
                                    {b.code === bookCode && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="h-8 w-px bg-theme-text/10 hidden sm:block" />

            {/* Chapter Selector */}
            <div className="relative" ref={chapterRef}>
                <button
                    onClick={() => { setIsChapterOpen(!isChapterOpen); setIsBookOpen(false); }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 border ${isChapterOpen ? 'bg-[var(--color-link)] text-white shadow-lg border-transparent' : 'hover:bg-[var(--surface-hover-bg)] text-[var(--color-text)] border-[var(--surface-muted-border)] shadow-sm'}`}
                >
                    <div className={`p-1 rounded-lg ${isChapterOpen ? 'bg-white/20' : 'bg-[var(--color-link)]/10 text-[var(--color-link)]'}`}>
                        <Hash className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-base md:text-lg">
                        {chapter}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isChapterOpen ? 'rotate-180' : ''}`} />
                </button>

                {isChapterOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 max-h-[300px] overflow-y-auto bg-[var(--color-bg)] border border-[var(--surface-muted-border)] rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar z-50">
                        <div className="grid grid-cols-5 gap-2">
                            {chapters.map(c => (
                                <button
                                    key={c}
                                    onClick={() => handleChapterSelect(c)}
                                    className={`flex items-center justify-center aspect-square rounded-xl text-sm transition-colors ${c === chapter ? 'bg-[var(--color-link)] text-white font-bold' : 'hover:bg-[var(--surface-hover-bg)] text-[var(--color-text)] opacity-80 hover:opacity-100'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
