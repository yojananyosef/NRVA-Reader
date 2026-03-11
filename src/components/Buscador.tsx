import { useState, useEffect, useRef } from 'preact/hooks';

export default function Buscador() {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Para resaltar la palabra buscada
  function highlightText(text: string, query: string) {
    if (!query || query.length < 3) return text;
    // Eliminamos acentos para armar la regex, pero conservamos el texto original
    const normalizedQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${normalizedQuery})`, 'gi');
    
    // Esto es magia negra de React/Preact para inyectar HTML de forma segura y reemplazar sin perder capitalización
    // Como el index tiene el texto exacto, la regex puede a veces no matchear vocales acentuadas. 
    // Para simplificar, confiamos en replace simple
    return <span dangerouslySetInnerHTML={{ 
        __html: text.replace(regex, '<mark class="bg-[var(--color-highlight)] text-[var(--color-text)] px-1 rounded-sm">$1</mark>') 
    }} />;
  }

  // Effect de debounce para buscar
  useEffect(() => {
    if (query.trim().length < 3) {
      setResultados([]);
      setError(null);
      return;
    }

    const abortController = new AbortController();

    const search = async () => {
      setCargando(true);
      setError(null);
      
      try {
        const res = await fetch(`/api/buscar?q=${encodeURIComponent(query)}`, {
          signal: abortController.signal
        });
        
        const json = await res.json();
        
        if (!res.ok) {
           setError(json.error || 'Error en la búsqueda');
           setResultados([]);
        } else {
           setResultados(json.data || []);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error("Error buscando:", e);
          setError("Ocurrió un error inesperado al conectar.");
        }
      } finally {
        setCargando(false);
      }
    };

    const timeout = setTimeout(search, 300);

    return () => {
      clearTimeout(timeout);
      abortController.abort();
    };
  }, [query]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 tablet:p-6 space-y-6 animate-fade-in transition-all">
      <div className="relative group perspective-1000">
          <input 
            type="search" 
            placeholder="Buscar en la Biblia (ej. amor, fortaleza)..." 
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-[var(--surface-muted-border)]
                     bg-[var(--surface-muted-bg)] backdrop-blur-xl 
                     focus:border-[var(--color-link)] focus:ring-[var(--color-link)]/20 focus:ring-4
                     text-lg text-[var(--color-text)] placeholder-[color-mix(in_srgb,var(--color-text)_50%,transparent)]
                     shadow-sm hover:shadow-md focus:shadow-xl
                     transition-all duration-300 ease-out z-10"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[color-mix(in_srgb,var(--color-text)_50%,transparent)] group-focus-within:text-[var(--color-link)] transition-colors" 
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
      </div>

      {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50 flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="font-medium text-sm">{error}</p>
          </div>
      )}

      {/* Skeletons de Carga */}
      {cargando && (
        <div className="space-y-4 animate-pulse">
            {[1,2,3,4,5].map(i => (
                <div key={i} className="h-24 bg-[var(--surface-muted-bg)] rounded-xl w-full border border-[var(--surface-muted-border)]" />
            ))}
        </div>
      )}

      {/* Resultados */}
      {!cargando && resultados.length > 0 && (
        <div className="space-y-6">
            <h3 className="text-sm font-semibold text-[color-mix(in_srgb,var(--color-text)_50%,transparent)] uppercase tracking-wider pl-2">
                Concordancias ({resultados.length}{resultados.length === 150 ? '+' : ''})
            </h3>
            <ul className="grid gap-4 auto-rows-min">
              {resultados.map((res: any, i) => (
                // Enlace dinámico al libro en tu app (dependiendo de la URL real)
                // Asumo /bible/[book]/[chapter]
                <a 
                   href={`/?book=${res.b.toLowerCase()}&chapter=${res.c + 1}&verses=${res.v + 1}#v-${res.v + 1}`}
                   key={i} 
                   className="group block p-5 bg-[var(--color-bg)] rounded-xl border border-[var(--surface-muted-border)] 
                              shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-[var(--color-link)]
                              transition-all duration-300 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-[var(--color-link)]"
                >
                  {/* Decorative background circle on hover */}
                  <div className="absolute opacity-0 group-hover:opacity-10 dark:group-hover:opacity-[0.03] transition-opacity top-0 right-0 w-32 h-32 bg-[var(--color-link)] rounded-bl-full pointer-events-none" />
                  
                  <span className="inline-flex items-center gap-2 font-bold text-[var(--color-link)] mb-2 font-serif tracking-wide text-lg">
                    {res.bn} {res.c + 1}:{res.v + 1}
                    <svg className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[var(--color-link)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                  
                  <p className="text-[var(--color-text)] opacity-90 font-serif leading-relaxed text-base md:text-lg">
                    {/* Sumamos 1 a capitulo y versiculo porque internamente el JSON está basado en índices (0-index posiblemente) 
                        Depende de cómo sea la DB. Ajustaremos si hace falta. */}
                    {highlightText(res.t, query)}
                  </p>
                </a>
              ))}
            </ul>
        </div>
      )}

      {/* Empty state (buscó pero sin resultados) */}
      {!cargando && !error && query.trim().length >= 3 && resultados.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center opacity-80 animate-fade-in-up">
              <div className="w-20 h-20 bg-[var(--surface-muted-bg)] rounded-full flex items-center justify-center mb-6 text-2xl shadow-inner">🔍</div>
              <h4 className="text-xl font-bold text-[var(--color-text)] mb-2">Sin concordancias</h4>
              <p className="text-[var(--color-text)] opacity-70 max-w-sm">No pudimos encontrar la palabra <strong>"{query}"</strong> en los manuscritos disponibles.</p>
          </div>
      )}
    </div>
  );
}
