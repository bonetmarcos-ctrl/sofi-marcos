import { useCallback, useState } from "react";
import { C } from "./constants/colores.js";
import { useBreakpoint } from "./hooks/useBreakpoint.js";
import { useAppState } from "./hooks/useAppState.js";
import { todayISO } from "./utils/dates.js";
import TabPresupuesto from "./features/presupuesto/TabPresupuesto.jsx";
import TabCalendario  from "./features/calendario/TabCalendario.jsx";
import TabGantt       from "./features/casa/TabGantt.jsx";
import ModalEvento    from "./features/calendario/modals/ModalEvento.jsx";
import ModalViaje     from "./features/viajes/ModalViaje.jsx";

const TABS = [
  { id:"presupuesto", label:"Presupuesto", emoji:"💶" },
  { id:"calendario",  label:"Calendario",  emoji:"🗓️" },
  { id:"casa",        label:"Casa",        emoji:"🔨" },
];

export default function App() {
  const [tab,         setTab]         = useState("presupuesto");
  const [modal,       setModal]       = useState(null);
  const { state, setCollection, loaded, status } = useAppState();
  const { isMobile, isTablet } = useBreakpoint();

  const { eventos, viajes, bloqueos, proyectos, palancas, deudas, suministros } = state;
  const setEventos     = useCallback(updater => setCollection("eventos", updater), [setCollection]);
  const setViajes      = useCallback(updater => setCollection("viajes", updater), [setCollection]);
  const setBloqueos    = useCallback(updater => setCollection("bloqueos", updater), [setCollection]);
  const setProyectos   = useCallback(updater => setCollection("proyectos", updater), [setCollection]);
  const setPalancas    = useCallback(updater => setCollection("palancas", updater), [setCollection]);
  const setDeudas      = useCallback(updater => setCollection("deudas", updater), [setCollection]);
  const setSuministros = useCallback(updater => setCollection("suministros", updater), [setCollection]);

  // ── Handlers de eventos y viajes ──
  const guardarEvento  = useCallback((form) => { setEventos(prev => form.id && prev.find(e=>e.id===form.id) ? prev.map(e=>e.id===form.id?form:e) : [...prev,form]); setModal(null); }, [setEventos]);
  const eliminarEvento = useCallback((id)   => { setEventos(prev => prev.filter(e=>e.id!==id)); setModal(null); }, [setEventos]);
  const guardarViaje   = useCallback((form) => { setViajes(prev => form.id && prev.find(v=>v.id===form.id) ? prev.map(v=>v.id===form.id?form:v) : [...prev,form]); setModal(null); }, [setViajes]);
  const eliminarViaje  = useCallback((id)   => { setViajes(prev => prev.filter(v=>v.id!==id)); setModal(null); }, [setViajes]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Lato:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        html { min-width: 320px; }
        body { background:${C.fondo}; font-family:'Lato',sans-serif; color:${C.txt}; overflow-x:hidden; }
        button, input, select { min-height: 32px; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:${C.borde}; border-radius:4px; }
      `}</style>

      {/* ── NAVBAR ── */}
      <div style={{ background:"#111418", position:"sticky", top:0, zIndex:200, boxShadow:"0 1px 0 rgba(255,255,255,0.06),0 4px 16px rgba(0,0,0,0.25)" }}>
        <div style={{ maxWidth:1180, margin:"0 auto", padding:isMobile?"10px 14px":"0 24px", display:"flex", alignItems:isMobile?"stretch":"center", justifyContent:"space-between", minHeight:58, gap:isMobile?10:14, flexDirection:isMobile?"column":"row" }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg,${C.cyan},${C.lavender})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🏡</div>
            <span style={{ fontSize:16, fontWeight:700, color:"white", letterSpacing:"-0.3px" }}>Sofi & Marqui</span>
          </div>

          {/* Tabs */}
          <nav style={{ display:"flex", gap:2, background:"rgba(255,255,255,0.06)", borderRadius:12, padding:4, overflowX:"auto", scrollbarWidth:"none", width:isMobile?"100%":"auto" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: tab===t.id ? "white" : "transparent",
                color: tab===t.id ? C.txt : "rgba(255,255,255,0.5)",
                border: "none", borderRadius:9, padding:isMobile?"8px 12px":"7px 18px",
                fontSize:13, fontWeight:700, cursor:"pointer",
                fontFamily:"'Lato',sans-serif", transition:"all 0.15s",
                display:"flex", alignItems:"center", gap:6, flex:isMobile?1:"initial", justifyContent:"center", whiteSpace:"nowrap",
              }}>
                {t.emoji} {t.label}
              </button>
            ))}
          </nav>

          {/* Acciones rápidas */}
          <div style={{ display:"flex", gap:6, alignItems:"center", justifyContent:isMobile?"space-between":"flex-start", width:isMobile?"100%":"auto" }}>
            <div title={status === "api" ? "Sincronizado con API" : loaded ? "Modo local" : "Cargando"}
              style={{ width:9, height:9, borderRadius:"50%", background:status === "api" ? C.exito : status === "local" ? C.warn : "rgba(255,255,255,0.3)", boxShadow:status === "api" ? `0 0 8px ${C.exito}` : "none" }}/>
            <button onClick={() => setModal({ type:"evento", fecha:todayISO })}
              style={{ background:C.cyan, color:"white", border:"none", borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif", letterSpacing:"0.2px" }}>
              + Evento
            </button>
            <button onClick={() => setModal({ type:"viaje" })}
              style={{ background:"transparent", color:"white", border:"1px solid rgba(255,255,255,0.25)", borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              ✈️ Viaje
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div style={{ maxWidth:1180, margin:"0 auto", padding:isMobile?"14px 12px 32px":isTablet?"18px 16px 40px":"24px 24px 48px", minWidth:0 }}>
        {tab === "presupuesto" && (
          <TabPresupuesto eventos={eventos} viajes={viajes} palancas={palancas} setPalancas={setPalancas} deudas={deudas} setDeudas={setDeudas} suministros={suministros} setSuministros={setSuministros}/>
        )}
        {tab === "calendario" && (
          <TabCalendario eventos={eventos} viajes={viajes} bloqueos={bloqueos} setBloqueos={setBloqueos} setModal={setModal}/>
        )}
        {tab === "casa" && (
          <TabGantt proyectos={proyectos} setProyectos={setProyectos}/>
        )}
      </div>

      {/* ── MODALES GLOBALES ── */}
      {modal?.type === "evento" && (
        <ModalEvento fechaInicial={modal.fecha} evento={modal.item} onSave={guardarEvento} onDelete={eliminarEvento} onClose={() => setModal(null)}/>
      )}
      {modal?.type === "viaje" && (
        <ModalViaje viaje={modal.item} onSave={guardarViaje} onDelete={eliminarViaje} onClose={() => setModal(null)}/>
      )}
    </>
  );
}
