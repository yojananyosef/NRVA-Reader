import { useState, useEffect } from "preact/hooks";
import { Volume2, Search } from "lucide-preact";
import type { StrongData } from "../types";
import ArrowNavigation from "../../../components/common/ArrowNavigation";
import { fetchWithCache } from "../../../utils/fetchWithCache";

interface Props {
  id: string;
  initialData?: any;
}

export default function StrongDetail({ id, initialData }: Props) {
  const formatData = (entry: any): StrongData => ({
    id: entry.strongNumber,
    word: entry.originalWord,
    transliteration: entry.pronunciation,
    pronunciation: entry.pronunciation,
    definitions: {
      definition: entry.definition,
      extendedDefinition: entry.extendedDefinition,
      reinaValeraDefinition: entry.RVDefinition
    },
    grammar: entry.partOfSpeech,
    frequency: Object.values(entry.wordFrequencyRV || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number,
    audio: `/audio/strong/${entry.strongNumber.startsWith('G') ? 'greek' : 'hebrew'}/${parseInt(entry.strongNumber.replace(/^[HG]/, ""))}.mp3`,
    wordFrequencyRV: entry.wordFrequencyRV
  });

  const [data, setData] = useState<StrongData | null>(initialData ? formatData(initialData) : null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [] = useState<"def" | "gram" | "freq">("def");
  const [searchQuery, setSearchQuery] = useState("");

  const type = id.startsWith('G') ? 'G' : 'H';
  const numericId = parseInt(id.replace(/^[HG]/, ""));

  // Límites aproximados (H: 8674, G: 5624) - Usaremos 8680 para H según comentario del usuario
  const maxH = 8680;
  const maxG = 5624;
  const currentMax = type === 'H' ? maxH : maxG;

  const prevId = numericId > 1 ? `${type}${numericId - 1}` : null;
  const nextId = numericId < currentMax ? `${type}${numericId + 1}` : null;

  useEffect(() => {
    // Si el ID cambia, reseteamos el estado de búsqueda para evitar confusiones
    setSearchQuery("");

    if (initialData && (initialData.strongNumber === id || `H${initialData.strongNumber}` === id || `G${initialData.strongNumber}` === id)) {
      setData(formatData(initialData));
      setLoading(false);
      return;
    }

    async function fetchData() {
      // Solo mostramos loading si no hay datos previos o es una carga inicial real
      if (!data || data.id !== id) setLoading(true);
      setError(null);
      try {
        const allData = await fetchWithCache<any>("/data/strong/strong-data.json");
        const key = type === 'H' ? 'hebrew' : 'greek';
        const strongEntry = allData[key]?.[numericId.toString()];

        if (strongEntry) {
          setData({
            id: strongEntry.strongNumber,
            word: strongEntry.originalWord,
            transliteration: strongEntry.pronunciation,
            pronunciation: strongEntry.pronunciation,
            definitions: {
              definition: strongEntry.definition,
              extendedDefinition: strongEntry.extendedDefinition,
              reinaValeraDefinition: strongEntry.RVDefinition
            },
            grammar: strongEntry.partOfSpeech,
            frequency: Object.values(strongEntry.wordFrequencyRV || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number,
            audio: `/audio/strong/${type === 'G' ? 'greek' : 'hebrew'}/${numericId}.mp3`,
            wordFrequencyRV: strongEntry.wordFrequencyRV
          });
        } else {
          setError(`No se encontraron datos para el número Strong ${id}.`);
        }
      } catch (err) {
        setError("Error al cargar los datos del diccionario.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleSearch = (e: any) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirigir a la búsqueda o al número strong si es numérico
      const term = searchQuery.trim().toUpperCase();
      if (/^[HG]?\d+$/.test(term)) {
        const formattedId = term.startsWith('H') || term.startsWith('G') ? term : `H${term}`;
        window.location.href = `/strong/${formattedId}`;
      } else {
        // Por ahora, redirigir al diccionario con el término de búsqueda
        window.location.href = `/strong?search=${encodeURIComponent(searchQuery)}`;
      }
    }
  };

  const playAudio = () => {
    // Calculamos la URL en el momento de la reproducción basándonos en el ID actual
    const typeFolder = id.startsWith('G') ? 'greek' : 'hebrew';
    const numericId = parseInt(id.replace(/^[HG]/, ""));
    const audioUrl = `/audio/strong/${typeFolder}/${numericId}.mp3`;

    console.log("Reproduciendo audio desde:", audioUrl);
    const audio = new Audio(audioUrl);
    audio.play().catch(e => {
      console.error("Error al reproducir audio:", e);
    });
  };

  if (loading && !data) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-link)]"></div>
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-[var(--color-text)] opacity-60">
      <p className="text-xl mb-4">{error || "No se encontraron datos."}</p>
      <button
        onClick={() => window.history.back()}
        className="text-[var(--color-link)] hover:underline"
      >
        Volver atrás
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-4 relative">
      <ArrowNavigation
        prevHref={prevId ? `/strong/${prevId}` : undefined}
        nextHref={nextId ? `/strong/${nextId}` : undefined}
        prevLabel="Anterior"
        nextLabel="Siguiente"
      />

      {/* Barra superior con búsqueda */}
      <div className="flex justify-end items-center mb-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Textos a buscar"
              value={searchQuery}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              className="pl-4 pr-10 py-2 bg-[var(--color-bg)] border border-[var(--color-text)] border-opacity-10 rounded-xl w-64 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-link)] h-[40px]"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text)] opacity-40 pointer-events-none" />
          </div>
          <div
            onClick={(e) => {
              // Buscar el formulario padre y disparar el submit
              const form = e.currentTarget.closest('form');
              if (form) form.requestSubmit();
            }}
            className="bg-[var(--surface-muted-bg)] border border-[var(--surface-muted-border)] rounded-xl hover:bg-[var(--surface-hover-bg)] transition-all w-[44px] h-[44px] flex items-center justify-center flex-shrink-0 p-0 cursor-pointer"
          >
            <Search size={20} strokeWidth={2} className="text-[var(--color-link)]" />
          </div>
        </form>
      </div>

      {/* Título Principal */}
      <div className="bg-[var(--surface-muted-bg)] rounded-xl p-8 text-center border border-[var(--surface-muted-border)] shadow-sm">
        <h1 className="text-4xl font-bold text-[var(--color-text)] flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <span className="opacity-70">Strong {type === 'H' ? 'hebreo' : 'griego'} #{data.id.replace(/^[HG]/, '')}</span>
          <span className="font-hebrew text-6xl text-[var(--color-text)]" dir="rtl">{data.word}</span>
          <span className="italic text-[var(--color-text)] opacity-50 font-normal text-3xl">{data.pronunciation}</span>
        </h1>
      </div>

      {/* Contenido Estilo LogosKLogos */}
      <div className="bg-[var(--surface-muted-bg)] border-2 border-[var(--color-link)] border-opacity-20 rounded-2xl p-8 mt-8 relative shadow-sm">
        <div className="flex justify-center mb-10">
          <h2 className="text-2xl font-bold text-[var(--color-text)] uppercase tracking-widest text-center max-w-2xl">
            {data.id.replace(/^[HG]/, '')} {data.definitions.reinaValeraDefinition?.split(/[,;.]/)[0] || data.definitions.definition.split(/[,;.]/)[0]}
          </h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="px-6 py-2 bg-[var(--color-link)] text-white font-bold rounded-lg min-w-[140px] text-xs uppercase tracking-wider shadow-sm flex items-center justify-center">
                Pronunciación
              </div>
            </div>
            <div className="py-2 text-lg text-[var(--color-text)] font-medium">{data.pronunciation}</div>
          </div>

          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="px-6 py-2 bg-[var(--color-link)] text-white font-bold rounded-lg min-w-[140px] text-xs uppercase tracking-wider shadow-sm flex items-center justify-center">
                Derivación
              </div>
            </div>
            <div className="py-2 text-lg text-[var(--color-text)]">{data.grammar || 'N/A'}</div>
          </div>

          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="px-6 py-2 bg-[var(--color-link)] text-white font-bold rounded-lg min-w-[140px] text-xs uppercase tracking-wider shadow-sm flex items-center justify-center">
                Definición
              </div>
            </div>
            <div className="py-2 text-lg text-[var(--color-text)] leading-relaxed">
              {data.definitions.definition}
            </div>
          </div>

          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="px-6 py-2 bg-[var(--color-link)] text-white font-bold rounded-lg min-w-[140px] text-xs uppercase tracking-wider shadow-sm flex items-center justify-center">
                Def.en RV
              </div>
            </div>
            <div className="py-2 text-lg text-[var(--color-text)] leading-relaxed opacity-90">
              {data.definitions.reinaValeraDefinition}
            </div>
          </div>
        </div>

        <div className="absolute top-8 left-8">
          <div
            onClick={playAudio}
            className="bg-[var(--surface-muted-bg)] border border-[var(--surface-muted-border)] rounded-xl hover:bg-[var(--surface-hover-bg)] transition-all w-[44px] h-[44px] flex items-center justify-center flex-shrink-0 p-0 cursor-pointer text-[var(--color-link)]"
            aria-label="Reproducir audio"
          >
            <Volume2 size={24} strokeWidth={2} />
          </div>
        </div>
      </div>
    </div>
  );
}
