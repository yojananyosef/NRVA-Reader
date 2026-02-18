
import { useState, useEffect } from 'preact/hooks';
import type { BiblePassage } from '../../../domain/search/SearchEntities';

const CHANNEL_NAME = 'bible-projection-channel';

export interface ProjectionMessage {
    type: 'verse' | 'clear';
    passage?: BiblePassage;
    text?: string;
    reference?: string;
    version?: string;
}

export function useProjectionSender() {
    const [channel, setChannel] = useState<BroadcastChannel | null>(null);
    const [isProjecting, setIsProjecting] = useState(false);

    useEffect(() => {
        const bc = new BroadcastChannel(CHANNEL_NAME);
        setChannel(bc);
        return () => bc.close();
    }, []);

    const projectVerse = (passage: BiblePassage, text: string, reference: string) => {
        if (channel) {
            channel.postMessage({
                type: 'verse',
                passage,
                text,
                reference
            } as ProjectionMessage);
            setIsProjecting(true);
        }
    };

    const clearProjection = () => {
        if (channel) {
            channel.postMessage({ type: 'clear' } as ProjectionMessage);
            setIsProjecting(false);
        }
    };

    const openProjectionWindow = () => {
        // Calculate center of screen or dual monitor if possible
        const width = 1024;
        const height = 768;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);

        // Usar popup=yes para un look más nativo y evitar bloqueos en algunos contextos si es user-initiated
        const win = window.open(
            '/projection',
            'BibleProjection',
            `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes,popup=yes`
        );

        if (win) {
            setIsProjecting(true);
            win.focus();
        } else {
            alert("El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.");
        }
        return win;
    };

    return { projectVerse, clearProjection, openProjectionWindow, isProjecting };
}

export function useProjectionReceiver() {
    const [data, setData] = useState<ProjectionMessage | null>(null);

    useEffect(() => {
        const bc = new BroadcastChannel(CHANNEL_NAME);
        bc.onmessage = (event) => {
            if (event.data) {
                setData(event.data);
            }
        };
        return () => bc.close();
    }, []);

    return data;
}
