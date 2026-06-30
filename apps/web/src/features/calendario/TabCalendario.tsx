import { useMemo, useState } from "react";
import { CATEGORIAS, COLOR_VIAJE, BG_VIAJE, categoriaEventoKey, eventoVisibleEnCalendario } from "../../constants/categorias.ts";
import { C, cardN, inputS, labelS } from "../../constants/colores.ts";
import { fmtd, labelMes } from "../../utils/format.ts";
import { todayISO, daysBetween, toISO } from "../../utils/dates.ts";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useI18n } from "../../i18n.tsx";
import CalMensual from "./CalMensual.tsx";
import CalSemanal from "./CalSemanal.tsx";

export default function TabCalendario({ eventos = [], viajes = [], bloqueos = [], setBloqueos, setModal, cumpleanos = [] }) {
  const { t, monthName } = useI18n();
  const [hoy] = useState(() => new Date());
  const { isMobile, isTablet } = useBreakpoint();
  const [vista, setVista] = useState("mensual");
  const [año, setAño] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [inicio, setInicio] = useState(() => {
    const date = new Date(hoy);
    const offset = date.getDay() === 0 ? -6 : 1 - date.getDay();
    date.setDate(date.getDate() + offset);
    return new Date(date);
  });
  const [modalBloqueo, setModalBloqueo] = useState(null);

  const navMes = (delta) => {
    let nextMonth = mes + delta;
    let nextYear = año;
    if (nextMonth < 0) { nextMonth = 11; nextYear--; }
    if (nextMonth > 11) { nextMonth = 0; nextYear++; }
    setMes(nextMonth);
    setAño(nextYear);
  };

  const navSemana = (delta) => {
    const nextStart = new Date(inicio);
    nextStart.setDate(nextStart.getDate() + delta * 7);
    setInicio(nextStart);
  };

  const finSemana = new Date(inicio);
  finSemana.setDate(finSemana.getDate() + 6);
  const labelSem = `${inicio.getDate()} ${monthName(inicio.getMonth(), "short")} - ${finSemana.getDate()} ${monthName(finSemana.getMonth(), "short")} ${finSemana.getFullYear()}`;
  const pref = `${año}-${String(mes + 1).padStart(2, "0")}`;
  const prefHoy = todayISO.slice(0, 7);
  const diasSemana = Array.from({ length:7 }, (_, index) => {
    const day = new Date(inicio);
    day.setDate(day.getDate() + index);
    return toISO(day);
  });
  const fechaNuevaAccion = vista === "mensual"
    ? (pref === prefHoy ? todayISO : `${pref}-01`)
    : (diasSemana.includes(todayISO) ? todayISO : toISO(inicio));
  const layoutColumns = isMobile || isTablet ? "1fr" : "minmax(0,1fr) 290px";

  const momentosProximos = useMemo(() => {
    const upcomingEvents = eventos
      .filter(event => event.fecha >= todayISO && eventoVisibleEnCalendario(event))
      .map(event => {
        const category = CATEGORIAS[categoriaEventoKey(event)] || CATEGORIAS.otro;
        return {
          id:`event-${event.id}`,
          date:event.fecha,
          title:event.titulo || t("Event"),
          detail:t(category.label),
          icon:category.emoji,
          color:category.color,
          bg:category.bg,
          onClick:() => setModal({ type:"evento", item:event }),
        };
      });

    const upcomingTrips = viajes
      .filter(trip => trip.inicio >= todayISO || trip.fin >= todayISO)
      .map(trip => ({
        id:`trip-${trip.id}`,
        date:trip.inicio || trip.fin,
        title:trip.nombre || t("Trip"),
        detail:t("Trip"),
        icon:"✈️",
        color:COLOR_VIAJE,
        bg:BG_VIAJE,
        onClick:() => setModal({ type:"viaje", item:trip, fecha:trip.inicio }),
      }));

    const upcomingBlocks = bloqueos
      .filter(block => (block.inicio || block.fin) >= todayISO)
      .map(block => ({
        id:`block-${block.id}`,
        date:block.inicio || block.fin,
        title:blockTitle(block, t),
        detail:t("Availability"),
        icon:blockIcon(block),
        color:blockColor(block),
        bg:blockBg(block),
        onClick:() => setModalBloqueo(block),
      }));

    const upcomingBirthdays = cumpleanos
      .map(birthday => ({ ...birthday, proximo:nextBirthdayDate(birthday.fecha, hoy) }))
      .filter(birthday => birthday.proximo)
      .map(birthday => ({
        id:`birthday-${birthday.id || birthday.nombre}`,
        date:toISO(birthday.proximo),
        title:birthday.nombre || t("Birthday"),
        detail:t("Birthday"),
        icon:"🎂",
        color:C.brandTertiary,
        bg:C.brandTertiaryFixed,
        onClick:undefined,
      }));

    return [...upcomingEvents, ...upcomingTrips, ...upcomingBlocks, ...upcomingBirthdays]
      .filter(item => item.date)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6);
  }, [bloqueos, cumpleanos, eventos, hoy, setModal, t, viajes]);

  const guardarBloqueo = () => {
    const item = {
      ...modalBloqueo,
      id:modalBloqueo.id || Date.now(),
      tipo:modalBloqueo.tipo || "recurso",
      recursoNombre:String(modalBloqueo.recursoNombre || "").trim(),
      importe:Number(modalBloqueo.importe || 0),
      horaInicio:modalBloqueo.horaInicio || "",
      horaFin:modalBloqueo.horaFin || "",
    };
    setBloqueos(prev => item.id && prev.find(block => block.id === item.id) ? prev.map(block => block.id === item.id ? item : block) : [...prev, item]);
    setModalBloqueo(null);
  };

  const eliminarBloqueo = (id) => {
    setBloqueos(prev => prev.filter(block => block.id !== id));
    setModalBloqueo(null);
  };

  const abrirDisponibilidad = () => setModalBloqueo({
    tipo:"recurso",
    recursoNombre:"",
    inicio:fechaNuevaAccion || todayISO,
    fin:fechaNuevaAccion || todayISO,
    horaInicio:"",
    horaFin:"",
    nota:"",
    importe:"",
  });

  return (
    <div style={{ display:"grid", gridTemplateColumns:layoutColumns, gap:isMobile ? 12 : 16, alignItems:"start", minWidth:0 }}>
      <div style={{ minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", gap:4, background:C.fondo, borderRadius:10, padding:3, border:`1px solid ${C.borde}` }}>
            {["mensual", "semanal"].map(view => (
              <button key={view} onClick={() => setVista(view)}
                style={{ background:vista === view ? C.cyan : "transparent", color:vista === view ? "white" : C.txt2, border:"none", borderRadius:8, padding:"6px 16px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif", transition:"all 0.15s" }}>
                {view === "mensual" ? `📅 ${t("Month")}` : `📋 ${t("Week")}`}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, width:isMobile ? "100%" : "auto", justifyContent:isMobile ? "space-between" : "flex-start" }}>
            <button onClick={() => vista === "mensual" ? navMes(-1) : navSemana(-1)}
              style={{ background:C.superficie, border:`1px solid ${C.borde}`, borderRadius:9, width:32, height:32, cursor:"pointer", fontSize:16, color:C.cyan, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
            <span style={{ fontSize:isMobile ? 13 : 15, fontWeight:700, color:C.txt, minWidth:isMobile ? 150 : 190, textAlign:"center" }}>
              {vista === "mensual" ? `${monthName(mes)} ${año}` : labelSem}
            </span>
            <button onClick={() => vista === "mensual" ? navMes(1) : navSemana(1)}
              style={{ background:C.superficie, border:`1px solid ${C.borde}`, borderRadius:9, width:32, height:32, cursor:"pointer", fontSize:16, color:C.cyan, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", width:isMobile ? "100%" : "auto", justifyContent:isMobile ? "space-between" : "flex-start" }}>
            <button onClick={() => setModal({ type:"evento", fecha:fechaNuevaAccion || todayISO })}
              style={{ flex:isMobile ? 1 : "initial", display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:C.cyan, color:"white", border:"none", borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              <i className="bi bi-plus-circle" aria-hidden="true"/> {t("Add event")}
            </button>
            <button onClick={() => setModal({ type:"viaje", fecha:fechaNuevaAccion || todayISO })}
              style={{ flex:isMobile ? 1 : "initial", display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:COLOR_VIAJE, color:"white", border:`1px solid ${COLOR_VIAJE}`, borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              <i className="bi bi-airplane" aria-hidden="true"/> {t("Add trip")}
            </button>
            <button onClick={abrirDisponibilidad}
              style={{ flex:isMobile ? 1 : "initial", display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:C.superficie, color:C.brandPrimary, border:`1px solid ${C.brandPrimaryDim}`, borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              <i className="bi bi-calendar-range" aria-hidden="true"/> {t("Availability")}
            </button>
          </div>
        </div>

        <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap", alignItems:"center", color:C.txt2, fontSize:11 }}>
          <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, background:COLOR_VIAJE, display:"inline-block", borderRadius:2 }}/> {t("Trip")}</span>
          <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, background:C.brandPrimaryFixed, display:"inline-block", border:`1px solid ${C.brandPrimaryDim}`, borderRadius:2 }}/> {t("Availability")}</span>
          <span style={{ color:C.txt2 }}>{t("Time shows when life takes space; Resources explains the money.")}</span>
        </div>

        <div style={{ ...cardN(isMobile ? { padding:"12px 10px", overflowX:"auto" } : undefined) }}>
          {vista === "mensual"
            ? <CalMensual año={año} mes={mes} eventos={eventos} viajes={viajes} bloqueos={bloqueos} cumpleanos={cumpleanos} onDia={date => setModal({ type:"evento", fecha:date })} onEvento={event => setModal({ type:"evento", item:event })} onViaje={trip => setModal({ type:"viaje", item:trip, fecha:trip.inicio })} onBloqueo={setModalBloqueo}/>
            : <CalSemanal inicio={inicio} eventos={eventos} viajes={viajes} bloqueos={bloqueos} cumpleanos={cumpleanos} onDia={date => setModal({ type:"evento", fecha:date })} onEvento={event => setModal({ type:"evento", item:event })} onViaje={trip => setModal({ type:"viaje", item:trip, fecha:trip.inicio })} onBloqueo={setModalBloqueo}/>
          }
        </div>

        {modalBloqueo && (
          <div onClick={event => event.target === event.currentTarget && setModalBloqueo(null)}
            style={{ position:"fixed", inset:0, background:"rgba(17,20,24,0.55)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
            <div style={{ background:C.superficie, borderRadius:20, padding:24, width:"100%", maxWidth:390, boxShadow:"0 24px 60px rgba(0,0,0,0.2)", border:`1px solid ${C.borde}` }}>
              <div style={{ fontSize:17, fontWeight:800, color:C.txt, marginBottom:16 }}>{blockIcon(modalBloqueo)} {t("Availability / block")}</div>
              <div style={{ display:"grid", gap:10 }}>
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>{t("Resource or lever")}</label>
                  <input value={modalBloqueo.recursoNombre || legacyResourceName(modalBloqueo, t)} onChange={event => setModalBloqueo(current => ({ ...current, recursoNombre:event.target.value, tipo:current.tipo || "recurso" }))} placeholder={t("Resource or lever...")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div>
                    <label style={{ ...labelS, color:C.txt2 }}>{t("From")}</label>
                    <input type="date" value={modalBloqueo.inicio || ""} onChange={event => setModalBloqueo(current => ({ ...current, inicio:event.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                  </div>
                  <div>
                    <label style={{ ...labelS, color:C.txt2 }}>{t("To")}</label>
                    <input type="date" value={modalBloqueo.fin || ""} onChange={event => setModalBloqueo(current => ({ ...current, fin:event.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div>
                    <label style={{ ...labelS, color:C.txt2 }}>{t("Start time")}</label>
                    <input type="time" value={modalBloqueo.horaInicio || ""} onChange={event => setModalBloqueo(current => ({ ...current, horaInicio:event.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                  </div>
                  <div>
                    <label style={{ ...labelS, color:C.txt2 }}>{t("End time")}</label>
                    <input type="time" value={modalBloqueo.horaFin || ""} onChange={event => setModalBloqueo(current => ({ ...current, horaFin:event.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                  </div>
                </div>
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>{t("Note")}</label>
                  <input value={modalBloqueo.nota || ""} onChange={event => setModalBloqueo(current => ({ ...current, nota:event.target.value }))} placeholder={t("Context or conditions...")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                </div>
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>{t("Estimated amount (€)")}</label>
                  <input type="number" step="0.01" min="0" value={modalBloqueo.importe || ""} onChange={event => setModalBloqueo(current => ({ ...current, importe:Number(event.target.value) }))} placeholder="0.00" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                </div>
                {modalBloqueo.inicio && modalBloqueo.fin && (
                  <div style={{ background:C.brandPrimaryFixed, borderRadius:9, padding:"9px 12px", fontSize:12, color:C.brandPrimary, fontWeight:700, border:`1px solid ${C.brandPrimaryDim}` }}>
                    {daysBetween(modalBloqueo.inicio, modalBloqueo.fin)} {t("days")}
                    {(modalBloqueo.horaInicio || modalBloqueo.horaFin) && <> · {modalBloqueo.horaInicio || "--:--"} - {modalBloqueo.horaFin || "--:--"}</>}
                    {Number(modalBloqueo.importe || 0) > 0 && <> · {fmtd(Number(modalBloqueo.importe || 0))}</>}
                  </div>
                )}
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={guardarBloqueo} disabled={!modalBloqueo.inicio || !modalBloqueo.fin}
                    style={{ flex:1, background:C.cyan, color:"white", border:"none", borderRadius:11, padding:11, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif", opacity:!modalBloqueo.inicio || !modalBloqueo.fin ? 0.55 : 1 }}>
                    {modalBloqueo.id ? t("Save changes") : t("Save block")}
                  </button>
                  {modalBloqueo.id && (
                    <button onClick={() => eliminarBloqueo(modalBloqueo.id)}
                      style={{ background:C.errorBg, color:C.error, border:`1px solid ${C.error}44`, borderRadius:11, padding:"11px 14px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
                      {t("Delete")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <aside style={{ display:"grid", gap:10, position:isMobile || isTablet ? "static" : "sticky", top:70 }}>
        <div style={{ background:C.superficie, borderRadius:16, padding:"16px 18px", border:`1px solid ${C.borde}`, boxShadow:"0 1px 6px rgba(17,20,24,0.06)" }}>
          <div style={{ fontSize:10, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.8px", fontWeight:800 }}>{labelMes(vista === "mensual" ? pref : toISO(inicio).slice(0, 7))}</div>
          <div style={{ fontSize:22, fontWeight:800, color:C.txt, marginTop:4, fontFamily:"'Playfair Display',serif" }}>{t("Next in Time")}</div>
          <div style={{ fontSize:12, color:C.txt2, marginTop:4, lineHeight:1.45 }}>{t("Events, trips and availability. Money details live in Resources.")}</div>
        </div>

        <div style={cardN()}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8, marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.6px" }}>{t("Upcoming")}</div>
            <div style={{ fontSize:11, color:C.txt2 }}>{momentosProximos.length} {t("records")}</div>
          </div>
          {momentosProximos.length === 0 && <div style={{ fontSize:12, color:C.txt2 }}>{t("No upcoming items")}</div>}
          <div style={{ display:"grid", gap:8 }}>
            {momentosProximos.map(item => (
              <button key={item.id} onClick={"onClick" in item ? item.onClick : undefined}
                style={{ display:"grid", gridTemplateColumns:"42px minmax(0,1fr)", gap:9, alignItems:"center", textAlign:"left", background:item.bg, border:`1px solid ${item.color}22`, borderRadius:12, padding:"8px 9px", cursor:"onClick" in item && item.onClick ? "pointer" : "default", fontFamily:"'Lato',sans-serif" }}>
                <span style={{ width:34, height:34, borderRadius:10, background:C.superficie, color:item.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:800, border:`1px solid ${item.color}22` }}>{item.icon}</span>
                <span style={{ minWidth:0 }}>
                  <strong style={{ display:"block", color:C.txt, fontSize:12.5, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.title}</strong>
                  <span style={{ display:"block", color:C.txt2, fontSize:10.5, marginTop:2 }}>{formatShortDate(item.date)} · {item.detail}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

const nextBirthdayDate = (fecha, now = new Date()) => {
  if (!fecha || fecha.length < 10) return null;
  const month = Number(fecha.slice(5, 7));
  const day = Number(fecha.slice(8, 10));
  if (!month || !day) return null;
  const next = new Date(now.getFullYear(), month - 1, day);
  next.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (next < today) next.setFullYear(next.getFullYear() + 1);
  return next;
};

const formatShortDate = (date) => String(date || "").slice(5).split("-").reverse().join("/");

const blockIcon = (block) => {
  if (block?.tipo === "habitacion") return "🛏️";
  if (block?.tipo === "coche") return "🚗";
  return "📍";
};

const legacyResourceName = (block, t) => {
  if (block?.recursoNombre) return block.recursoNombre;
  if (block?.tipo === "habitacion") return t("Room");
  if (block?.tipo === "coche") return t("Car");
  return "";
};

const blockTitle = (block, t) => block?.recursoNombre || block?.nota || legacyResourceName(block, t) || t("Availability");
const blockColor = (block) => block?.tipo === "habitacion" ? C.sageDark : block?.tipo === "coche" ? C.brandTertiary : C.brandPrimary;
const blockBg = (block) => block?.tipo === "habitacion" ? C.exitoBg : block?.tipo === "coche" ? C.brandTertiaryFixed : C.brandPrimaryFixed;