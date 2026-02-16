import { useState, useEffect, useMemo } from "preact/hooks";
import { Search, Volume2 } from "lucide-preact";
import { fetchWithCache } from "../../../utils/fetchWithCache";
import ArrowNavigation from "../../../components/common/ArrowNavigation";

export default function StrongDictionary() {
  const [data, setData] = useState<{ hebrew: any; greek: any }>({ hebrew: {}, greek: {} });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("search") || "";
    }
    return "";
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [dictionaryType, setDictionaryType] = useState<"hebrew" | "greek">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const type = params.get("type");
      if (type === "greek") return "greek";
    }
    return "hebrew";
  });
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchData(forceRefresh = false) {
      try {
        setLoading(true);
        // Si forceRefresh es true, podemos añadir un query param para saltar cache del navegador
        // aunque fetchWithCache tiene su propia lógica.
        const url = "/data/strong/strong-data.json" + (forceRefresh ? `?v=${Date.now()}` : "");
        const json = await fetchWithCache<any>(url);
        setData(json);

        // Si el tipo es griego y está vacío, podría ser un problema de caché
        const params = new URLSearchParams(window.location.search);
        const type = params.get("type");
        if (type === "greek" && (!json.greek || Object.keys(json.greek).length === 0) && !forceRefresh) {
          console.log("Greek data empty, retrying with cache bust...");
          fetchData(true);
          return;
        }
      } catch (e) {
        console.error("Error loading strong data:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const type = params.get("type") as "hebrew" | "greek";
      const search = params.get("search") || "";

      if (type && (type === "hebrew" || type === "greek")) {
        setDictionaryType(type);
      }
      if (search) {
        setSearchTerm(search);
      }
      setCurrentPage(1);
    };

    window.addEventListener("popstate", handleUrlChange);
    document.addEventListener("astro:after-swap", handleUrlChange);

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      document.removeEventListener("astro:after-swap", handleUrlChange);
    };
  }, []);

  const filteredItems = useMemo(() => {
    const sourceData = dictionaryType === "greek" ? data.greek : data.hebrew;
    const prefix = dictionaryType === "greek" ? "G" : "H";

    const items = Object.entries(sourceData || {}).map(([id, details]: [string, any]) => ({
      id: `${prefix}${id}`,
      ...details
    }));

    if (!searchTerm) return items;

    const term = searchTerm.toLowerCase();
    return items.filter(item =>
      item.id.toLowerCase().includes(term) ||
      (item.originalWord && item.originalWord.toLowerCase().includes(term)) ||
      (item.definition && item.definition.toLowerCase().includes(term)) ||
      (item.pronunciation && item.pronunciation.toLowerCase().includes(term))
    );
  }, [data, searchTerm, dictionaryType]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const playAudio = (id: string) => {
    // Los archivos están en carpetas separadas según el idioma
    const numericId = id.replace(/^[HG]/, "");
    const typeFolder = id.startsWith("G") ? "greek" : "hebrew";
    const audio = new Audio(`/audio/strong/${typeFolder}/${numericId}.mp3`);
    audio.play().catch(e => {
      console.error("Error audio:", e);
    });
  };

  if (loading && Object.keys(data).length === 0) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-link)]"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text)]">
            Diccionario de Strong de {dictionaryType === "greek" ? "griego" : "hebreo"}
          </h1>
          <p className="text-[var(--color-text)] opacity-60 text-sm">
            Mostrando items {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredItems.length)} de {filteredItems.length} en total
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Textos a buscar"
              value={searchTerm}
              onInput={(e) => {
                setSearchTerm(e.currentTarget.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-text)] border-opacity-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-link)] w-64 text-[var(--color-text)] h-[40px]"
            />
          </div>
          <div
            className="bg-[var(--surface-muted-bg)] border border-[var(--surface-muted-border)] rounded-xl hover:bg-[var(--surface-hover-bg)] transition-all w-[44px] h-[44px] flex items-center justify-center flex-shrink-0 p-0 cursor-pointer"
            title="Buscar"
          >
            <Search size={20} strokeWidth={2} className="text-[var(--color-link)]" />
          </div>
        </div>
      </div>

      <ArrowNavigation
        onPrev={currentPage > 1 ? () => setCurrentPage(p => p - 1) : undefined}
        onNext={currentPage < totalPages ? () => setCurrentPage(p => p + 1) : undefined}
        prevLabel="Página anterior"
        nextLabel="Siguiente página"
      />

      <div className="bg-[var(--surface-muted-bg)] rounded-2xl border border-[var(--surface-muted-border)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--surface-muted-border)] text-sm font-medium text-[var(--color-text)] opacity-40">
              <th className="px-6 py-4">Cód.</th>
              <th className="px-6 py-4">Palab.Orig.</th>
              <th className="px-6 py-4">Pron.</th>
              <th className="px-6 py-4">Definición</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--surface-muted-border)]">
            {paginatedItems.map((item) => (
              <tr key={item.id} className="hover:bg-[color-mix(in_srgb,var(--color-link),transparent_90%)] transition-colors group border-b border-[var(--surface-muted-border)]">
                <td className="px-6 py-4">
                  <a
                    href={`/strong/${item.id}`}
                    className="font-bold hover:underline transition-colors block text-[var(--color-link)]"
                    data-astro-prefetch
                  >
                    {item.id.replace(/^[HG]/, '')}
                  </a>
                </td>
                <td className={`px-6 py-4 text-4xl text-[var(--color-text)] transition-colors ${dictionaryType === "hebrew" ? "font-hebrew" : ""}`} dir={dictionaryType === "hebrew" ? "rtl" : "ltr"}>
                  {item.originalWord}
                </td>
                <td className="px-6 py-4 italic text-[var(--color-link)] font-medium transition-colors">
                  {item.pronunciation}
                </td>
                <td className="px-6 py-4 text-[var(--color-text)] opacity-80 text-sm max-w-md transition-all">
                  {item.definition}
                </td>
                <td className="px-6 py-4 text-right">
                  <div
                    onClick={() => playAudio(item.id)}
                    className="bg-[var(--surface-muted-bg)] border border-[var(--surface-muted-border)] rounded-xl hover:bg-[var(--surface-hover-bg)] transition-all w-[44px] h-[44px] flex items-center justify-center flex-shrink-0 p-0 cursor-pointer text-[var(--color-link)] ml-auto"
                  >
                    <Volume2 size={20} strokeWidth={2} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
