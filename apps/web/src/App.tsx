import { useCallback, useState } from "react";
import { C } from "./constants/colores.ts";
import { Login } from "./components/Login.tsx";
import { useAuth } from "./hooks/useAuth.ts";
import { useBreakpoint } from "./hooks/useBreakpoint.ts";
import { useAppState } from "./hooks/useAppState.ts";
import { todayISO } from "./utils/dates.ts";
import { buildCreditCardDebtFromExpense } from "@sofi-marqui/domain";
import TabPresupuesto from "./features/presupuesto/TabPresupuesto.tsx";
import TabCalendario  from "./features/calendario/TabCalendario.tsx";
import TabGantt       from "./features/casa/TabGantt.tsx";
import ModalEvento    from "./features/calendario/modals/ModalEvento.tsx";
import ModalViaje     from "./features/viajes/ModalViaje.tsx";
import { LanguageMenu } from "./components/LanguageMenu.tsx";
import { useI18n } from "./i18n.tsx";

const TABS = [
  { id:"presupuesto", labelKey:"Budget", emoji:"💶" },
  { id:"calendario",  labelKey:"Calendar", emoji:"🗓️" },
  { id:"casa",        labelKey:"Home", emoji:"🔨" },
];

export default function App() {
  const { user, loading, error, login, register, logout, setLoginError } = useAuth();

  if (loading) {
    return <Login loading={loading} error="" onLogin={login} onRegister={register} onError={setLoginError} />;
  }

  if (!user) {
    return <Login loading={loading} error={error} onLogin={login} onRegister={register} onError={setLoginError} />;
  }

  return <AuthenticatedApp user={user} onLogout={logout} />;
}

