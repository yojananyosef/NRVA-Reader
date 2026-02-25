import { useCallback } from 'preact/hooks';

export function useAutoPlay(play: (selector: string, onEnd: () => void) => void) {
    const handleAutoPlay = useCallback(() => {
        // Encontrar el botón de "siguiente capítulo" en el DOM si existe
        const nextBtn = document.querySelector('[data-nav-next]') as HTMLElement;
        if (nextBtn) {
            nextBtn.click();

            // Re-intentar encontrar contenido para empezar a leer
            let retries = 0;
            const tryPlay = () => {
                const isCommentary = window.location.pathname.includes('commentary');
                const selector = isCommentary
                    ? '.reader-content h1, .reader-content .reader-text'
                    : '.reader-content h1, .reader-content p';

                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    // Pasar handleAutoPlay como callback para concatenar capítulos
                    play(selector, handleAutoPlay);
                } else if (retries < 10) {
                    retries++;
                    setTimeout(tryPlay, 500);
                }
            };

            setTimeout(tryPlay, 1000);
        }
    }, [play]);

    return { handleAutoPlay };
}
