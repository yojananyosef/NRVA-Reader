import { ArrowLeft, ArrowRight } from "lucide-preact";
import { createPortal } from "preact/compat";
import { useEffect, useState } from "preact/hooks";

interface ArrowNavigationProps {
    prevHref?: string | null;
    nextHref?: string | null;
    onPrev?: (e: MouseEvent) => void;
    onNext?: (e: MouseEvent) => void;
    prevLabel?: string;
    nextLabel?: string;
}

/**
 * Componente de navegación centralizado para las flechas laterales.
 * Implementa el diseño consistente del sistema y soporte responsive.
 * Utiliza Portal para garantizar que las flechas estén siempre visibles y fijas al viewport,
 * independientemente del contenedor (evita problemas con transform, overflow, z-index locales).
 */
export default function ArrowNavigation({
    prevHref,
    nextHref,
    onPrev,
    onNext,
    prevLabel = "Anterior",
    nextLabel = "Siguiente",
}: ArrowNavigationProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const renderArrow = (direction: 'prev' | 'next') => {
        const href = direction === 'prev' ? prevHref : nextHref;
        const onClick = direction === 'prev' ? onPrev : onNext;
        const label = direction === 'prev' ? prevLabel : nextLabel;
        const Icon = direction === 'prev' ? ArrowLeft : ArrowRight;
        const className = `nav-arrow nav-arrow-${direction} fixed top-1/2 -translate-y-1/2 z-[9999] visible ui-protect flex items-center justify-center cursor-pointer`;
        const dataAttr = direction === 'prev' ? { 'data-nav-prev': true } : { 'data-nav-next': true };

        if (!href && !onClick) return null;

        // Normalizamos a usar siempre una etiqueta <a> para consistencia visual absoluta
        // Si es un botón lógico, usamos href="#" y prevenimos el default.
        const finalHref = href || "#";
        const isButton = !href;

        return (
            <a
                href={finalHref}
                onClick={(e) => {
                    if (isButton) {
                        e.preventDefault();
                    }
                    if (onClick) {
                        onClick(e);
                    }
                }}
                class={className}
                aria-label={label}
                role={isButton ? "button" : "link"}
                {...dataAttr}
                data-astro-prefetch={!isButton}
                style={{
                    opacity: 1,
                    visibility: 'visible',
                    display: 'flex'
                }}
            >
                <Icon class="w-5 h-5" />
            </a>
        );
    };

    // Solo renderizar en el cliente y usar Portal para escapar de contenedores con transform/overflow
    if (!mounted || typeof document === 'undefined') return null;

    return createPortal(
        <>
            {renderArrow('prev')}
            {renderArrow('next')}
        </>,
        document.body
    );
}
