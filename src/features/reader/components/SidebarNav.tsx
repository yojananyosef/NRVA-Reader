import { useEffect, useState } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { BookOpen, Menu, ChevronRight, Bookmark, Star, ChevronLeft, Library, X, Languages, BookText, Info, Home, Search } from "lucide-preact";
import InfoModal from "./InfoModal";
import { lastBiblePosition, lastCommentaryPosition, lastInterlinearPosition } from "../../../stores/navigation";

type Book = { code: string; name: string; chapters: number; section: string };

type Props = {
  books?: Book[];
  showTrigger?: boolean;
  mode?: "overlay" | "inline";
};

export default function SidebarNav({ showTrigger = false, mode = "inline" }: Props) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => getInitialCollapsed());
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const $lastBible = useStore(lastBiblePosition);
  const $lastCommentary = useStore(lastCommentaryPosition);
  const $lastInterlinear = useStore(lastInterlinearPosition);

  const [dictionaryExpanded, setDictionaryExpanded] = useState(false);

  // Initialize active item based on current URL
  const [activeItem, setActiveItem] = useState<string>(() => {
    if (typeof window === "undefined") return "home";
    const path = window.location.pathname;
    const search = typeof window !== "undefined" ? window.location.search : "";

    if (path === "/" && !search) return "home";
    if (path.includes("/tracker")) return "tracking";
    if (path.includes("/plans")) return "plans";
    if (path.includes("/commentary")) return "commentary";
    if (path.includes("/interlinear")) return "interlinear";
    if (path.includes("/concordancia")) return "concordancia";
    if (path.includes("/strong")) {
      const params = new URLSearchParams(search);
      const type = params.get("type");
      if (type === "greek") return "dictionary-greek";
      return "dictionary-hebrew";
    }
    return "bible";
  });

  const mainNav = [
    {
      id: "home",
      label: "Inicio",
      icon: Home,
      url: "/"
    },
    {
      id: "bible",
      label: "Biblia",
      icon: BookOpen,
      url: $lastBible.lastBook ? `/?book=${$lastBible.lastBook}&chapter=${$lastBible.lastChapter}` : "/?book=gen&chapter=1"
    },
    {
      id: "commentary",
      label: "Comentario",
      icon: Library,
      url: $lastCommentary.lastBook ? `/commentary?book=${$lastCommentary.lastBook}&chapter=${$lastCommentary.lastChapter}` : "/commentary"
    },
    {
      id: "interlinear",
      label: "Interlineal",
      icon: Languages,
      url: $lastInterlinear.lastBook ? `/interlinear?book=${$lastInterlinear.lastBook}&chapter=${$lastInterlinear.lastChapter}&verse=${$lastInterlinear.lastVerse || '1'}` : "/interlinear"
    },
    {
      id: "dictionary",
      label: "Diccionario",
      icon: BookText,
      url: "#",
      hasSubmenu: true,
      subItems: [
        { id: "dictionary-hebrew", label: "Hebreo", url: "/strong?type=hebrew" },
        { id: "dictionary-greek", label: "Griego", url: "/strong?type=greek" },
      ]
    },
    { id: "tracking", label: "Seguimiento", icon: Bookmark, url: "/tracker" },
    { id: "plans", label: "Planes", icon: Star, url: "/plans" },
    { id: "concordancia", label: "Concordancia", icon: Search, url: "/concordancia" },
  ];

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-sidebar-collapsed", collapsed ? "true" : "false");
    } catch { }
    const openHandler = () => setOpen(true);
    const closeHandler = () => setOpen(false);
    const toggleHandler = () => {
      if (window.innerWidth < 768) {
        setOpen(prev => !prev);
      } else {
        setCollapsed(prev => !prev);
      }
    };

    window.addEventListener("open-sidebar", openHandler as EventListener);
    window.addEventListener("close-sidebar", closeHandler as EventListener);
    window.addEventListener("toggle-sidebar", toggleHandler as EventListener);

    return () => {
      window.removeEventListener("open-sidebar", openHandler as EventListener);
      window.removeEventListener("close-sidebar", closeHandler as EventListener);
      window.removeEventListener("toggle-sidebar", toggleHandler as EventListener);
    };
  }, []);

  useEffect(() => {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("reader-sidebar-collapsed", collapsed ? "true" : "false");
      }
      // Actualizar el atributo en el documentElement para que el CSS del Layout responda
      document.documentElement.setAttribute("data-sidebar-collapsed", collapsed ? "true" : "false");
    } catch { }
  }, [collapsed]);

  // Hide arrows when mobile sidebar is open
  useEffect(() => {
    const arrows = document.querySelectorAll('.nav-arrow, .nav-arrow-fixed');
    if (open) {
      arrows.forEach(el => {
        (el as HTMLElement).style.setProperty('display', 'none', 'important');
      });
    } else {
      arrows.forEach(el => {
        (el as HTMLElement).style.removeProperty('display');
      });
    }
  }, [open]);

  // ELIMINADO: Ya no necesitamos useLayoutEffect para calcular offsets manuales con JS
  // ya que lo maneja el CSS Grid en ReaderLayout.astro

  const goTo = (url: string) => {
    if (url === "#") return;
    setOpen(false); // Cerrar el overlay si está abierto

    // Si es una navegación interna (misma base), usar pushState para persistencia
    const isInternal = url.startsWith('/') && !url.includes('?');
    if (isInternal) {
      // Para rutas como /tracker, /plans etc
      window.location.href = url;
    } else {
      window.location.href = url;
    }
  };

  return (
    <>
      {showTrigger && mode === "overlay" && (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setOpen(true);
            }
          }}
          className="p-2 rounded-md hover:bg-[var(--surface-hover-bg)] text-[var(--color-link)] transition-colors flex items-center gap-2 cursor-pointer"
          aria-label="Abrir menú lateral"
          onClick={() => setOpen(true)}
        >
          <Menu className="w-6 h-6" />
          <span className="hidden md:inline text-sm font-semibold">Menú</span>
        </div>
      )}

      {mode === "inline" && (
        <div
          className={`hidden md:flex shrink-0 h-full transition-all duration-300 ease-in-out ui-protect ${collapsed ? 'w-0' : 'w-64'}`}
          style={{ backgroundColor: "transparent", overflow: "hidden" }}
        >
          <aside
            className={`flex flex-col w-64 h-full border-r shadow-none transition-transform duration-300 ease-in-out will-change-transform ${collapsed ? "-translate-x-full" : "translate-x-0"}`}
            style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)", borderRight: "1px solid color-mix(in srgb, var(--color-text), transparent 85%)" }}
            data-role="reader-inline-sidebar"
            aria-hidden={collapsed}
          >
            <div className="p-1 border-b flex justify-end" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 85%)" }}>
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setCollapsed(true);
                  }
                }}
                className={`p-1.5 rounded-md border surface-card cursor-pointer transition-opacity duration-200 ${collapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                aria-label="Colapsar sidebar"
                onClick={() => setCollapsed(true)}
              >
                <ChevronLeft className="w-4 h-4" />
              </div>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
              {mainNav.map((item) => {
                const isActive = activeItem === item.id || (item.subItems?.some(sub => sub.id === activeItem));

                return (
                  <div key={item.id} className="space-y-1">
                    <div
                      onClick={() => {
                        if (item.hasSubmenu) {
                          setDictionaryExpanded(!dictionaryExpanded);
                        } else {
                          setActiveItem(item.id);
                          goTo(item.url);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          if (item.hasSubmenu) {
                            setDictionaryExpanded(!dictionaryExpanded);
                          } else {
                            setActiveItem(item.id);
                            goTo(item.url);
                          }
                        }
                      }}
                      className={`
                        w-full text-left p-3 rounded-lg flex items-center justify-between transition-all duration-200 cursor-pointer
                        ${isActive
                          ? "font-bold shadow-sm border border-[var(--color-link)]"
                          : "hover:bg-[var(--surface-hover-bg)] opacity-80 hover:opacity-100"
                        }
                      `}
                      style={isActive ? {
                        backgroundColor: "color-mix(in srgb, var(--color-link), transparent 90%)",
                        color: "var(--color-link)"
                      } : {}}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-5 h-5 ${isActive ? "" : "opacity-70"}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.hasSubmenu && (
                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${dictionaryExpanded ? "rotate-90" : ""}`} />
                      )}
                    </div>

                    {item.hasSubmenu && dictionaryExpanded && (
                      <div className="ml-9 space-y-1 border-l border-[var(--color-text)] border-opacity-10 pl-2">
                        {item.subItems?.map((sub) => {
                          const isSubActive = activeItem === sub.id;
                          return (
                            <div
                              key={sub.id}
                              onClick={() => {
                                setActiveItem(sub.id);
                                goTo(sub.url);
                              }}
                              className={`p-2 rounded-md text-sm cursor-pointer transition-colors ${isSubActive ? "text-[var(--color-link)] font-bold bg-[color-mix(in_srgb,var(--color-link),transparent_95%)]" : "opacity-70 hover:opacity-100 hover:bg-[var(--surface-hover-bg)]"}`}
                            >
                              {sub.label}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
            <div className="p-4 border-t" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 85%)" }}>
              <button
                onClick={() => setIsInfoModalOpen(true)}
                className="w-full text-left p-3 rounded-lg border surface-card flex items-center gap-3 cursor-pointer hover:bg-[var(--surface-hover-bg)] transition-all text-[var(--color-link)]"
                style={{ background: 'none', font: 'inherit' }}
              >
                <Info className="w-4 h-4" />
                <span className="text-sm">Información</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {mode === "inline" && (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setCollapsed(false);
            }
          }}
          className={`hidden md:flex fixed left-2 p-2 rounded-md border surface-card z-40 cursor-pointer transition-all duration-300 ${collapsed
            ? "opacity-100 translate-x-0 pointer-events-auto delay-500"
            : "opacity-0 -translate-x-4 pointer-events-none delay-0"
            }`}
          aria-label="Expandir sidebar"
          onClick={() => setCollapsed(false)}
          style={{ top: "calc(4rem + 8px)" }}
          data-role="reader-inline-toggle"
        >
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
      <div className={`fixed inset-0 z-[60] transition-opacity duration-300 md:hidden ui-protect ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} style={{ top: "var(--nav-height, 4rem)" }} />
        <aside
          className={`absolute left-0 bottom-0 w-full max-w-[280px] shadow-2xl transform transition-transform duration-300 flex flex-col ${open ? "translate-x-0" : "-translate-x-full"}`}
          style={{
            backgroundColor: "var(--color-bg)",
            color: "var(--color-text)",
            top: "var(--nav-height, 4rem)"
          }}
        >
          <div className="relative h-16 flex items-center justify-center border-b px-4" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 85%)" }}>
            <h2 className="text-lg font-bold m-0 leading-none">Menú</h2>
            <div
              onClick={() => setOpen(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-[var(--surface-hover-bg)] text-[var(--color-link)] transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Cerrar menú"
            >
              <X className="w-6 h-6" />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {mainNav.map((item) => {
              const isActive = activeItem === item.id || (item.subItems?.some(sub => sub.id === activeItem));
              return (
                <div key={item.id} className="space-y-1">
                  <div
                    onClick={() => {
                      if (item.hasSubmenu) {
                        setDictionaryExpanded(!dictionaryExpanded);
                      } else {
                        setActiveItem(item.id);
                        goTo(item.url);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        if (item.hasSubmenu) {
                          setDictionaryExpanded(!dictionaryExpanded);
                        } else {
                          setActiveItem(item.id);
                          goTo(item.url);
                        }
                      }
                    }}
                    className={`
                      w-full text-left p-3 rounded-lg flex items-center justify-between transition-all duration-200 cursor-pointer
                      ${isActive
                        ? "font-bold shadow-sm border border-[var(--color-link)]"
                        : "hover:bg-[var(--surface-hover-bg)] opacity-80 hover:opacity-100"
                      }
                    `}
                    style={isActive ? {
                      backgroundColor: "color-mix(in srgb, var(--color-link), transparent 90%)",
                      color: "var(--color-link)"
                    } : {}}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${isActive ? "" : "opacity-70"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.hasSubmenu && (
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${dictionaryExpanded ? "rotate-90" : ""}`} />
                    )}
                  </div>

                  {item.hasSubmenu && dictionaryExpanded && (
                    <div className="ml-9 space-y-1 border-l border-[var(--color-text)] border-opacity-10 pl-2">
                      {item.subItems?.map((sub) => {
                        const isSubActive = activeItem === sub.id;
                        return (
                          <div
                            key={sub.id}
                            onClick={() => {
                              setActiveItem(sub.id);
                              goTo(sub.url);
                            }}
                            className={`p-3 rounded-lg text-sm cursor-pointer transition-colors ${isSubActive ? "text-[var(--color-link)] font-bold bg-[color-mix(in_srgb,var(--color-link),transparent_95%)]" : "opacity-70 hover:opacity-100 hover:bg-[var(--surface-hover-bg)]"}`}
                          >
                            {sub.label}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          <div className="p-4 border-t" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 85%)" }}>
            <button
              onClick={() => {
                setOpen(false);
                setIsInfoModalOpen(true);
              }}
              className="w-full text-left p-3 rounded-lg border surface-card flex items-center gap-3 cursor-pointer hover:bg-[var(--surface-hover-bg)] transition-all text-[var(--color-link)]"
              style={{ background: 'none', font: 'inherit' }}
            >
              <Info className="w-4 h-4" />
              <span className="text-sm">Información y Contacto</span>
            </button>
          </div>
        </aside>
      </div>
      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
    </>
  );
}

export const getInitialCollapsed = (): boolean => {
  try {
    if (typeof localStorage === "undefined") return false;
    const saved = localStorage.getItem("reader-sidebar-collapsed");
    if (saved === "true") return true;
    if (saved === "false") return false;
    return false;
  } catch {
    return false;
  }
};

export const computeSidebarOffset = (
  mode: "overlay" | "inline",
  width: number
): string => {
  const isDesktop = width >= 768;
  return mode === "inline" && isDesktop ? "18rem" : "0.5rem";
};
