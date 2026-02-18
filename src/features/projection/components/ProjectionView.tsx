
import { useEffect, useState } from 'preact/hooks';
import { useProjectionReceiver } from '../hooks/useProjection';
import booksIndex from '../../../data/books-index.json';

export default function ProjectionView() {
    const data = useProjectionReceiver();
    const [theme] = useState<'light' | 'dark'>('dark');
    const [animate, setAnimate] = useState(false);

    // Configuración tipográfica
    const verseFontFamily = '"Noto Serif Hebrew", "Merriweather", "Georgia", serif';
    const refFontFamily = '"Noto Sans Hebrew", "Helvetica Neue", "Arial", sans-serif';

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.className = theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black';
    }, [theme]);

    // Trigger animation on data change
    useEffect(() => {
        if (data?.reference) {
            setAnimate(false);
            // Force reflow
            setTimeout(() => setAnimate(true), 50);
        }
    }, [data?.reference]);

    if (!data || data.type === 'clear') {
        return (
            <div className="flex flex-col items-center justify-center h-screen w-screen bg-black text-white cursor-none select-none">
                {/* Pantalla negra limpia cuando no hay proyección */}
            </div>
        );
    }

    const { passage, text, reference } = data;

    // Find book name
    const bookName = booksIndex.find(b => b.code === passage?.book)?.name || passage?.book;

    // Cálculo dinámico de tamaño de fuente basado en la longitud del texto
    const getFontSize = (textLength: number) => {
        if (textLength < 50) return 'clamp(3.5rem, 9vw, 7rem)';
        if (textLength < 100) return 'clamp(3rem, 7vw, 6rem)';
        if (textLength < 200) return 'clamp(2.5rem, 6vw, 5rem)';
        return 'clamp(2rem, 5vw, 4rem)';
    };

    // Remove HTML tags for length calculation
    const plainText = text?.replace(/<[^>]*>?/gm, '') || '';
    const fontSize = getFontSize(plainText.length);

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden relative bg-black text-white selection:bg-white/20 cursor-none select-none justify-center items-center text-center">
            <div
                className={`flex-1 flex flex-col justify-center items-center w-full h-full p-12 md:p-24 lg:p-32 transition-opacity duration-700 ease-in-out ${animate ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
                <div className="max-w-[90%] md:max-w-[85%] lg:max-w-[1400px] flex flex-col gap-8 md:gap-12 items-center justify-center">
                    {/* Texto del Versículo */}
                    <div
                        className="text-center leading-tight md:leading-snug transition-all duration-300 drop-shadow-2xl font-serif"
                        style={{
                            fontFamily: verseFontFamily,
                            fontSize: fontSize,
                            textShadow: '0 4px 12px rgba(0,0,0,0.8)',
                            fontWeight: 500
                        }}
                        dangerouslySetInnerHTML={{ __html: text || '' }}
                    />

                    {/* Referencia */}
                    <div
                        className="text-center font-sans tracking-[0.15em] uppercase opacity-80 mt-4"
                        style={{
                            fontFamily: refFontFamily,
                            fontSize: 'clamp(1.2rem, 2.5vw, 2.5rem)',
                            color: 'var(--color-link, #60a5fa)',
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                            fontWeight: 300
                        }}
                    >
                        {reference || `${bookName} ${passage?.chapter}:${passage?.verses?.join('-')}`}
                    </div>
                </div>
            </div>

            <style>{`
                /* Estilos para los números de versículos (superscript) */
                sup {
                    font-size: 0.5em;
                    vertical-align: super;
                    opacity: 0.6;
                    margin-right: 0.2em;
                    font-weight: 300;
                    font-family: ${refFontFamily};
                }
            `}</style>
        </div>
    );
}
