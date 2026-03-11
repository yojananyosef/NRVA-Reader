import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';

export const prerender = false; // Important: Make this route SSR

// Definimos la estructura básica que usaremos
interface VerseEntry {
    b: string; // Book code
    bn: string; // Book name
    c: number; // Chapter
    v: number; // Verse
    t: string; // Text
}

let bibleIndexCache: VerseEntry[] | null = null;

async function getBibleIndex(): Promise<VerseEntry[]> {
    if (bibleIndexCache) return bibleIndexCache;
    
    // Al estar en SSR/Node, leemos el archivo
    // Resolvemos la ruta considerando si está compilado en dist/ o en dev src/
    // Una forma universal en Astro es process.cwd() apuntando a la raíz del proyecto
    const indexPath = path.join(process.cwd(), 'src/data/bible-search-index.json');
    try {
        const fileContent = await fs.readFile(indexPath, 'utf-8');
        bibleIndexCache = JSON.parse(fileContent);
        return bibleIndexCache!;
    } catch (e) {
        console.error("Error cargando índice de la Biblia:", e);
        return [];
    }
}

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (!query || query.length < 3) {
        return new Response(JSON.stringify({ error: "Term is too short", data: [] }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const index = await getBibleIndex();
        if (index.length === 0) {
           return new Response(JSON.stringify({ error: "No se pudo cargar el índice. Ejecuta el script de generación.", data: [] }), { 
               status: 500,
               headers: { 'Content-Type': 'application/json' }
           });
        }

        const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        console.time("Search");
        // Optimizamos la búsqueda: Normalizamos el texto de la Biblia solo para la comprobación
        let results = [];
        
        // Un loop rápido es a veces mejor que .filter para poder limitar a N resultados rápidamente
        // o si queremos ordenarlos.
        for (let entry of index) {
            // normalizamos
            const textNormalized = entry.t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            if (textNormalized.includes(normalizedQuery)) {
                results.push(entry);
            }
            // Límite razonable (ej. miconcordancia suele mostrar todos, pero podemos limitar a 100 para no reventar la UI)
            if (results.length >= 150) break;
        }
        console.timeEnd("Search");

        return new Response(JSON.stringify({ data: results, total: results.length }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60' // Cache temporal
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: "Error en el servidor", data: [] }), { status: 500 });
    }
};
