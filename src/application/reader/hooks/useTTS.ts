import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { preferences } from '../../../stores/preferences';
import { type VirtualVoice, mapSystemVoicesToVirtual } from '../utils/voiceUtils';

export function useTTS() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const isPausedRef = useRef(false); // Ref to track paused state in closures
    const [isLoading, setIsLoading] = useState(false);
    const synth = useRef<SpeechSynthesis | null>(null);
    const utterance = useRef<SpeechSynthesisUtterance | null>(null);
    const [rate, setRateState] = useState(1.0);
    const rateRef = useRef(1.0);
    const elementsRef = useRef<Element[]>([]);
    const currentIndexRef = useRef(0);
    const isStoppingRef = useRef(false);
    const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]); // Prevent GC

    // Voice Selection State
    const [voices, setVoices] = useState<VirtualVoice[]>([]);
    const [selectedVoice, setSelectedVoiceState] = useState<VirtualVoice | null>(null);
    const selectedVoiceRef = useRef<VirtualVoice | null>(null);

    // Update rate immediately
    const setRate = useCallback((newRate: number) => {
        setRateState(newRate);
        rateRef.current = newRate;
        // If speaking or pending, cancel current utterance to restart with new rate
        // The error handler will trigger speakNext(), which will pick up the new rate
        if (synth.current && (synth.current.speaking || synth.current.pending)) {
            synth.current.cancel();
        }
    }, []);

    // Update preference when voice changes
    const setSelectedVoice = useCallback((voice: VirtualVoice | null) => {
        setSelectedVoiceState(voice);
        selectedVoiceRef.current = voice;
        if (voice) {
            const current = preferences.get();
            preferences.set({ ...current, selectedVoiceURI: voice.id });

            // If playing or paused, update immediately
            if (synth.current && (synth.current.speaking || synth.current.pending)) {
                // If paused, we still want to cancel to swap voice.
                // The 'canceled' error handler in play() will restart the segment with the new voice,
                // and isPausedRef will ensure it starts in paused state.
                synth.current.cancel();
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synth.current = window.speechSynthesis;

            // Load and filter voices
            const loadVoices = () => {
                if (!synth.current) return;

                // Get all voices
                const allVoices = synth.current.getVoices();

                // Map to Virtual Voices
                const virtualVoices = mapSystemVoicesToVirtual(allVoices);

                setVoices(virtualVoices);

                // Auto-select based on preference or default
                const prefs = preferences.get();
                if (prefs.selectedVoiceURI) {
                    const savedVoice = virtualVoices.find(v => v.id === prefs.selectedVoiceURI);
                    if (savedVoice) {
                        setSelectedVoiceState(savedVoice);
                        selectedVoiceRef.current = savedVoice;
                        return;
                    }
                }

                // Default to first available if no preference match
                if (virtualVoices.length > 0 && !selectedVoiceRef.current) {
                    // Default to Spain Female if available, else first one
                    const defaultVoice = virtualVoices.find(v => v.id === 'es-ES-female') || virtualVoices[0];
                    setSelectedVoiceState(defaultVoice);
                    selectedVoiceRef.current = defaultVoice;
                }
            };

            // Initial load
            loadVoices();

            // Handle async voice loading
            if (synth.current.onvoiceschanged !== undefined) {
                synth.current.onvoiceschanged = loadVoices;
            }

            // Wake up speech engine on mobile/Safari
            const wakeUp = () => {
                if (synth.current) {
                    const u = new SpeechSynthesisUtterance('');
                    u.volume = 0;
                    synth.current.speak(u);
                }
                window.removeEventListener('touchstart', wakeUp);
                window.removeEventListener('click', wakeUp);
            };
            window.addEventListener('touchstart', wakeUp);
            window.addEventListener('click', wakeUp);

            // CRITICAL: Stop TTS when navigating
            const handleNavigation = () => {
                if (synth.current) {
                    stop();
                }
            };

            window.addEventListener('beforeunload', handleNavigation);
            window.addEventListener('popstate', handleNavigation);

            // Astro View Transitions support
            document.addEventListener('astro:before-preparation', handleNavigation);
            document.addEventListener('astro:after-swap', handleNavigation);

            // Watch for URL changes manually for cases where popstate doesn't fire
            let lastUrl = window.location.href;
            const urlCheckInterval = setInterval(() => {
                if (window.location.href !== lastUrl) {
                    lastUrl = window.location.href;
                    handleNavigation();
                }
            }, 500);

            return () => {
                window.removeEventListener('beforeunload', handleNavigation);
                window.removeEventListener('popstate', handleNavigation);
                document.removeEventListener('astro:before-preparation', handleNavigation);
                document.removeEventListener('astro:after-swap', handleNavigation);
                clearInterval(urlCheckInterval);
                if (synth.current) {
                    synth.current.cancel();
                }
            };
        }
    }, []); // Only on mount

    // Separate effect for keepAlive to avoid re-triggering logic on isPlaying change
    useEffect(() => {
        let timeoutId: any;
        const keepAlive = () => {
            if (!isPlaying) return;

            // The pause/resume trick is mainly for Chrome on Desktop to prevent the 15s timeout
            // On mobile it can be unstable, so we use it sparingly
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (synth.current?.speaking && !synth.current?.paused && !isMobile) {
                synth.current.pause();
                synth.current.resume();
            }

            timeoutId = setTimeout(keepAlive, 10000);
        };

        if (isPlaying) {
            keepAlive();
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isPlaying]);

    const stop = () => {
        isStoppingRef.current = true;
        if (synth.current) {
            synth.current.cancel();
            setIsPlaying(false);
            setIsPaused(false);
            isPausedRef.current = false;
            setIsLoading(false);
            currentIndexRef.current = 0;
            utterancesRef.current = []; // Clear GC protection
            document.querySelectorAll('.speaking-highlight').forEach(el =>
                el.classList.remove('speaking-highlight')
            );
        }
        // Small delay to prevent race conditions with speakNext
        setTimeout(() => {
            isStoppingRef.current = false;
        }, 150);
    };

    const pause = () => {
        if (synth.current && isPlaying && !isPaused) {
            synth.current.pause();
            setIsPaused(true);
            isPausedRef.current = true;
            // On some browsers, pause/resume is buggy. 
            // We'll store the state to handle it in resume()
        }
    };

    const resume = () => {
        if (synth.current && isPlaying && isPaused) {
            // Safari/Chrome on Mobile sometimes lose context on pause
            if (synth.current.paused) {
                synth.current.resume();
            } else {
                // If not actually paused in the engine but our state says so,
                // it might have lost the utterance. Restarting from current element is safer.
                if (utterance.current) {
                    synth.current.speak(utterance.current);
                }
            }
            setIsPaused(false);
            isPausedRef.current = false;
        }
    };

    // New function for testing/reading specific text
    const speakText = (text: string) => {
        if (!synth.current) return;

        // Prevent errors if already speaking
        if (synth.current.speaking) {
            synth.current.cancel();
        }

        const u = new SpeechSynthesisUtterance(text);

        const voice = selectedVoice?.systemVoice;
        if (voice) {
            u.voice = voice;
            u.lang = voice.lang;
        } else {
            u.lang = selectedVoice?.locale || 'es-ES';
        }

        u.rate = rateRef.current;

        u.onstart = () => setIsPlaying(true);
        u.onend = () => setIsPlaying(false);
        u.onerror = (e) => {
            console.error("TTS Error:", e);
            setIsPlaying(false);
        };

        utterance.current = u;
        synth.current.speak(u);
    };

    const play = (textBlocksSelector = '.reader-content p, .reader-content h1', onComplete?: () => void) => {
        if (!synth.current) return;

        // If we're stopping, wait a bit
        if (isStoppingRef.current) {
            setTimeout(() => play(textBlocksSelector, onComplete), 200);
            return;
        }

        // Handle Resume
        if (isPlaying && isPaused) {
            resume();
            return;
        }

        // Handle Pause
        if (isPlaying && !isPaused) {
            pause();
            return;
        }

        // IMPORTANT: Always reset engine and clear everything before starting new audio
        // to prevent context loss bugs on chapter changes
        synth.current.cancel();

        // Wait for cancel to propagate (especially on mobile)
        setTimeout(() => {
            setIsLoading(true);
            setIsPlaying(true);
            setIsPaused(false);
            isStoppingRef.current = false;

            // Get all readable elements
            const elements = Array.from(document.querySelectorAll(textBlocksSelector));
            if (elements.length === 0) {
                setIsLoading(false);
                setIsPlaying(false);
                return;
            }

            elementsRef.current = elements;
            currentIndexRef.current = 0;
            utterancesRef.current = []; // Reset GC protection

            const speakNext = () => {
                if (isStoppingRef.current) return;

                if (currentIndexRef.current >= elementsRef.current.length) {
                    stop();
                    if (onComplete) onComplete();
                    return;
                }

                const element = elementsRef.current[currentIndexRef.current];
                if (!element || !document.body.contains(element)) {
                    stop();
                    return;
                }

                const clone = element.cloneNode(true) as HTMLElement;
                const currentPrefs = preferences.get();

                if (currentPrefs.skipVerses) {
                    clone.querySelectorAll('.verse-num, sup, .sr-only').forEach(el => {
                        el.textContent = ' ';
                        el.remove();
                    });
                }

                if (currentPrefs.skipFootnotes) {
                    clone.querySelectorAll('.footnote-ref, a').forEach(el => {
                        el.textContent = ' ';
                        el.remove();
                    });
                }

                clone.querySelectorAll('.commentary-icon, svg, button, .select-none-ui').forEach(el => {
                    el.textContent = ' ';
                    el.remove();
                });

                const text = clone.innerText
                    .replace(/\s+/g, ' ')
                    .trim();

                if (!text) {
                    currentIndexRef.current++;
                    speakNext();
                    return;
                }

                const u = new SpeechSynthesisUtterance(text);

                // Apply selected voice
                const currentVirtualVoice = selectedVoiceRef.current;
                const systemVoice = currentVirtualVoice?.systemVoice;

                if (systemVoice) {
                    u.voice = systemVoice;
                    u.lang = systemVoice.lang;
                } else {
                    u.lang = currentVirtualVoice?.locale || 'es-ES';
                }

                u.rate = rateRef.current;

                // CRITICAL: Keep a reference to prevent GC on mobile
                utterancesRef.current.push(u);
                if (utterancesRef.current.length > 5) {
                    utterancesRef.current.shift(); // Keep only a few to avoid memory leak
                }

                u.onstart = () => {
                    if (isStoppingRef.current) return;
                    setIsLoading(false);

                    document.querySelectorAll('.speaking-highlight').forEach(el =>
                        el.classList.remove('speaking-highlight')
                    );

                    element.classList.add('speaking-highlight');

                    const rect = element.getBoundingClientRect();
                    const isVisible = (rect.top >= 50 && rect.bottom <= window.innerHeight - 50);
                    if (!isVisible) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                };

                u.onend = () => {
                    if (isStoppingRef.current) return;
                    currentIndexRef.current++;

                    if (document.body.contains(element) && currentIndexRef.current < elementsRef.current.length) {
                        // Small delay between utterances for better stability on mobile
                        setTimeout(speakNext, 150);
                    } else if (currentIndexRef.current >= elementsRef.current.length) {
                        stop();
                        if (onComplete) onComplete();
                    } else {
                        stop();
                    }
                };

                u.onerror = (event: any) => {
                    // Handle cancellation or interruption (e.g. voice change)
                    if (event.error === 'interrupted' || event.error === 'canceled') {
                        if (!isStoppingRef.current) {
                            setTimeout(speakNext, 100);
                        }
                        return;
                    }

                    // On some mobile browsers, 'not-allowed' or 'network' might happen
                    // We try to skip the problematic verse and continue
                    console.error('TTS Error:', event.error, event);
                    if (!isStoppingRef.current && currentIndexRef.current < elementsRef.current.length - 1) {
                        currentIndexRef.current++;
                        setTimeout(speakNext, 200);
                    } else {
                        stop();
                    }
                };

                utterance.current = u;

                // Use a slightly larger delay for subsequent utterances on mobile
                const delay = currentIndexRef.current === 0 ? 0 : 100;
                setTimeout(() => {
                    if (!isStoppingRef.current && synth.current) {
                        synth.current.speak(u);

                        // If we are supposed to be paused (e.g. changed voice while paused),
                        // immediately pause the new utterance.
                        if (isPausedRef.current) {
                            synth.current.pause();
                        }
                    }
                }, delay);
            };

            speakNext();
        }, 150);
    };

    return {
        isPlaying,
        isPaused,
        isLoading,
        play,
        stop,
        pause,
        resume,
        rate,
        setRate,
        voices,
        selectedVoice,
        setSelectedVoice,
        speakText
    };
}
