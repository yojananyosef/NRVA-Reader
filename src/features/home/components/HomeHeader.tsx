import { Sun, Moon, Sunrise, CircleHelp, Trophy, Calendar, Target } from 'lucide-preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import type { WeeklyProgress } from '../hooks/useStreak';

interface HomeHeaderProps {
    progress: WeeklyProgress;
}

export default function HomeHeader({ progress }: HomeHeaderProps) {
    const daysOfWeek = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const [showStats, setShowStats] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    // Cerrar al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showStats &&
                modalRef.current &&
                !modalRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)) {
                setShowStats(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showStats]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return { text: 'Buenos días', icon: Sunrise };
        if (hour >= 12 && hour < 20) return { text: 'Buenas tardes', icon: Sun };
        return { text: 'Buenas noches', icon: Moon };
    };

    const greeting = getGreeting();
    const GreetingIcon = greeting.icon;

    const today = new Date();
    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateString = today.toLocaleDateString('es-ES', dateOptions);
    const capitalizedDate = dateString.charAt(0).toUpperCase() + dateString.slice(1);

    return (
        <header class="flex flex-col md:flex-row items-center justify-between gap-6 py-6 border-b border-theme-text/10">
            <div class="text-center md:text-left space-y-2">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-muted-bg)] border border-[var(--surface-muted-border)] text-[var(--color-text)]">
                    <GreetingIcon size={16} class="text-[var(--color-link)]" />
                    <span class="text-sm font-medium opacity-80">
                        {greeting.text} <span class="opacity-40 mx-1">|</span> {capitalizedDate}
                    </span>
                </div>
                <h1 class="text-3xl md:text-4xl font-bold text-[var(--color-link)] font-dyslexic">
                    Lectura Accesible
                </h1>
                <p class="text-lg opacity-80 italic">
                    Tu compañero diario para el estudio bíblico
                </p>
            </div>

            {/* Weekly Streak View */}
            <div class="bg-[var(--surface-muted-bg)] border border-[var(--surface-muted-border)] rounded-2xl p-4 flex flex-col items-center min-w-[280px] relative">
                <div
                    ref={triggerRef}
                    onClick={() => setShowStats(!showStats)}
                    role="button"
                    tabIndex={0}
                    class="absolute top-2 right-2 w-4 h-4 p-0 flex items-center justify-center leading-none text-[var(--color-text)] opacity-20 hover:opacity-100 cursor-pointer transition-all z-20"
                    title="Ver estadísticas"
                >
                    <CircleHelp size={12} strokeWidth={2} />
                </div>

                <div class="flex items-center gap-2 mb-3 text-[var(--color-link)]">
                    <span class="text-2xl">🔥</span>
                    <span class="font-bold text-xl">
                        Racha de {progress.currentStreak} {progress.currentStreak === 1 ? 'día' : 'días'}
                    </span>
                </div>

                {showStats && (
                    <div
                        ref={modalRef}
                        class="absolute top-full right-0 mt-2 w-72 bg-[var(--color-bg)] border border-[var(--surface-muted-border)] rounded-xl shadow-lg p-4 z-50 animate-in fade-in zoom-in-95 duration-200"
                    >
                        <div class="flex justify-center items-center mb-4">
                            <h3 class="font-bold text-xs text-[var(--color-text)] opacity-80 uppercase tracking-wider">Hábito diario</h3>
                        </div>
                        <div class="space-y-4 text-sm">
                            <div class="grid grid-cols-[32px_1fr] items-center gap-3">
                                <div class="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--surface-muted-bg)] text-[var(--color-link)] shrink-0">
                                    <Trophy size={16} />
                                </div>
                                <div class="font-bold text-[var(--color-text)] leading-none">
                                    Mejor racha: {progress.bestStreak || progress.currentStreak} {(progress.bestStreak || progress.currentStreak) === 1 ? 'día' : 'días'}
                                </div>
                            </div>

                            <div class="grid grid-cols-[32px_1fr] items-center gap-3">
                                <div class="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--surface-muted-bg)] text-[var(--color-link)] shrink-0">
                                    <Calendar size={16} />
                                </div>
                                <div class="font-bold text-[var(--color-text)] leading-none">
                                    {Math.max(1, progress.weeksStreak)} {Math.max(1, progress.weeksStreak) === 1 ? 'semana seguida' : 'semanas seguidas'}
                                </div>
                            </div>

                            <div class="grid grid-cols-[32px_1fr] items-center gap-3">
                                <div class="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--surface-muted-bg)] text-[var(--color-link)] shrink-0">
                                    <Target size={16} />
                                </div>
                                <div class="font-bold text-[var(--color-text)] leading-none">
                                    {progress.totalDaysThisYear} {progress.totalDaysThisYear === 1 ? 'día' : 'días'} en la biblia este año
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div class="flex gap-2 justify-center w-full">
                    {progress.daysVisited.map((visited, index) => {
                        const isToday = index === progress.todayIndex;
                        const isFuture = index > progress.todayIndex;
                        const isMissed = !visited && !isFuture;

                        return (
                            <div key={index} class="flex flex-col items-center gap-1">
                                <span class={`text-xs font-bold ${isToday ? 'text-[var(--color-link)]' : 'opacity-60'}`}>
                                    {daysOfWeek[index]}
                                </span>
                                <div
                                    class={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                                        ${isFuture
                                            ? 'border-dashed border-[var(--surface-muted-border)] bg-transparent opacity-40' // Futuro: borde punteado
                                            : visited
                                                ? 'bg-[var(--color-link)] border-[var(--color-link)] text-white shadow-sm scale-105' // Completado: lleno
                                                : 'border-[var(--surface-muted-border)] bg-[var(--surface-muted-bg)] opacity-60 grayscale' // Perdido: gris apagado
                                        }
                                        ${isToday && !visited ? 'border-[var(--color-link)] border-dashed opacity-100 bg-[var(--color-link)]/5' : ''} // Hoy pendiente
                                        ${isToday && visited ? 'ring-2 ring-offset-2 ring-[var(--color-link)] ring-offset-[var(--surface-muted-bg)]' : ''} // Hoy completado
                                    `}
                                    title={
                                        isFuture ? "Día futuro" :
                                            visited ? "Completado" :
                                                isToday ? "Pendiente hoy" : "Día perdido"
                                    }
                                >
                                    {visited ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                        </svg>
                                    ) : isMissed ? (
                                        <div class="w-1.5 h-1.5 rounded-full bg-[var(--color-text)] opacity-20" />
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </header>
    );
}
