import { X, MessageSquare, ExternalLink, Heart, ShieldCheck, Anchor, GraduationCap, User } from "lucide-preact";

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

export default function InfoModal({ isOpen, onClose }: Props) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop con el color de fondo del tema */}
            <div
                className="absolute inset-0 bg-[var(--color-bg)] opacity-80 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-base leading-normal tracking-normal flex flex-col max-h-[90vh] border surface-card"
                onClick={(e) => e.stopPropagation()}
                style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b shrink-0" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 90%)" }}>
                    <h3 className="text-xl font-bold tracking-tight text-[var(--color-link)]">Información</h3>
                    <div
                        onClick={onClose}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                onClose();
                            }
                        }}
                        className="p-2 rounded-md hover:bg-[var(--surface-hover-bg)] transition-colors cursor-pointer"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                    {/* Apoyo */}
                    <section className="bg-[color-mix(in_srgb,var(--color-link),transparent_95%)] p-6 rounded-xl border border-[color-mix(in_srgb,var(--color-link),transparent_80%)]">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-full bg-[var(--color-link)] shrink-0">
                                <Heart className="w-6 h-6" style={{ color: "var(--color-bg)" }} />
                            </div>
                            <div>
                                <p className="text-lg font-medium mb-3">
                                    Si este recurso es de bendición para tu vida y ministerio, puedes apoyarnos aquí:
                                </p>
                                <a
                                    href="https://www.flow.cl/app/web/pagarBtnPago.php?token=bbf8019fcc40b7478107cf1cb3449046a2bf0fe2"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold hover:brightness-110 transition-all shadow-lg"
                                    style={{
                                        backgroundColor: "var(--color-link)",
                                        color: "var(--color-bg)",
                                        textDecoration: 'none'
                                    }}
                                >
                                    Donar <ExternalLink className="w-4 h-4" style={{ color: "var(--color-bg)" }} />
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* Presentación */}
                    <section className="space-y-4">
                        <h4 className="text-lg font-bold border-l-4 border-[var(--color-link)] pl-3">Lectura Accesible</h4>
                        <div className="space-y-3 opacity-90 leading-relaxed">
                            <p>
                                <strong>Lectura Accesible</strong> es una plataforma dedicada al estudio profundo y reverente de las Sagradas Escrituras. Nuestro compromiso es facilitar el acceso a la Palabra de Dios mediante herramientas tecnológicas que promuevan la comprensión del texto bíblico en sus idiomas originales y el crecimiento espiritual fundamentado en la verdad revelada.
                            </p>
                            <p>
                                Este proyecto ofrece una Biblia interlineal completa (Español, Hebreo y Griego) con herramientas de análisis morfológico y códigos Strong, permitiendo a cada estudiante de la Biblia explorar las riquezas del texto sagrado con precisión. Además, integra el <strong>Comentario Bíblico Adventista (CBA)</strong> para enriquecer el estudio con una perspectiva teológica sólida y equilibrada.
                            </p>
                        </div>
                    </section>

                    {/* Creencias Fundamentales */}
                    <section className="space-y-4">
                        <h4 className="text-lg font-bold border-l-4 border-[var(--color-link)] pl-3">Nuestra Fe</h4>
                        <div className="grid gap-4 md:grid-cols-1">
                            <div className="p-5 rounded-xl border surface-card space-y-3">
                                <div className="flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                                    <ShieldCheck className="w-5 h-5 opacity-80" />
                                    <span className="font-bold uppercase tracking-wide text-sm">Sola Scriptura</span>
                                </div>
                                <p className="text-sm opacity-90 leading-relaxed">
                                    Aceptamos la Biblia como nuestra única norma de fe y práctica. Creemos que las Sagradas Escrituras son la Palabra de Dios escrita, inspirada por el Espíritu Santo y la revelación autoritativa de Su voluntad.
                                </p>
                            </div>

                            <div className="p-5 rounded-xl border surface-card space-y-3">
                                <div className="flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                                    <Anchor className="w-5 h-5 opacity-80" />
                                    <span className="font-bold uppercase tracking-wide text-sm">La Esperanza Adventista</span>
                                </div>
                                <p className="text-sm opacity-90 leading-relaxed">
                                    Sostenemos las 28 creencias fundamentales de la Iglesia Adventista del Séptimo Día, destacando la salvación por gracia mediante la fe en Jesucristo, la vigencia de los Diez Mandamientos (incluyendo el sábado como día de reposo) y la bienaventurada esperanza de Su pronto regreso.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Desarrollo y Créditos */}
                    <section className="space-y-4">
                        <h4 className="text-lg font-bold border-l-4 border-[var(--color-link)] pl-3">Desarrollo</h4>
                        <div className="p-5 rounded-xl border surface-card bg-[var(--surface-muted-bg)]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-[color-mix(in_srgb,var(--color-text),transparent_92%)]" style={{ color: "var(--color-text)" }}>
                                    <User className="w-6 h-6 opacity-90" />
                                </div>
                                <div>
                                    <h5 className="font-bold text-[var(--color-text)]">Johan Gutierrez</h5>
                                    <div className="flex items-center gap-2 text-sm opacity-80 mt-1" style={{ color: "var(--color-text)" }}>
                                        <GraduationCap className="w-4 h-4 opacity-70" />
                                        <span>Estudiante de Teología</span>
                                    </div>
                                    <p className="text-xs opacity-70 mt-1">Universidad Adventista de Chile (UnACh)</p>
                                </div>
                            </div>
                            <p className="text-sm mt-4 opacity-90 italic">
                                "Dedicado a la excelencia en el estudio de las Escrituras para el servicio del reino de Dios."
                            </p>
                        </div>
                    </section>

                    {/* Fuentes y Recursos */}
                    <section className="space-y-4">
                        <h4 className="text-lg font-bold border-l-4 border-[var(--color-link)] pl-3">Fuentes Bíblicas</h4>
                        <div className="space-y-4 opacity-90 text-sm">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="p-4 rounded-lg border surface-card">
                                    <h5 className="font-bold mb-1 text-[var(--color-link)]">Biblia Libre</h5>
                                    <p className="text-xs">Versión adaptada para una lectura clara y contemporánea.</p>
                                </div>

                                <div className="p-4 rounded-lg border surface-card">
                                    <h5 className="font-bold mb-1 text-[var(--color-link)]">Nuevo Testamento Griego</h5>
                                    <p className="text-xs">Tischendorf's 8th edition con etiquetas morfológicas v2.7.</p>
                                </div>

                                <div className="p-4 rounded-lg border surface-card">
                                    <h5 className="font-bold mb-1 text-[var(--color-link)]">Antiguo Testamento Hebreo</h5>
                                    <p className="text-xs">ETCBC Data & Biblia Hebraica Stuttgartensia (BHS).</p>
                                </div>

                                <div className="p-4 rounded-lg border surface-card">
                                    <h5 className="font-bold mb-1 text-[var(--color-link)]">Códigos Strong</h5>
                                    <p className="text-xs">Referencia léxica exhaustiva para términos originales.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer with Contact Button */}
                <div className="p-5 border-t shrink-0 flex justify-center bg-[var(--surface-muted-bg)]" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 90%)" }}>
                    <a
                        href="https://api.whatsapp.com/send?phone=56930599095&text=Hola,%20me%20gustaría%20saber%20más%20sobre%20Lectura%20Accesible&absent=0"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
                        style={{
                            backgroundColor: "var(--color-link)",
                            color: "var(--color-bg)", // Consistente con el botón de PayPal y colores primarios
                            textDecoration: 'none'
                        }}
                    >
                        <MessageSquare className="w-5 h-5" style={{ color: "var(--color-bg)" }} />
                        Contactar
                    </a>
                </div>
            </div>
        </div>
    );
}
