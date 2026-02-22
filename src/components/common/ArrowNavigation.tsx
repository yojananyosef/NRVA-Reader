import { createPortal } from "preact/compat";
import { useEffect, useState, useRef } from "preact/hooks";

// Iconos SVG en línea para evitar dependencias y conflictos de estilos
const ArrowLeftIcon = (props: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        {...props}
    >
        <path d="m12 19-7-7 7-7" />
        <path d="M19 12H5" />
    </svg>
);

const ArrowRightIcon = (props: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        {...props}
    >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </svg>
);

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
    const [isVisible, setIsVisible] = useState(true);
    const timerRef = useRef<any>(null);
    const isTouchScrollingRef = useRef(false);

    useEffect(() => {
        setMounted(true);

        // Función para mostrar las flechas y reiniciar el temporizador
        const showArrows = () => {
            setIsVisible(true);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                setIsVisible(false);
            }, 3000); // 3 segundos de inactividad
        };

        const handleInteraction = () => {
            showArrows();
        };

        const handleTouchStart = () => {
            isTouchScrollingRef.current = false;
            showArrows();
        };

        const handleTouchMove = () => {
            // Ocultar inmediatamente al arrastrar en móvil
            isTouchScrollingRef.current = true;
            setIsVisible(false);
            if (timerRef.current) clearTimeout(timerRef.current);
        };

        const handleTouchEnd = () => {
            // Al soltar, permitimos que el scroll (si hay inercia) o la inactividad manejen la visibilidad
            setTimeout(() => {
                isTouchScrollingRef.current = false;
            }, 100);
        };

        const handleScroll = () => {
            // Si no estamos arrastrando activamente (touch), mostramos las flechas
            if (!isTouchScrollingRef.current) {
                showArrows();
            }
        };

        // Event Listeners
        window.addEventListener('mousemove', handleInteraction);
        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Iniciar visible
        showArrows();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const renderArrow = (direction: 'prev' | 'next') => {
        const href = direction === 'prev' ? prevHref : nextHref;
        const onClick = direction === 'prev' ? onPrev : onNext;
        const label = direction === 'prev' ? prevLabel : nextLabel;
        const Icon = direction === 'prev' ? ArrowLeftIcon : ArrowRightIcon;
        const isPrev = direction === 'prev';
        const dataAttr = direction === 'prev' ? { 'data-nav-prev': true } : { 'data-nav-next': true };

        if (!href && !onClick) return null;

        // Posicionamiento dinámico inline
        const positionStyle = isPrev
            ? { left: 'calc(var(--sidebar-current-width, 0rem) + 1rem)' }
            : { right: '1rem' };

        const className = `nav-arrow-fixed ${!isVisible ? 'nav-arrow-hidden' : ''}`;

        if (href) {
            return (
                <a
                    href={href}
                    onClick={onClick ? (e) => onClick(e) : undefined}
                    class={className}
                    aria-label={label}
                    {...dataAttr}
                    data-astro-prefetch
                    style={positionStyle}
                >
                    <Icon class="w-6 h-6" />
                </a>
            );
        }

        return (
            <button
                type="button"
                onClick={onClick ? (e) => onClick(e) : undefined}
                class={className}
                aria-label={label}
                {...dataAttr}
                style={positionStyle}
            >
                <Icon class="w-6 h-6" />
            </button>
        );
    };

    // Solo renderizar en el cliente y usar Portal para escapar de contenedores con transform/overflow
    if (!mounted || typeof document === 'undefined') return null;

    // Inyectamos estilos críticos con !important para vencer cualquier conflicto global
    const criticalStyles = `
        .nav-arrow-fixed {
            position: fixed;
            top: 50%;
            transform: translateY(-50%);
            z-index: 2147483647 !important; /* Max Z-Index */
            opacity: 1 !important;
            visibility: visible !important;
            display: flex !important;
            width: 44px;
            height: 44px;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            border: 1px solid var(--surface-muted-border, #e5e5e5) !important;
            background-color: var(--color-bg, #f5f5f0) !important;
            color: var(--color-link, #2e7d32) !important;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            text-decoration: none !important;
            padding: 0 !important;
            margin: 0 !important;
            appearance: none !important;
            backdrop-filter: blur(8px);
        }
        .nav-arrow-hidden {
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
            transform: translateY(-50%) scale(0.9) !important;
        }
        .nav-arrow-fixed:hover {
            transform: translateY(-50%) scale(1.1);
            background-color: var(--color-link, #2e7d32) !important;
            color: white !important;
            box-shadow: 0 6px 16px rgba(0,0,0,0.15);
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
        }
        @media (max-width: 768px) {
            .nav-arrow-fixed {
                width: 38px;
                height: 38px;
            }
        }
    `;

    return createPortal(
        <>
            <style>{criticalStyles}</style>
            {renderArrow('prev')}
            {renderArrow('next')}
        </>,
        document.body
    );
}
