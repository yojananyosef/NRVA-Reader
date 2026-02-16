import { useState, useEffect } from 'preact/hooks';
import HomeView from '../../home/components/HomeView';
import ReaderView from './ReaderView';

export default function MainRouter() {
    const [view, setView] = useState<'home' | 'reader'>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.has('book') ? 'reader' : 'home';
        }
        return 'home';
    });

    const [searchString, setSearchString] = useState(() => typeof window !== 'undefined' ? window.location.search : '');

    useEffect(() => {
        const checkRoute = () => {
            const params = new URLSearchParams(window.location.search);
            const hasBook = params.has('book');
            const newView = hasBook ? 'reader' : 'home';

            setView(newView);
            setSearchString(window.location.search);

            if (!hasBook) {
                document.title = "Inicio - Lectura Accesible";
            }
        };

        // Check immediately
        checkRoute();

        window.addEventListener('popstate', checkRoute);
        document.addEventListener('astro:page-load', checkRoute);
        document.addEventListener('astro:after-swap', checkRoute);

        return () => {
            window.removeEventListener('popstate', checkRoute);
            document.removeEventListener('astro:page-load', checkRoute);
            document.removeEventListener('astro:after-swap', checkRoute);
        };
    }, []);

    return view === 'home' ? <HomeView /> : <ReaderView key={searchString} />;
}
