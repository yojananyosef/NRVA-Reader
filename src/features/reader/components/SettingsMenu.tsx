import { useStore } from '@nanostores/preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { preferences, type Theme, resetPreferences, type Preferences } from '../../../stores/preferences';
import { Type, AlignJustify, MoveHorizontal, Palette, RotateCcw, Sun, Moon, BookOpen, Ruler, Play, Volume2, ChevronDown, AArrowUp, Check } from 'lucide-preact';

interface Voice {
    id: string;
    label: string;
    matchType?: string;
    [key: string]: any;
}

interface SettingsMenuProps {
    voices: Voice[];
    selectedVoice: Voice | null;
    setSelectedVoice: (voice: any) => void;
}

export default function SettingsMenu({ voices, selectedVoice, setSelectedVoice }: SettingsMenuProps) {
    const $preferences = useStore(preferences);
    const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);
    const voiceSelectorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (voiceSelectorRef.current && !voiceSelectorRef.current.contains(event.target as Node)) {
                setIsVoiceSelectorOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
        const newPrefs: Preferences = { ...$preferences, [key]: value } as Preferences;
        preferences.set(newPrefs);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pb-6">
                {/* Accessibility Tools */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium opacity-80">
                        <Ruler className="w-4 h-4" />
                        <label>Herramientas de Lectura</label>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border surface-card">
                        <div className="flex items-center gap-3">
                            <Ruler className="w-5 h-5 opacity-60" />
                            <span className="font-medium text-sm">Guía de Lectura</span>
                        </div>
                        <div
                            onClick={() => update('rulerEnabled', !$preferences.rulerEnabled)}
                            role="switch"
                            aria-checked={$preferences.rulerEnabled}
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    update('rulerEnabled', !$preferences.rulerEnabled);
                                }
                            }}
                            className="w-11 h-6 rounded-full transition-all duration-200 relative shadow-inner cursor-pointer"
                            style={{
                                backgroundColor: $preferences.rulerEnabled ? 'var(--color-link)' : 'color-mix(in srgb, var(--color-text), transparent 75%)',
                                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
                            }}
                        >
                            <div
                                className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-md transition-all duration-200 ${$preferences.rulerEnabled ? 'left-[22px]' : 'left-0.5'}`}
                                style={{
                                    backgroundColor: 'var(--color-bg)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Voice Selection */}
                <div className="space-y-4">
                    <div className="relative w-full" ref={voiceSelectorRef} style={{ zIndex: isVoiceSelectorOpen ? 50 : 0 }}>
                        <button
                            onClick={() => setIsVoiceSelectorOpen(!isVoiceSelectorOpen)}
                            className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border relative z-10 ${isVoiceSelectorOpen
                                ? 'bg-[var(--surface-active-bg)] text-[var(--color-link)] border-[var(--color-link)] shadow-md ring-1 ring-[var(--color-link)]/20'
                                : '!bg-[color-mix(in_srgb,var(--surface-muted-bg)_30%,transparent)] text-[var(--color-text)] border-[var(--surface-muted-border)] hover:border-[var(--color-link)]/30 hover:shadow-md'
                                }`}
                        >
                            <div className={`p-2 rounded-lg shrink-0 transition-colors ${isVoiceSelectorOpen
                                ? 'bg-[var(--color-link)]/10 text-[var(--color-link)]'
                                : 'bg-[var(--surface-hover-bg)] text-[var(--color-text)] opacity-70 group-hover:opacity-100 group-hover:text-[var(--color-link)]'
                                }`}>
                                <Volume2 className="w-5 h-5" />
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col items-start gap-0.5">
                                <span className="text-xs font-medium opacity-60 uppercase tracking-wider">Voz de lectura</span>
                                <span className="font-semibold text-sm truncate w-full text-left">
                                    {selectedVoice ? selectedVoice.label : 'Seleccionar voz...'}
                                </span>
                            </div>

                            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isVoiceSelectorOpen ? 'rotate-180 text-[var(--color-link)]' : 'opacity-40'}`} />
                        </button>

                        {isVoiceSelectorOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 max-h-[300px] overflow-y-auto bg-[var(--color-bg)] border border-[var(--surface-muted-border)] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar">
                                <div className="grid grid-cols-1 gap-1">
                                    {voices.length === 0 ? (
                                        <div className="px-3 py-2 text-sm opacity-50">Cargando voces...</div>
                                    ) : (
                                        voices.map((voice, idx) => (
                                            <button
                                                key={`${voice.id}-${idx}`}
                                                onClick={() => {
                                                    setSelectedVoice(voice);
                                                    setIsVoiceSelectorOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors text-sm ${selectedVoice?.id === voice.id ? 'bg-[var(--color-link)]/10 text-[var(--color-link)] font-bold' : 'hover:bg-[var(--surface-hover-bg)] text-[var(--color-text)] opacity-80 hover:opacity-100'}`}
                                            >
                                                <div className="flex flex-col min-w-0 flex-1 mr-2">
                                                    <span className="truncate">{voice.label}</span>
                                                    {voice.matchType && voice.matchType !== 'exact' && (
                                                        <span className="text-[10px] opacity-60 font-normal truncate">
                                                            {voice.matchType === 'region' ? 'Acento aproximado' : 'Voz simulada (No instalada)'}
                                                        </span>
                                                    )}
                                                </div>
                                                {selectedVoice?.id === voice.id && <Check className="w-4 h-4 shrink-0" />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Audio Speed */}
                    <div className="space-y-2 p-3 rounded-xl border border-[var(--surface-muted-border)] bg-[color-mix(in_srgb,var(--surface-muted-bg)_30%,transparent)]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 opacity-80">
                                <Play className="w-4 h-4" />
                                <span className="text-xs font-medium">Velocidad</span>
                            </div>
                            <span className="text-xs font-mono px-2 py-0.5 rounded text-[var(--color-link)] font-bold" style={{ backgroundColor: 'var(--surface-muted-border)', fontSize: '11px' }}>x{$preferences.speechRate}</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={$preferences.speechRate}
                            onInput={(e) => update('speechRate', Number((e.target as HTMLInputElement).value))}
                            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[var(--color-link)]"
                            style={{ backgroundColor: 'var(--surface-muted-border)' }}
                        />
                    </div>
                </div>

                <div className="h-px bg-[var(--surface-muted-border)] my-4 opacity-50 pointer-events-none" />

                {/* Theme */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium opacity-80">
                        <Palette className="w-4 h-4" />
                        <label>Tema</label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { value: 'light', label: 'Claro', icon: Sun },
                            { value: 'dark', label: 'Oscuro', icon: Moon },
                            { value: 'sepia', label: 'Sepia', icon: BookOpen },
                        ].map((theme) => (
                            <button
                                type="button"
                                key={theme.value}
                                onClick={() => update('theme', theme.value as Theme)}
                                className="flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all cursor-pointer"
                                style={{
                                    borderColor: $preferences.theme === theme.value ? 'var(--color-link)' : 'transparent',
                                    backgroundColor: $preferences.theme === theme.value ? 'color-mix(in srgb, var(--color-link), transparent 90%)' : 'color-mix(in srgb, var(--color-text), transparent 95%)',
                                    color: $preferences.theme === theme.value ? 'var(--color-link)' : 'var(--color-text)'
                                }}
                            >
                                <theme.icon className="w-5 h-5 mb-1" />
                                <span className="text-xs font-medium">{theme.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-[var(--surface-muted-border)] my-4 opacity-50" />

                {/* Font Family */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium opacity-80">
                        <Type className="w-4 h-4" />
                        <label>Fuente</label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => update('fontFamily', 'sans')}
                            className="p-3 rounded-lg border-2 transition-all font-sans cursor-pointer text-center"
                            style={{
                                borderColor: $preferences.fontFamily === 'sans' ? 'var(--color-link)' : 'transparent',
                                backgroundColor: $preferences.fontFamily === 'sans' ? 'color-mix(in srgb, var(--color-link), transparent 90%)' : 'color-mix(in srgb, var(--color-text), transparent 95%)',
                                color: $preferences.fontFamily === 'sans' ? 'var(--color-link)' : 'var(--color-text)'
                            }}
                        >
                            Arial
                        </button>
                        <button
                            type="button"
                            onClick={() => update('fontFamily', 'dyslexic')}
                            className="p-3 rounded-lg border-2 transition-all font-dyslexic cursor-pointer text-center"
                            style={{
                                borderColor: $preferences.fontFamily === 'dyslexic' ? 'var(--color-link)' : 'transparent',
                                backgroundColor: $preferences.fontFamily === 'dyslexic' ? 'color-mix(in srgb, var(--color-link), transparent 90%)' : 'color-mix(in srgb, var(--color-text), transparent 95%)',
                                color: $preferences.fontFamily === 'dyslexic' ? 'var(--color-link)' : 'var(--color-text)'
                            }}
                        >
                            OpenDyslexic
                        </button>
                    </div>
                </div>

                <div className="h-px bg-[var(--surface-muted-border)] my-6 opacity-50" />

                {/* Sliders Section */}
                <div className="space-y-6">
                    {/* Font Size */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm font-medium opacity-80">
                            <div className="flex items-center gap-2">
                                <AArrowUp className="w-4 h-4" />
                                <label>Tamaño</label>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 90%)', fontSize: '12px', minWidth: '40px', textAlign: 'center' }}>{$preferences.fontSize}px</span>
                        </div>
                        <input
                            type="range"
                            min="14"
                            max="32"
                            value={$preferences.fontSize}
                            onInput={(e) => update('fontSize', Number((e.target as HTMLInputElement).value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[var(--color-link)]"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 90%)', height: '8px' }}
                        />
                    </div>

                    {/* Line Height */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm font-medium opacity-80">
                            <div className="flex items-center gap-2">
                                <AlignJustify className="w-4 h-4" />
                                <label>Interlineado</label>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 90%)' }}>{$preferences.lineHeight}</span>
                        </div>
                        <input
                            type="range"
                            min="1.2"
                            max="2.5"
                            step="0.1"
                            value={$preferences.lineHeight}
                            onInput={(e) => update('lineHeight', Number((e.target as HTMLInputElement).value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[var(--color-link)]"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 90%)' }}
                        />
                    </div>

                    {/* Letter Spacing */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm font-medium opacity-80">
                            <div className="flex items-center gap-2">
                                <MoveHorizontal className="w-4 h-4" />
                                <label>Espaciado</label>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 90%)' }}>{$preferences.letterSpacing}em</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="0.1"
                            step="0.01"
                            value={$preferences.letterSpacing}
                            onInput={(e) => update('letterSpacing', Number((e.target as HTMLInputElement).value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[var(--color-link)]"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--color-text), transparent 90%)' }}
                        />
                    </div>
                </div>
            </div>

            <div
                className="mt-4 pt-4 border-t"
                style={{
                    borderColor: 'color-mix(in srgb, var(--color-text), transparent 90%)'
                }}
            >
                <button
                    type="button"
                    onClick={resetPreferences}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold rounded-lg hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                    style={{ backgroundColor: 'var(--color-text)', color: 'var(--color-bg)' }}
                >
                    <RotateCcw className="w-4 h-4" />
                    Restaurar valores
                </button>
            </div>
        </div>
    );
}

