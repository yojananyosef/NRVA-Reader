# Aaccessible Reading: Lectura Accesible para Dislexia

Aplicación web construida con Astro y Preact que ofrece una experiencia de lectura optimizada para personas con dislexia y dificultades cognitivas. Integra recomendaciones tipográficas y de UX basadas en evidencia científica, con controles de personalización en tiempo real y lectura en voz alta (TTS).

Referencia técnica y base conceptual: `c:\Users\Usuario\Desktop\astro-reader\position_paper_dev_to.md`.

## Características

1. Personalización de tipografía: tamaño, interlineado, espaciado de letras y palabras.
2. Temas accesibles: claro, oscuro y sepia con contrastes equilibrados.
3. Fuentes: `Arial/Verdana` y `OpenDyslexic` local (sin dependencias externas de CDN).
4. Lectura en voz alta (TTS) con control de velocidad y opción de saltar números de versículo y notas.
5. Navegación por libros y capítulos con URL semánticas (`/?book=...&chapter=...`).
6. Resaltado de versículos y guardado local de preferencias y marcas (`localStorage`).
7. Carga dinámica de datos por libro para rendimiento y memoria optimizados.
8. **Sistema de Letras Rojas (Red Letter Edition)**:
   - Resaltado automático de las palabras de Jesús en color rojo (personalizable).
   - **Nota**: Esta característica está actualmente en desarrollo y se está implementando manualmente versículo por versículo para garantizar la máxima precisión. Por ahora, solo algunos capítulos de Mateo están disponibles.
   - Mapeo preciso por versículo para evitar resaltados incorrectos en narrativas.
   - Lógica inteligente de "split" para separar palabras de Jesús de la narrativa en un mismo versículo.
   - Detección automática de hablantes para excluir respuestas de otros personajes (ej. Mateo 9:28).

## Instalación y Configuración

1. Requisitos previos
   - `Bun` ≥ 1.3
   - `Node.js` ≥ 18 (para compatibilidad de herramientas)
   - Navegador moderno con soporte para `SpeechSynthesis` (Chrome, Edge, Safari, Firefox parcialmente)

2. Instalación
   ```sh
   bun install
   ```

3. Desarrollo
   ```sh
   bun dev
   # Servidor en http://localhost:4321 (o próximo puerto disponible)
   ```

4. Build de producción
   ```sh
   bun run build
   bun run preview
   ```

5. Verificación de tipos (Astro Check)
   ```sh
   bun astro -- check
   ```

## Dependencias

- `astro` 5.x, `@astrojs/preact` para islands de UI.
- `@astrojs/node` como adaptador en desarrollo y servidor.
- `preact` 10.x para componentes.
- `nanostores` para estado reactivo (`preferences`, `highlights`).
- `lucide-preact` para iconos accesibles.
- `@tailwindcss/vite` y `tailwindcss` 4 para utilidades CSS modernas.

## Uso

1. Inicia el servidor de desarrollo:
   ```sh
   bun dev
   ```
2. Abre el navegador y navega por libros/capítulos:
   - Ejemplos:
     - `http://localhost:4321/?book=gen&chapter=1`
     - `http://localhost:4321/?book=psa&chapter=23`
3. Usa la barra superior:
   - Botón “Libros” para seleccionar libro y capítulo.
   - Botón “Configuración” para ajustar tema, fuente y parámetros tipográficos.
   - Botón “Leer en voz alta” para reproducir contenido (TTS).

Preferencias persistidas en `localStorage` bajo la clave `bible-reader-prefs`. Los resaltados se guardan en `bible-reader-highlights`.

## Estructura de Archivos

```text
/
├── astro.config.mjs
├── public/
│   ├── favicon.svg
│   └── fonts/
│       ├── OpenDyslexic-Regular.woff
│       ├── OpenDyslexic-Bold.woff
│       ├── OpenDyslexic-Italic.woff
│       └── OpenDyslexic-BoldItalic.woff
├── src/
│   ├── pages/
│   │   └── index.astro
│   ├── features/
│   │   └── reader/
│   │       ├── layouts/
│   │       │   └── ReaderLayout.astro
│   │       ├── components/
│   │       │   ├── ReaderContent.astro
│   │       │   └── ReaderControls.tsx
│   │       ├── hooks/
│   │       │   └── useTTS.ts
│   │       └── scripts/
│   │           └── theme-manager.ts
│   ├── stores/
│   │   ├── preferences.ts
│   │   └── highlights.ts
│   ├── styles/
│   │   └── dyslexia-theme.css
│   └── data/
│       ├── books-index.json
│       └── books/
│           ├── gen.json
│           ├── psa.json
│           └── ... (un archivo por libro)
└── package.json
```

## Troubleshooting

1. Puerto ocupado (`vite`): el dev server cambiará de puerto automáticamente (4321 → 4322). Verifica la URL en consola.
2. Fuente OpenDyslexic no carga: confirma que los `.woff` existen en `public/fonts/` y que `dyslexia-theme.css` define `@font-face` con rutas relativas (`/fonts/...`).
3. TTS no funciona: tu navegador puede no soportar `SpeechSynthesis` o tenerlo deshabilitado. Prueba en Chrome/Edge y verifica permisos de audio.
4. Redirecciones al inicio al navegar capítulos: ocurre si `/?book` o `&chapter` son inválidos o el archivo del libro no existe en `src/data/books/`.
5. Error con adaptadores: en desarrollo se usa `@astrojs/node`. Si cambias de adaptador, revisa `astro.config.mjs`.
6. Estilos no aplican: asegúrate de que `ReaderLayout.astro` importe `src/styles/dyslexia-theme.css` y que el body tenga los atributos `data-theme` y `data-font`.

### Entornos y Despliegue
- Detección automática del entorno en `astro.config.mjs`:
  - Selección `@astrojs/netlify` si `NETLIFY=true`, `ASTRO_DEPLOY_TARGET=netlify` o existe `DEPLOY_URL`.
  - Selección `@astrojs/node` en local y otros entornos.
- Tests de configuración:
  ```sh
  bun test
  ```
  Verifican la detección con diferentes variables de entorno.

## Licencia y Contribución

- Contenido y guía conceptual: el paper `position_paper_dev_to.md` se publica bajo **CC‑BY‑4.0**.
- Código: **MIT License**. Consulta el archivo `LICENSE`.
- Contribuciones:
  1. Crea un fork y una rama con tu mejora.
  2. Sigue los principios del paper y de Clean Code (tipado, modularidad, accesibilidad).
  3. Ejecuta `bun astro -- check` y `bun run build` antes de abrir PR.

## Referencia Técnica (Paper)

El diseño y los parámetros por defecto se basan en:  
`c:\Users\Usuario\Desktop\astro-reader\position_paper_dev_to.md`  
Incluye la evidencia neurocognitiva y recomendaciones CSS/UX (tamaño 18px, interlineado 1.6, espaciados positivos, ancho 65ch, tema claro crema por defecto, y guías de interacción accesible).
