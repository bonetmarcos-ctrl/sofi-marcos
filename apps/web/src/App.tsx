import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "./constants/colores.ts";
import { Login } from "./components/Login.tsx";
import { useAuth } from "./hooks/useAuth.ts";
import { useBreakpoint } from "./hooks/useBreakpoint.ts";
import { useAppState } from "./hooks/useAppState.ts";
import { todayISO } from "./utils/dates.ts";
import { DEFAULT_APP_NAME, buildCreditCardDebtFromExpense, calculateLeverBudgetAmount, calculateLeverCalendarFit, tripExpenseItems } from "@sofi-marqui/domain";
import TabPresupuesto from "./features/presupuesto/TabPresupuesto.tsx";
import TabCalendario  from "./features/calendario/TabCalendario.tsx";
import TabGantt       from "./features/casa/TabGantt.tsx";
import ModalEvento    from "./features/calendario/modals/ModalEvento.tsx";
import ModalViaje     from "./features/viajes/ModalViaje.tsx";
import { LanguageMenu } from "./components/LanguageMenu.tsx";
import { useDatosMes } from "./hooks/useDatosMes.ts";
import { useI18n } from "./i18n.tsx";
import { BG_VIAJE, COLOR_VIAJE } from "./constants/categorias.ts";

const TABS = [
  { id:"hoy", labelKey:"Today" },
  { id:"proyectos", labelKey:"Iter pillar projects" },
  { id:"tiempo", labelKey:"Iter pillar time" },
  { id:"recursos", labelKey:"Iter pillar resources" },
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
  const [tab,         setTab]         = useState("hoy");
  const [modal,       setModal]       = useState(null);
  const { state, setCollection, setBase, loaded, status } = useAppState(user.username);
  const { isMobile, isTablet } = useBreakpoint();
  const appName = user.appName || DEFAULT_APP_NAME;

  useEffect(() => {
    document.title = appName;
  }, [appName]);

  const { base, eventos, viajes, bloqueos, proyectos, palancas, deudas, suministros, gastosVariables, cumpleanos, compromisosAnuales } = state;
  const setEventos     = useCallback(updater => setCollection("eventos", updater), [setCollection]);
  const setViajes      = useCallback(updater => setCollection("viajes", updater), [setCollection]);
  const setBloqueos    = useCallback(updater => setCollection("bloqueos", updater), [setCollection]);
  const setProyectos   = useCallback(updater => setCollection("proyectos", updater), [setCollection]);
  const setPalancas    = useCallback(updater => setCollection("palancas", updater), [setCollection]);
  const setDeudas      = useCallback(updater => setCollection("deudas", updater), [setCollection]);
  const setSuministros = useCallback(updater => setCollection("suministros", updater), [setCollection]);
  const setGastosVariables = useCallback(updater => setCollection("gastosVariables", updater), [setCollection]);
  const setCompromisosAnuales = useCallback(updater => setCollection("compromisosAnuales", updater), [setCollection]);

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
  const saveTrip = useCallback((form) => {
    const trip = { ...form, id:form.id || Date.now() };
    const expenses = tripExpenseItems(trip);
    const debts = [];
    const gastosPago = { ...(trip.gastosPago || {}) };

    expenses.forEach(expense => {
      const debt = buildCreditCardDebtFromExpense(expense, "viajes");
      gastosPago[expense.conceptKey] = { ...(gastosPago[expense.conceptKey] || {}), deudaTarjetaId:debt?.id || "" };
      if (debt) debts.push(debt);
    });

    const item = { ...trip, gastosPago };
    setDeudas(prev => [
      ...prev.filter(deuda => !(deuda.origenColeccion === "viajes" && String(deuda.origenId).startsWith(`${item.id}:`))),
      ...debts,
    ]);
    setViajes(prev => item.id && prev.find(v=>v.id===item.id) ? prev.map(v=>v.id===item.id?item:v) : [...prev,item]);
    setModal(null);
  }, [setDeudas, setViajes]);
  const deleteTrip = useCallback((id)   => {
    setViajes(prev => prev.filter(v=>v.id!==id));
    setDeudas(prev => prev.filter(deuda => !(deuda.origenColeccion === "viajes" && String(deuda.origenId).startsWith(`${id}:`))));
    setModal(null);
  }, [setDeudas, setViajes]);
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
      <div style={{ background:"rgba(251,250,247,0.86)", position:"sticky", top:0, zIndex:200, borderBottom:`1px solid ${C.borde}`, backdropFilter:"blur(18px)", boxShadow:"0 1px 10px rgba(45,41,50,0.035)" }}>
        <div style={{ maxWidth:1180, margin:"0 auto", padding:isMobile?"12px 14px":"0 24px", display:"flex", alignItems:isMobile?"stretch":"center", justifyContent:"space-between", minHeight:62, gap:isMobile?12:16, flexDirection:isMobile?"column":"row" }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:C.brandPrimaryFixed, color:C.brandPrimary, border:`1px solid ${C.brandPrimaryDim}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900 }}>I</div>
            <div style={{ minWidth:0 }}>
              <span style={{ display:"block", fontSize:15, fontWeight:850, color:C.txt, letterSpacing:0, maxWidth:isMobile?"100%":220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{appName}</span>
              <span style={{ display:"block", marginTop:1, fontSize:10.5, fontWeight:700, color:C.txt2, whiteSpace:"nowrap" }}>navigate your becoming</span>
            </div>
          </div>

          {/* Tabs */}
          <nav aria-label="Navegacion principal" style={{ display:"flex", gap:4, background:C.superficie, border:`1px solid ${C.borde}`, borderRadius:12, padding:4, overflowX:"auto", scrollbarWidth:"none", width:isMobile?"100%":"auto", boxShadow:"0 1px 6px rgba(45,41,50,0.035)" }}>
            {TABS.map(tabItem => (
              <button key={tabItem.id} onClick={() => setTab(tabItem.id)} style={{
                background: tab===tabItem.id ? C.brandPrimaryFixed : "transparent",
                color: tab===tabItem.id ? C.brandPrimary : C.txt2,
                border: tab===tabItem.id ? `1px solid ${C.brandPrimaryDim}` : "1px solid transparent", borderRadius:9, padding:isMobile?"8px 10px":"7px 14px",
                fontSize:13, fontWeight:700, cursor:"pointer",
                fontFamily:"'Lato',sans-serif", transition:"all 0.15s",
                display:"flex", alignItems:"center", gap:6, flex:isMobile?1:"initial", justifyContent:"center", whiteSpace:"nowrap",
              }}>
                {t(tabItem.labelKey)}
              </button>
            ))}
          </nav>

          {/* Quick actions */}
          <div style={{ display:"flex", gap:6, alignItems:"center", justifyContent:isMobile?"space-between":"flex-start", width:isMobile?"100%":"auto", flexWrap:"wrap" }}>
            <div title={status === "api" ? t("Synced with API") : loaded ? t("Local mode") : t("Loading")}
              style={{ width:9, height:9, borderRadius:"50%", background:status === "api" ? C.brandSecondary : status === "local" ? C.warn : C.borde, boxShadow:status === "api" ? `0 0 8px ${C.brandSecondaryClear}` : "none" }}/>
            <span title={user.username} style={{ color:C.txt2, fontSize:12, fontWeight:700, maxWidth:isMobile?80:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.username}</span>
            <LanguageMenu compact={isMobile} />
            <button onClick={() => setModal({ type:"evento", fecha:todayISO })}
              style={{ background:C.brandSecondary, color:"white", border:"none", borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif", letterSpacing:"0.2px" }}>
              {t("Add event")}
            </button>
            <button onClick={onLogout}
              style={{ background:"transparent", color:C.txt2, border:`1px solid ${C.borde}`, borderRadius:10, padding:"8px 12px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              {t("Logout")}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:1180, margin:"0 auto", padding:isMobile?"14px 12px 32px":isTablet?"18px 16px 40px":"24px 24px 48px", minWidth:0 }}>
        {tab === "hoy" && (
          <TabHoy base={base} eventos={eventos} bloqueos={bloqueos} viajes={viajes} proyectos={proyectos} palancas={palancas} deudas={deudas} suministros={suministros} gastosVariables={gastosVariables} compromisosAnuales={compromisosAnuales} setTab={setTab} />
        )}
        {tab === "suenos" && (
          <TabSuenos viajes={viajes} proyectos={proyectos} palancas={palancas} setTab={setTab} />
        )}
        {tab === "recursos" && (
          <TabPresupuesto base={base} setBase={setBase} eventos={eventos} bloqueos={bloqueos} viajes={viajes} proyectos={proyectos} palancas={palancas} setPalancas={setPalancas} deudas={deudas} setDeudas={setDeudas} suministros={suministros} setSuministros={setSuministros} gastosVariables={gastosVariables} setGastosVariables={setGastosVariables} compromisosAnuales={compromisosAnuales} setCompromisosAnuales={setCompromisosAnuales}/>
        )}
        {tab === "tiempo" && (
          <TabCalendario eventos={eventos} viajes={viajes} bloqueos={bloqueos} setBloqueos={setBloqueos} setModal={setModal} cumpleanos={cumpleanos}/>
        )}
        {tab === "proyectos" && (
          <TabGantt proyectos={proyectos} setProyectos={setProyectos} setDeudas={setDeudas}/>
        )}
      </div>

      {/* Global modals */}
      {modal?.type === "evento" && (
        <ModalEvento fechaInicial={modal.fecha} evento={modal.item} defaults={modal.defaults} onSave={saveEvent} onDelete={deleteEvent} onClose={() => setModal(null)}/>
      )}
      {modal?.type === "viaje" && (
        <ModalViaje viaje={modal.item} fechaInicial={modal.fecha} onSave={saveTrip} onDelete={deleteTrip} onClose={() => setModal(null)}/>
      )}
    </>
  );
}

const cleanText = (value, fallback = "") => String(value || fallback).trim();
const lowerText = (value) => cleanText(value).toLowerCase();
const formatIsoDay = (value) => {
  const text = cleanText(value);
  if (!text.includes("-")) return text;
  const [, month, day] = text.split("-");
  return `${day}/${month}`;
};
const sortByDate = (items, key) => [...(items || [])].sort((a, b) => cleanText(a?.[key]).localeCompare(cleanText(b?.[key])));
const upcomingByDate = (items, key) => sortByDate(items, key).filter(item => cleanText(item?.[key]) >= todayISO);
const isProjectDone = (project) => ["done", "completado", "completed"].includes(lowerText(project?.estado));
const money = (value) => new Intl.NumberFormat("es-ES", { style:"currency", currency:"EUR", maximumFractionDigits:0 }).format(Number(value || 0));
const currentYear = () => Number(todayISO.slice(0, 4));
const currentMonthIndex = () => Math.max(0, Math.min(11, Number(todayISO.slice(5, 7)) - 1));
const daysUntilDate = (value) => {
  const text = cleanText(value);
  if (!text.includes("-")) return null;
  return Math.ceil((new Date(`${text}T12:00:00`).getTime() - new Date(`${todayISO}T12:00:00`).getTime()) / 86400000);
};
const sameDateInYear = (date, year) => /^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) ? `${year}${String(date).slice(4)}` : "";
const nextAnnualDate = (date, year) => {
  const thisYear = sameDateInYear(date, year);
  if (!thisYear) return "";
  return thisYear >= todayISO ? thisYear : sameDateInYear(date, year + 1);
};

function TabHoy({ base, eventos = [], bloqueos = [], viajes = [], proyectos = [], palancas = [], deudas = [], suministros = [], gastosVariables = [], compromisosAnuales = [], setTab }) {
  const year = currentYear();
  const monthIndex = currentMonthIndex();
  const { datosMes } = useDatosMes({ base, eventos, bloqueos, viajes, palancas, deudas, suministros, gastosVariables, proyectos, compromisosAnuales, año:year, mesActual:monthIndex });
  const monthData = datosMes[monthIndex];
  const resourceSummary = monthData?.resumen_recursos;
  const activeProjects = (proyectos || []).filter(project => !isProjectDone(project));
  const blockedProjects = activeProjects.filter(project => lowerText(project.estado).includes("bloque"));
  const upcomingEvents = upcomingByDate(eventos, "fecha");
  const upcomingTrips = upcomingByDate(viajes, "inicio");
  const inactiveLevers = (palancas || []).filter(lever => !lever.activa);
  const activeDebts = (deudas || []).filter(debt => Number(debt?.cuota_actual || 0) < Number(debt?.cuotas_totales || 0));
  const upcomingCommitments = useMemo(() => (compromisosAnuales || [])
    .map(commitment => {
      const dueDate = nextAnnualDate(commitment.fechaVencimiento, year);
      return { ...commitment, dueDate, daysToDue:daysUntilDate(dueDate) };
    })
    .filter(commitment => commitment.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [compromisosAnuales, year]);
  const calendarLeverStatus = useMemo(() => inactiveLevers
    .filter(lever => lever.calendarioVinculado)
    .map(lever => {
      const fit = calculateLeverCalendarFit(lever, { events:eventos, blocks:bloqueos, trips:viajes });
      return { lever, fit, viableAmount:calculateLeverBudgetAmount(lever, { events:eventos, blocks:bloqueos, trips:viajes }) };
    }), [bloqueos, eventos, inactiveLevers, viajes]);
  const conflictedLever = calendarLeverStatus.find(item => item.fit.conflictos.length > 0);
  const availableLever = calendarLeverStatus.find(item => item.fit.disponible && item.viableAmount > 0);
  const dueCommitment = upcomingCommitments.find(commitment => commitment.daysToDue !== null && commitment.daysToDue <= Number(commitment.avisoDiasAntes || 30));
  const reserveThisMonth = Number(monthData?.gasto_reservas || 0);
  const cardPressure = Number(resourceSummary?.presion_tarjeta || 0);
  const margin = Number(resourceSummary?.margen_real || 0);
  const pressure = Number(resourceSummary?.presion_financiera || 0);
  const resourceSignals = [
    margin < 0 && { when:"Recursos", title:"Margen real en negativo", detail:`Faltan ${money(Math.abs(margin))} para cerrar el mes.`, tab:"recursos", color:C.error, bg:C.errorBg },
    margin >= 0 && pressure >= 90 && { when:"Recursos", title:"Presión financiera alta", detail:`${pressure}% del ingreso ya está asignado.`, tab:"recursos", color:C.warn, bg:C.warnBg },
    reserveThisMonth > 0 && { when:"Reserva", title:"Separar reserva del mes", detail:`${money(reserveThisMonth)} para compromisos conocidos.`, tab:"recursos", color:C.brandSecondaryStrong, bg:C.brandSecondaryFixed },
    dueCommitment && { when:formatIsoDay(dueCommitment.dueDate), title:`Vence ${cleanText(dueCommitment.nombre, "compromiso")}`, detail:`Aviso activo · ${money(dueCommitment.importe)}`, tab:"recursos", color:C.brandTertiary, bg:C.brandTertiaryFixed },
    cardPressure > 0 && { when:"Tarjeta", title:"Impacto de tarjeta y cuotas", detail:`${money(cardPressure)} presionan caja este mes.`, tab:"recursos", color:C.warn, bg:C.warnBg },
    conflictedLever && { when:"Calendario", title:`Revisar ${cleanText(conflictedLever.lever.nombre, "palanca")}`, detail:`Tiene ${conflictedLever.fit.conflictos.length} conflicto${conflictedLever.fit.conflictos.length === 1 ? "" : "s"}.`, tab:"recursos", color:C.warn, bg:C.warnBg },
    availableLever && { when:"Palanca", title:`Disponible ${cleanText(availableLever.lever.nombre, "palanca")}`, detail:`Potencial viable de ${money(availableLever.viableAmount)}.`, tab:"recursos", color:C.brandSecondaryStrong, bg:C.brandSecondaryFixed },
  ].filter(Boolean);

  const actions = [
    ...resourceSignals.slice(0, 3),
    ...upcomingEvents.slice(0, 2).map(event => ({
      when:formatIsoDay(event.fecha),
      title:cleanText(event.titulo, "Evento"),
      detail:event.importe ? `${money(event.importe)} · Tiempo` : "Tiempo",
      tab:"tiempo",
      color:C.brandSecondaryStrong,
      bg:C.brandSecondaryFixed,
    })),
    ...upcomingTrips.slice(0, 2).map(trip => ({
      when:formatIsoDay(trip.inicio),
      title:cleanText(trip.nombre, "Viaje"),
      detail:`Viaje · ${money(trip.presupuesto)}`,
      tab:"proyectos",
      color:COLOR_VIAJE,
      bg:BG_VIAJE,
    })),
    ...blockedProjects.slice(0, 2).map(project => ({
      when:"Proyecto",
      title:cleanText(project.titulo, "Decisión pendiente"),
      detail:"Bloqueo por resolver",
      tab:"proyectos",
      color:C.brandPrimary,
      bg:C.brandPrimaryFixed,
    })),
    ...inactiveLevers.slice(0, 1).map(lever => ({
      when:"Recursos",
      title:cleanText(lever.nombre, "Palanca sin activar"),
      detail:`Puede sumar ${money(lever.importe)}`,
      tab:"recursos",
      color:C.brandSecondaryStrong,
      bg:C.brandSecondaryFixed,
    })),
  ].slice(0, 5);

  const recommended = resourceSignals[0]
    || (upcomingTrips[0]
    ? { title:`Revisar ${cleanText(upcomingTrips[0].nombre, "viaje")}`, detail:"Viajes mantiene su azul propio y aparece acá cuando puede afectar tiempo o recursos.", tab:"recursos", color:COLOR_VIAJE, bg:BG_VIAJE }
    : inactiveLevers[0]
      ? { title:"Activar una palanca", detail:`${cleanText(inactiveLevers[0].nombre)} puede mejorar el margen del mes.`, tab:"recursos", color:C.brandSecondaryStrong, bg:C.brandSecondaryFixed }
      : blockedProjects[0]
        ? { title:"Cerrar una decisión pequeña", detail:`${cleanText(blockedProjects[0].titulo)} está frenando movimiento.`, tab:"proyectos", color:C.brandPrimary, bg:C.brandPrimaryFixed }
        : { title:"Mantener la semana simple", detail:"No hay señales fuertes; conviene mirar lo próximo y no abrir demasiados frentes.", tab:"tiempo", color:C.brandSecondaryStrong, bg:C.brandSecondaryFixed });

  return (
    <div style={{ display:"grid", gap:18 }}>
      <PageIntro eyebrow="Estado de situación" title="Hoy" copy="Lo primero es lo que necesita acción esta semana; lo demás queda como contexto." />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:18, alignItems:"start" }}>
        <section style={panelS()}>
          <PanelHead title="Esta semana" copy="Pocas acciones visibles para poder moverte con calma." tag={`${actions.length} acciones`} />
          <div style={{ display:"grid", gap:0, borderTop:`1px solid ${C.borde}` }}>
            {actions.length === 0 && <EmptyState text="No hay acciones inmediatas. Puedes mirar Tiempo o Recursos para planificar." />}
            {actions.map((action, index) => (
              <button key={`${action.title}-${index}`} onClick={() => setTab(action.tab)} style={{ display:"grid", gridTemplateColumns:"78px minmax(0,1fr) auto", gap:10, alignItems:"center", textAlign:"left", background:"transparent", border:"none", borderBottom:`1px solid ${C.borde}`, padding:"12px 2px", cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
                <span style={{ color:C.txt2, fontSize:11, fontWeight:850, textTransform:"uppercase", letterSpacing:"0.04em" }}>{action.when}</span>
                <span style={{ minWidth:0 }}>
                  <strong style={{ display:"block", color:C.txt, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{action.title}</strong>
                  <span style={{ display:"block", color:C.txt2, fontSize:11, marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{action.detail}</span>
                </span>
                <span style={{ color:action.color, background:action.bg, border:`1px solid ${action.color}22`, borderRadius:999, padding:"4px 8px", fontSize:10, fontWeight:850 }}>Abrir</span>
              </button>
            ))}
          </div>
        </section>
        <div style={{ display:"grid", gap:14 }}>
          <IterSpeech text="Estás mirando la semana primero. Si una decisión afecta tiempo o recursos, Iter la trae acá antes de que se vuelva ruido." />
          <section style={panelS()}>
            <PanelHead title="Atención recomendada" copy="Una señal clara, no diez alarmas." />
            <button onClick={() => setTab(recommended.tab)} style={{ width:"100%", textAlign:"left", background:recommended.bg, border:`1px solid ${recommended.color}22`, borderRadius:12, padding:"12px 14px", cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              <strong style={{ display:"block", color:recommended.color, fontSize:13, marginBottom:5 }}>{recommended.title}</strong>
              <span style={{ display:"block", color:C.txt2, fontSize:12, lineHeight:1.45 }}>{recommended.detail}</span>
            </button>
          </section>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10 }}>
        <MetricCard label="Margen real" value={money(margin)} color={margin < 0 ? C.error : C.brandSecondaryStrong} bg={margin < 0 ? C.errorBg : C.brandSecondaryFixed} />
        <MetricCard label="Presión" value={`${pressure}%`} color={pressure >= 90 ? C.warn : C.brandPrimary} bg={pressure >= 90 ? C.warnBg : C.brandPrimaryFixed} />
        <MetricCard label="Reserva mes" value={money(reserveThisMonth)} color={C.brandSecondaryStrong} bg={C.brandSecondaryFixed} />
        <MetricCard label="Tarjeta/cuotas" value={money(cardPressure)} color={C.warn} bg={C.warnBg} />
        <MetricCard label="Proyectos activos" value={activeProjects.length} color={C.brandPrimary} bg={C.brandPrimaryFixed} />
        <MetricCard label="Deudas activas" value={activeDebts.length} color={C.brandTertiary} bg={C.brandTertiaryFixed} />
      </div>
    </div>
  );
}

function TabSuenos({ viajes = [], proyectos = [], palancas = [], setTab }) {
  const activeProjects = (proyectos || []).filter(project => !isProjectDone(project));
  const upcomingTrips = upcomingByDate(viajes, "inicio");
  const inactiveLevers = (palancas || []).filter(lever => !lever.activa);
  const dreams = [
    { title:"Vivir con más calma", detail:`${activeProjects.length} proyectos activos conectan intención con ejecución.`, tab:"proyectos", color:C.brandPrimary, bg:C.brandPrimaryFixed },
    { title:"Viajar más", detail:`${upcomingTrips.length} viajes están presentes como planes, fechas y recursos.`, tab:"proyectos", color:COLOR_VIAJE, bg:BG_VIAJE },
    { title:"Sostener margen", detail:`${inactiveLevers.length} palancas pueden ampliar recursos sin perder calma.`, tab:"recursos", color:C.brandSecondaryStrong, bg:C.brandSecondaryFixed },
  ];

  return (
    <div style={{ display:"grid", gap:18 }}>
      <PageIntro eyebrow="Sueños" title="Sueños en movimiento" copy="El primer paso es conectar aspiraciones con proyectos, tiempo y recursos existentes." />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))", gap:14 }}>
        {dreams.map(dream => (
          <button key={dream.title} onClick={() => setTab(dream.tab)} style={{ ...panelS({ borderColor:`${dream.color}33`, background:`linear-gradient(135deg, ${C.superficie}, ${dream.bg})`, cursor:"pointer" }), textAlign:"left", fontFamily:"'Lato',sans-serif" }}>
            <span style={{ display:"block", color:dream.color, fontSize:11, fontWeight:850, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Sueño activo</span>
            <strong style={{ display:"block", color:C.txt, fontSize:18, marginBottom:7 }}>{dream.title}</strong>
            <span style={{ display:"block", color:C.txt2, fontSize:13, lineHeight:1.45 }}>{dream.detail}</span>
          </button>
        ))}
      </div>
      <section style={panelS()}>
        <PanelHead title="Próxima forma" copy="Sueños necesita modelo propio; por ahora se apoya en señales reales de proyectos, viajes y recursos." />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10 }}>
          <MetricCard label="Proyectos conectables" value={activeProjects.length} color={C.brandPrimary} bg={C.brandPrimaryFixed} />
          <MetricCard label="Viajes" value={upcomingTrips.length} color={COLOR_VIAJE} bg={BG_VIAJE} />
          <MetricCard label="Palancas" value={inactiveLevers.length} color={C.brandSecondaryStrong} bg={C.brandSecondaryFixed} />
        </div>
      </section>
    </div>
  );
}

function PageIntro({ eyebrow, title, copy }) {
  return (
    <header style={{ display:"grid", gap:6, padding:"4px 0 2px" }}>
      <span style={{ color:C.txt2, fontSize:11, fontWeight:850, textTransform:"uppercase", letterSpacing:"0.08em" }}>{eyebrow}</span>
      <h1 style={{ margin:0, color:C.txt, fontSize:"clamp(32px,4.5vw,54px)", lineHeight:1.04, letterSpacing:0, fontFamily:"'Playfair Display',serif" }}>{title}</h1>
      <p style={{ margin:0, maxWidth:720, color:C.txt2, fontSize:15, lineHeight:1.5 }}>{copy}</p>
    </header>
  );
}

function PanelHead({ title, copy, tag = "" }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:14 }}>
      <div>
        <h2 style={{ margin:0, color:C.txt, fontSize:16, fontWeight:850 }}>{title}</h2>
        {copy && <p style={{ margin:"4px 0 0", color:C.txt2, fontSize:12, lineHeight:1.4 }}>{copy}</p>}
      </div>
      {tag && <span style={{ flex:"0 0 auto", color:C.brandPrimary, background:C.brandPrimaryFixed, border:`1px solid ${C.brandPrimaryDim}`, borderRadius:999, padding:"5px 9px", fontSize:11, fontWeight:850 }}>{tag}</span>}
    </div>
  );
}

function MetricCard({ label, value, color, bg }) {
  return (
    <div style={{ minWidth:0, background:bg, border:`1px solid ${color}22`, borderLeft:`4px solid ${color}`, borderRadius:12, padding:"13px 14px", boxShadow:"0 1px 8px rgba(45,41,50,0.035)" }}>
      <div style={{ color:C.txt2, fontSize:10, fontWeight:850, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:7, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{label}</div>
      <div style={{ color, fontSize:25, lineHeight:1, fontWeight:900, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{value}</div>
    </div>
  );
}

function IterSpeech({ text }) {
  return (
    <article aria-label="Mensaje de Iter" style={{ display:"grid", gridTemplateColumns:"44px minmax(0,1fr)", gap:12, alignItems:"start" }}>
      <div aria-hidden="true" style={{ width:44, height:44, borderRadius:12, display:"grid", placeItems:"center", background:C.brandPrimaryFixed, color:C.brandPrimary, border:`1px solid ${C.brandPrimaryDim}`, fontWeight:900, boxShadow:"0 8px 18px rgba(45,41,50,0.06)" }}>I</div>
      <div style={{ borderRadius:16, padding:"16px 18px", background:`linear-gradient(135deg, ${C.brandPrimaryFixed}, ${C.brandSecondaryFixed})`, border:`1px solid ${C.brandPrimaryDim}`, boxShadow:"0 1px 8px rgba(45,41,50,0.035)" }}>
        <p style={{ margin:"0 0 8px", color:C.brandPrimary, fontSize:11, fontWeight:850, textTransform:"uppercase", letterSpacing:"0.06em" }}>Iter te diría</p>
        <p style={{ margin:0, color:C.txt, fontSize:20, lineHeight:1.35, fontWeight:850 }}>{text}</p>
      </div>
    </article>
  );
}

function EmptyState({ text }) {
  return <div style={{ color:C.txt2, background:C.fondo, border:`1px solid ${C.borde}`, borderRadius:12, padding:"14px 16px", fontSize:13, lineHeight:1.45 }}>{text}</div>;
}

function panelS(extra = {}) {
  return {
    minWidth:0,
    background:"rgba(255,255,255,0.86)",
    border:`1px solid ${C.borde}`,
    borderRadius:14,
    padding:"20px 22px",
    boxShadow:"0 1px 8px rgba(45,41,50,0.035)",
    ...extra,
  };
}
