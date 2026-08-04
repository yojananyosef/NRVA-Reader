# NRVA Reader v2.0 - Plataforma de Estudio Bíblico Accesible

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Version](https://img.shields.io/badge/version-2.0.0-green.svg) ![Astro](https://img.shields.io/badge/astro-5.x-orange.svg) ![Preact](https://img.shields.io/badge/preact-10.x-purple.svg)

**NRVA Reader** es la plataforma web progresiva (PWA) oficial impulsada por la versión **Nueva Reina Valera Accesible (NRVA)**, diseñada desde cero con un enfoque neurocognitivo para la accesibilidad (especialmente dislexia y estrés visual). No es solo un lector; es una implementación de referencia de principios de diseño inclusivo basados en evidencia científica.

## 🧠 Filosofía y Ciencia (Position Paper)

Esta aplicación implementa las recomendaciones del documento técnico `position_paper_dev_to.md` incluido en este repositorio:

1.  **Más allá de la "Fuente Mágica"**: Reconoce que la accesibilidad no se logra solo cambiando la fuente (ej. OpenDyslexic), sino mediante un sistema tipográfico holístico.
2.  **Parámetros Neurocognitivos**:
    *   **Anti-Crowding**: Espaciado inter-letra (0.02em) e inter-palabra (0.16em) calibrados para reducir la confusión visual.
    *   **Ritmo Vertical**: `line-height` mínimo de 1.6 para evitar saltos de línea erróneos.
    *   **Ancho de Lectura Óptimo**: Limitado a ~65 caracteres por línea para minimizar la fatiga sacádica.
3.  **Mitigación del Estrés Visual (Irlen)**: Evita contrastes extremos (negro puro sobre blanco puro). Usa combinaciones de bajo estrés como crema/gris oscuro o sepia.
4.  **River Effect**: Texto alineado a la izquierda (no justificado) para evitar "ríos" de espacio en blanco que distraen.

## 🏗️ Arquitectura: Screaming Architecture & Clean Code

El proyecto sigue una arquitectura modular y "gritona" (Screaming Architecture), donde la estructura de carpetas revela la intención del negocio, no solo el framework.

### Estructura del Proyecto

```text
src/
├── application/       # Casos de uso y lógica de aplicación pura
│   ├── commentary/    # Lógica de comentarios bíblicos
│   ├── interlinear/   # Lógica de texto interlineal
│   ├── reader/        # Lógica central de lectura y TTS
│   └── tracker/       # Lógica de seguimiento de progreso
├── domain/            # Entidades de negocio y reglas (Framework Agnostic)
│   ├── bible/         # Definiciones de Libro, Capítulo, Versículo
│   └── search/        # Modelos de búsqueda
├── features/          # Implementación de UI por características (Vertical Slices)
│   ├── home/          # Pantalla principal y modales
│   ├── interlinear/   # Vista interlineal Griego/Hebreo
│   ├── plans/         # Sistema de planes de lectura
│   ├── reader/        # El lector principal (Core Feature)
│   ├── strong/        # Concordancia y diccionario Strong
│   └── tracker/       # UI de seguimiento de lectura
├── components/        # Componentes UI compartidos (Atom/Molecule)
├── stores/            # Estado global reactivo (Nanostores)
└── utils/             # Utilidades puras e infraestructura
```

### Principios SOLID Aplicados

*   **SRP (Single Responsibility)**: Cada hook y componente tiene una única razón para cambiar (ej. `useTTS` solo maneja audio, `useBibleData` solo carga datos).
*   **OCP (Open/Closed)**: El sistema de temas y configuración es extensible sin modificar el núcleo del lector.
*   **DIP (Dependency Inversion)**: La lógica de negocio (`domain`) no depende de la UI (`features`) ni del framework (`astro`).

## ✨ Características (v2.0)

### 1. Lector Bíblico Neuro-Optimizado (`features/reader`)
*   **Personalización Total**: Tamaño, espaciado, fuente (Sans-Serif, Serif, OpenDyslexic), tema.
*   **TTS (Text-to-Speech)**: Lectura en voz alta con resaltado sincrónico palabra por palabra.
*   **Red Letter Edition**: Las palabras de Jesús resaltadas en rojo con lógica contextual inteligente.

### 2. Concordancia Strong (`features/strong`)
*   **Diccionario Integrado**: Definiciones completas de términos griegos y hebreos.
*   **Pronunciación de Audio**: Miles de archivos de audio (`public/audio/strong`) para escuchar la pronunciación original.
*   **Navegación Profunda**: Click en cualquier palabra para ver su raíz y significado.

### 3. Biblia Interlineal (`features/interlinear`)
*   Visualización paralela del texto original (Hebreo/Griego) y la traducción.
*   Análisis gramatical palabra por palabra.

### 4. Planes de Lectura (`features/plans`)
*   Sistema de seguimiento de planes diarios.
*   Indicadores de progreso visual.

### 5. Tracker de Progreso (`features/tracker`)
*   Visualización gráfica de libros y capítulos leídos.
*   Persistencia local (Local Storage) sin necesidad de cuenta.

### 6. Comentarios (`features/home`)
*   Integración de comentarios exegéticos y devocionales accesibles desde el lector.

## 🛠️ Stack Tecnológico

*   **Framework**: [Astro 5.x](https://astro.build/) (Server-First, Rendimiento).
*   **UI Library**: [Preact](https://preactjs.com/) (Ligero, rápido).
*   **Estilos**: [Tailwind CSS 4](https://tailwindcss.com/) + `@tailwindcss/vite`.
*   **Estado**: [Nanostores](https://github.com/nanostores/nanostores) (Agnóstico, atómico).
*   **Iconos**: `lucide-preact`.
*   **Datos**: JSON estáticos optimizados cargados bajo demanda (Lazy Loading).

## 🚀 Instalación y Desarrollo

### Requisitos
*   `Bun` >= 1.0 (Recomendado) o `Node.js` >= 18.

### Pasos

1.  **Clonar y configurar**:
    ```bash
    git clone https://github.com/tu-usuario/accessible-reading.git
    cd accessible-reading
    bun install
    ```

2.  **Iniciar servidor de desarrollo**:
    ```bash
    bun dev
    ```
    Abre `http://localhost:4321` en tu navegador.

3.  **Construir para producción**:
    ```bash
    bun run build
    bun run preview
    ```

## 🤝 Contribución

Las contribuciones son bienvenidas, especialmente aquellas que mejoren la accesibilidad o añadan recursos teológicos. Por favor, asegúrate de mantener los principios de Clean Architecture y seguir las guías de estilo del proyecto.

## 📄 Licencia

MIT License. Ver archivo `LICENSE` para más detalles.