function AuthenticatedApp({ user, onLogout }) {
  const { t } = useI18n();
  const [tab,         setTab]         = useState("presupuesto");
  const [modal,       setModal]       = useState(null);
  const { state, setCollection, loaded, status } = useAppState(user.username);
  const { isMobile, isTablet } = useBreakpoint();

  const { eventos, viajes, bloqueos, proyectos, palancas, deudas, suministros, gastosVariables, comprasSuper, cumpleanos } = state;
  const setEventos     = useCallback(updater => setCollection("eventos", updater), [setCollection]);
  const setViajes      = useCallback(updater => setCollection("viajes", updater), [setCollection]);
  const setBloqueos    = useCallback(updater => setCollection("bloqueos", updater), [setCollection]);
  const setProyectos   = useCallback(updater => setCollection("proyectos", updater), [setCollection]);
  const setPalancas    = useCallback(updater => setCollection("palancas", updater), [setCollection]);
  const setDeudas      = useCallback(updater => setCollection("deudas", updater), [setCollection]);
  const setSuministros = useCallback(updater => setCollection("suministros", updater), [setCollection]);
  const setGastosVariables = useCallback(updater => setCollection("gastosVariables", updater), [setCollection]);
  const setComprasSuper = useCallback(updater => setCollection("comprasSuper", updater), [setCollection]);
  const setCumpleanos = useCallback(updater => setCollection("cumpleanos", updater), [setCollection]);

  const syncLinkedCardDebt = useCallback((collection, item) => {
    const debt = buildCreditCardDebtFromExpense(item, collection);
    const linkedDebtId = item.deudaTarjetaId || debt?.id;

    setDeudas(prev => {
      const withoutLinked = prev.filter(deuda => {
        if (linkedDebtId && String(deuda.id) === String(linkedDebtId)) return false;
        return !(deuda.origenColeccion === collection && String(deuda.origenId) === String(item.id));
      });

      return debt ? [...withoutLinked, debt] : withoutLinked;
    });

    return debt ? { ...item, deudaTarjetaId:debt.id } : { ...item, deudaTarjetaId:"" };
  }, [setDeudas]);

  const removeLinkedCardDebt = useCallback((collection, id) => {
    setDeudas(prev => prev.filter(deuda => !(deuda.origenColeccion === collection && String(deuda.origenId) === String(id))));
  }, [setDeudas]);

  const saveEvent = useCallback((form) => {
    const item = syncLinkedCardDebt("eventos", form);
    setEventos(prev => item.id && prev.find(e=>e.id===item.id) ? prev.map(e=>e.id===item.id?item:e) : [...prev,item]);
    setModal(null);
  }, [setEventos, syncLinkedCardDebt]);
  const deleteEvent = useCallback((id)   => { setEventos(prev => prev.filter(e=>e.id!==id)); removeLinkedCardDebt("eventos", id); setModal(null); }, [setEventos, removeLinkedCardDebt]);
  const saveTrip = useCallback((form) => { setViajes(prev => form.id && prev.find(v=>v.id===form.id) ? prev.map(v=>v.id===form.id?form:v) : [...prev,form]); setModal(null); }, [setViajes]);
  const deleteTrip = useCallback((id)   => { setViajes(prev => prev.filter(v=>v.id!==id)); setModal(null); }, [setViajes]);
  const saveSuperPurchase = useCallback((form) => {
    const lineas = (form.lineas || [])
      .filter(linea => String(linea.producto || "").trim() || Number(linea.importe || 0) > 0)
      .map(linea => ({ ...linea, producto:String(linea.producto || "").trim() || "Producto", cantidad:Number(linea.cantidad || 1), importe:Number(linea.importe || 0) }));
    const purchaseId = form.id || Date.now();
    const eventId = form.eventoId || `super-${purchaseId}`;
    const importe = Number(form.importe || lineas.reduce((sum, linea) => sum + Number(linea.importe || 0), 0));
    const currentEvent = eventos.find(evento => String(evento.id) === String(eventId));
    const eventItem = syncLinkedCardDebt("eventos", {
      id:eventId,
      fecha:form.fecha || todayISO,
      titulo:form.comercio ? `Supermercado · ${form.comercio}` : "Supermercado",
      hora:"",
      categoria:"otro",
      importe,
      notas:form.notas || "",
      origenFondos:form.origenFondos || "ingresos_mes",
      cuotasTarjeta:Number(form.cuotasTarjeta || 1),
      mesPrimerCargo:form.mesPrimerCargo || "",
      tarjetaNombre:form.tarjetaNombre || "",
      tarjetaDiaCierre:form.tarjetaDiaCierre ? Number(form.tarjetaDiaCierre) : undefined,
      deudaTarjetaId:currentEvent?.deudaTarjetaId || form.deudaTarjetaId || "",
    });

    setEventos(prev => prev.find(evento => String(evento.id) === String(eventItem.id)) ? prev.map(evento => String(evento.id) === String(eventItem.id) ? eventItem : evento) : [...prev, eventItem]);
    setComprasSuper(prev => {
      const item = { ...form, id:purchaseId, eventoId:eventItem.id, fecha:form.fecha || todayISO, importe, lineas };
      return prev.find(compra => String(compra.id) === String(purchaseId)) ? prev.map(compra => String(compra.id) === String(purchaseId) ? item : compra) : [...prev, item];
    });
  }, [eventos, setComprasSuper, setEventos, syncLinkedCardDebt]);
  const deleteSuperPurchase = useCallback((id) => {
    const compra = comprasSuper.find(item => String(item.id) === String(id));
    setComprasSuper(prev => prev.filter(item => String(item.id) !== String(id)));
    if (compra?.eventoId) {
      setEventos(prev => prev.filter(evento => String(evento.id) !== String(compra.eventoId)));
      removeLinkedCardDebt("eventos", compra.eventoId);
    }
  }, [comprasSuper, removeLinkedCardDebt, setComprasSuper, setEventos]);

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

      {/* Navbar */}
      <div style={{ background:"#111418", position:"sticky", top:0, zIndex:200, boxShadow:"0 1px 0 rgba(255,255,255,0.06),0 4px 16px rgba(0,0,0,0.25)" }}>
        <div style={{ maxWidth:1180, margin:"0 auto", padding:isMobile?"10px 14px":"0 24px", display:"flex", alignItems:isMobile?"stretch":"center", justifyContent:"space-between", minHeight:58, gap:isMobile?10:14, flexDirection:isMobile?"column":"row" }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg,${C.cyan},${C.lavender})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🏡</div>
            <span style={{ fontSize:16, fontWeight:700, color:"white", letterSpacing:"-0.3px" }}>Sofi & Marqui</span>
          </div>

          {/* Tabs */}
          <nav style={{ display:"flex", gap:2, background:"rgba(255,255,255,0.06)", borderRadius:12, padding:4, overflowX:"auto", scrollbarWidth:"none", width:isMobile?"100%":"auto" }}>
            {TABS.map(tabItem => (
              <button key={tabItem.id} onClick={() => setTab(tabItem.id)} style={{
                background: tab===tabItem.id ? "white" : "transparent",
                color: tab===tabItem.id ? C.txt : "rgba(255,255,255,0.5)",
                border: "none", borderRadius:9, padding:isMobile?"8px 12px":"7px 18px",
                fontSize:13, fontWeight:700, cursor:"pointer",
                fontFamily:"'Lato',sans-serif", transition:"all 0.15s",
                display:"flex", alignItems:"center", gap:6, flex:isMobile?1:"initial", justifyContent:"center", whiteSpace:"nowrap",
              }}>
                {tabItem.emoji} {t(tabItem.labelKey)}
              </button>
            ))}
          </nav>

          {/* Quick actions */}
          <div style={{ display:"flex", gap:6, alignItems:"center", justifyContent:isMobile?"space-between":"flex-start", width:isMobile?"100%":"auto" }}>
            <div title={status === "api" ? t("Synced with API") : loaded ? t("Local mode") : t("Loading")}
              style={{ width:9, height:9, borderRadius:"50%", background:status === "api" ? C.exito : status === "local" ? C.warn : "rgba(255,255,255,0.3)", boxShadow:status === "api" ? `0 0 8px ${C.exito}` : "none" }}/>
            <span title={user.username} style={{ color:"rgba(255,255,255,0.72)", fontSize:12, fontWeight:700, maxWidth:isMobile?80:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.username}</span>
            <LanguageMenu compact={isMobile} />
            <button onClick={() => setModal({ type:"evento", fecha:todayISO })}
              style={{ background:C.cyan, color:"white", border:"none", borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif", letterSpacing:"0.2px" }}>
              {t("Add event")}
            </button>
            <button onClick={() => setModal({ type:"viaje" })}
              style={{ background:"transparent", color:"white", border:"1px solid rgba(255,255,255,0.25)", borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              ✈️ {t("Add trip")}
            </button>
            <button onClick={onLogout}
              style={{ background:"transparent", color:"rgba(255,255,255,0.82)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:10, padding:"8px 12px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              {t("Logout")}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:1180, margin:"0 auto", padding:isMobile?"14px 12px 32px":isTablet?"18px 16px 40px":"24px 24px 48px", minWidth:0 }}>
        {tab === "presupuesto" && (
          <TabPresupuesto eventos={eventos} bloqueos={bloqueos} viajes={viajes} proyectos={proyectos} palancas={palancas} setPalancas={setPalancas} deudas={deudas} setDeudas={setDeudas} suministros={suministros} setSuministros={setSuministros} gastosVariables={gastosVariables} setGastosVariables={setGastosVariables}/>
        )}
        {tab === "calendario" && (
          <TabCalendario eventos={eventos} viajes={viajes} bloqueos={bloqueos} setBloqueos={setBloqueos} setModal={setModal} comprasSuper={comprasSuper} onSaveSuperPurchase={saveSuperPurchase} onDeleteSuperPurchase={deleteSuperPurchase} cumpleanos={cumpleanos} setCumpleanos={setCumpleanos}/>
        )}
        {tab === "casa" && (
          <TabGantt proyectos={proyectos} setProyectos={setProyectos}/>
        )}
      </div>

      {/* Global modals */}
      {modal?.type === "evento" && (
        <ModalEvento fechaInicial={modal.fecha} evento={modal.item} defaults={modal.defaults} onSave={saveEvent} onDelete={deleteEvent} onClose={() => setModal(null)}/>
      )}
      {modal?.type === "viaje" && (
        <ModalViaje viaje={modal.item} onSave={saveTrip} onDelete={deleteTrip} onClose={() => setModal(null)}/>
      )}
    </>
  );
}
