/**
 * Mapeo de códigos de libro a nombres de archivo de comentarios.
 * Normaliza cualquier variante o alias del código de libro para resolver el archivo JSON correcto.
 */

const COMMENTARY_CODE_MAP: Record<string, string> = {
    'esd': 'ezr',
    'ezr': 'ezr',
    '1cr': '1ch',
    '1ch': '1ch',
    '2cr': '2ch',
    '2ch': '2ch',
    '1re': '1ki',
    '1ki': '1ki',
    '2re': '2ki',
    '2ki': '2ki',
    'jue': 'jdg',
    'jdg': 'jdg',
    'son': 'sol',
    'sol': 'sol',
    'ose': 'hos',
    'hos': 'hos',
};

export function getCommentaryBookCode(code: string): string {
    if (!code) return '';
    const normalized = code.toLowerCase();
    return COMMENTARY_CODE_MAP[normalized] || normalized;
}
