interface HomeHeaderProps {
    progress: {
        currentStreak: number;
        daysVisited: boolean[];
        todayIndex: number;
    };
}

export default function HomeHeader({ progress }: HomeHeaderProps) {
    const daysOfWeek = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

    return (
        <header class="flex flex-col md:flex-row items-center justify-between gap-6 py-6 border-b border-theme-text/10">
            <div class="text-center md:text-left space-y-2">
                <h1 class="text-3xl md:text-4xl font-bold text-[var(--color-link)] font-dyslexic">
                    Lectura Accesible
                </h1>
                <p class="text-lg opacity-80 italic">
                    Tu compañero diario para el estudio bíblico
                </p>
            </div>

            {/* Weekly Streak View */}
            <div class="bg-[var(--surface-muted-bg)] border border-[var(--surface-muted-border)] rounded-2xl p-4 flex flex-col items-center min-w-[280px]">
                <div class="flex items-center gap-2 mb-3 text-[var(--color-link)]">
                    <span class="text-2xl">🔥</span>
                    <span class="font-bold text-xl">
                        {progress.currentStreak} {progress.currentStreak === 1 ? 'día' : 'días'} racha
                    </span>
                </div>

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
