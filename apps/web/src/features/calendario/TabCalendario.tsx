import { useMemo, useState } from "react";
import { FUNDING_SOURCES, estimateCreditCardFirstChargeMonth } from "@sofi-marqui/domain";
import { CATEGORIAS, categoriaEvento, categoriaEventoKey } from "../../constants/categorias.ts";
import { C, cardN, inputS, labelS } from "../../constants/colores.ts";
import { fmtd, labelMes } from "../../utils/format.ts";
import { todayISO, daysBetween } from "../../utils/dates.ts";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useI18n } from "../../i18n.tsx";
import CalMensual from "./CalMensual.tsx";
import CalSemanal from "./CalSemanal.tsx";

export default function TabCalendario({ eventos, viajes, bloqueos, setBloqueos, setModal, comprasSuper = [], onSaveSuperPurchase, onDeleteSuperPurchase, cumpleanos = [], setCumpleanos }) {
  const { t, monthName } = useI18n();
  const hoy = new Date();
  const { isMobile, isTablet } = useBreakpoint();
  const [vista,   setVista]   = useState("mensual");
  const [año,     setAño]     = useState(hoy.getFullYear());
  const [mes,     setMes]     = useState(hoy.getMonth());
  const [inicio,  setInicio]  = useState(() => {
    const d = new Date(hoy);
    const off = d.getDay() === 0 ? -6 : 1 - d.getDay();
    d.setDate(d.getDate() + off);
    return new Date(d);
  });
  const [modalBloqueo, setModalBloqueo] = useState(null);
  const nuevaCompraSuper = () => ({ fecha:todayISO, comercio:"", importe:"", origenFondos:FUNDING_SOURCES.MONTH_INCOME, cuotasTarjeta:1, mesPrimerCargo:"", tarjetaNombre:"", tarjetaDiaCierre:"", notas:"", lineas:[] });
  const [compraSuper, setCompraSuper] = useState<any>(nuevaCompraSuper);
  const [lineaSuper, setLineaSuper] = useState<any>({ producto:"", cantidad:1, unidad:"", importe:"", categoria:"" });
  const [cumpleForm, setCumpleForm] = useState<any>({ nombre:"", fecha:"", relacion:"", presupuestoRegalo:"", notas:"" });

  // Navegación
  const navMes = (d) => {
    let m = mes + d, a = año;
    if (m < 0)  { m = 11; a--; }
    if (m > 11) { m = 0;  a++; }
    setMes(m); setAño(a);
  };
  const navSemana = (d) => {
    const s = new Date(inicio);
    s.setDate(s.getDate() + d * 7);
    setInicio(s);
  };
  const finSemana  = new Date(inicio); finSemana.setDate(finSemana.getDate() + 6);
  const labelSem   = `${inicio.getDate()} ${monthName(inicio.getMonth(), "short")} - ${finSemana.getDate()} ${monthName(finSemana.getMonth(), "short")} ${finSemana.getFullYear()}`;

  const pref         = `${año}-${String(mes + 1).padStart(2, "0")}`;
  const viajes_mes     = useMemo(() => viajes.filter(v => v.inicio?.startsWith(pref) || v.fin?.startsWith(pref)), [viajes, pref]);
  const gastosPorOrigen = useMemo(() => {
    const mapa = new Map();
    const addRow = (categoryKey, fundingSource, amount, count = 1) => {
      if (amount <= 0) return;
      const key = `${categoryKey}-${fundingSource}`;
      const previous = mapa.get(key) || { categoryKey, fundingSource, sum:0, count:0 };
      mapa.set(key, { ...previous, sum:previous.sum + amount, count:previous.count + count });
    };

    eventos
      .filter(evento => evento.fecha?.startsWith(pref) && categoriaEvento(evento)?.tipo === "gasto")
      .forEach(evento => addRow(categoriaEventoKey(evento), evento.origenFondos || FUNDING_SOURCES.MONTH_INCOME, Number(evento.importe || 0)));

    viajes_mes.forEach(viaje => {
      const totalViaje = Object.values(viaje.gastos || {}).reduce<number>((sum, amount) => sum + Number(amount || 0), 0);
      addRow("viaje", FUNDING_SOURCES.MONTH_INCOME, totalViaje);
    });

    return Array.from(mapa.values()).sort((a, b) => b.sum - a.sum);
  }, [eventos, pref, viajes_mes]);
  const totalGastosMes = gastosPorOrigen.reduce((sum, row) => sum + row.sum, 0);
  const maxGastoOrigen = Math.max(gastosPorOrigen[0]?.sum || 1, 1);
  const comprasSuperMes = useMemo(() => comprasSuper.filter(compra => compra.fecha?.startsWith(pref)).sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || ""))), [comprasSuper, pref]);
  const totalSuperMes = comprasSuperMes.reduce((sum, compra) => sum + Number(compra.importe || 0), 0);
  const productosSuperMes = comprasSuperMes.reduce((sum, compra) => sum + (compra.lineas || []).length, 0);
  const compraSuperLineasTotal = (compraSuper.lineas || []).reduce((sum, linea) => sum + Number(linea.importe || 0), 0);
  const compraSuperTotal = Number(compraSuper.importe || 0) || compraSuperLineasTotal;
  const compraSuperMesCargo = compraSuper.origenFondos === FUNDING_SOURCES.MONTH_INCOME ? "" : (compraSuper.mesPrimerCargo || estimateCreditCardFirstChargeMonth({ ...compraSuper, fecha:compraSuper.fecha }) || `${pref}`);
  const proximosCumpleanos = useMemo(() => cumpleanos
    .map(cumple => ({ ...cumple, proximo:nextBirthdayDate(cumple.fecha, hoy) }))
    .filter(cumple => cumple.proximo)
    .sort((a, b) => a.proximo.getTime() - b.proximo.getTime())
    .slice(0, 5), [cumpleanos]);
  const layoutColumns = isMobile || isTablet ? "1fr" : "minmax(0,1fr) 290px";

  const setOrigenCompraSuper = (value) => setCompraSuper(form => ({
    ...form,
    origenFondos:value,
    cuotasTarjeta:value === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? Math.max(2, Number(form.cuotasTarjeta || 2)) : 1,
    mesPrimerCargo:value === FUNDING_SOURCES.MONTH_INCOME ? "" : (form.mesPrimerCargo || estimateCreditCardFirstChargeMonth(form) || pref),
  }));

  const agregarLineaSuper = () => {
    if (!String(lineaSuper.producto || "").trim() && Number(lineaSuper.importe || 0) <= 0) return;
    setCompraSuper(form => ({ ...form, lineas:[...(form.lineas || []), { ...lineaSuper, producto:String(lineaSuper.producto || "").trim() || "Producto", cantidad:Number(lineaSuper.cantidad || 1), importe:Number(lineaSuper.importe || 0) }] }));
    setLineaSuper({ producto:"", cantidad:1, unidad:"", importe:"", categoria:"" });
  };

  const guardarCompraSuper = () => {
    if (!onSaveSuperPurchase || !compraSuper.fecha || compraSuperTotal <= 0) return;
    onSaveSuperPurchase({
      ...compraSuper,
      importe:compraSuperTotal,
      mesPrimerCargo:compraSuper.origenFondos === FUNDING_SOURCES.MONTH_INCOME ? "" : compraSuperMesCargo,
      tarjetaDiaCierre:compraSuper.tarjetaDiaCierre ? Number(compraSuper.tarjetaDiaCierre) : undefined,
    });
    setCompraSuper(nuevaCompraSuper());
    setLineaSuper({ producto:"", cantidad:1, unidad:"", importe:"", categoria:"" });
  };

  const guardarCumpleanos = () => {
    if (!setCumpleanos || !cumpleForm.nombre.trim() || !cumpleForm.fecha) return;
    const item = { ...cumpleForm, id:cumpleForm.id || Date.now(), nombre:cumpleForm.nombre.trim(), presupuestoRegalo:Number(cumpleForm.presupuestoRegalo || 0) };
    setCumpleanos(prev => item.id && prev.find(cumple => String(cumple.id) === String(item.id)) ? prev.map(cumple => String(cumple.id) === String(item.id) ? item : cumple) : [...prev, item]);
    setCumpleForm({ nombre:"", fecha:"", relacion:"", presupuestoRegalo:"", notas:"" });
  };

  const eliminarCumpleanos = (id) => setCumpleanos?.(prev => prev.filter(cumple => String(cumple.id) !== String(id)));

  const guardarBloqueo = () => {
    const item = {
      ...modalBloqueo,
      id:modalBloqueo.id || Date.now(),
      importe:Number(modalBloqueo.importe || 0),
      horaInicio:modalBloqueo.tipo === "coche" ? modalBloqueo.horaInicio || "" : "",
      horaFin:modalBloqueo.tipo === "coche" ? modalBloqueo.horaFin || "" : "",
    };
    setBloqueos(prev => item.id && prev.find(b => b.id === item.id) ? prev.map(b => b.id === item.id ? item : b) : [...prev, item]);
    setModalBloqueo(null);
  };

  const eliminarBloqueo = (id) => {
    setBloqueos(prev => prev.filter(b => b.id !== id));
    setModalBloqueo(null);
  };

  return (
    <div style={{ display:"grid", gridTemplateColumns:layoutColumns, gap:isMobile?12:16, alignItems:"start", minWidth:0 }}>

      {/* ── COLUMNA PRINCIPAL ── */}
      <div style={{ minWidth:0 }}>
        {/* Controles */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", gap:4, background:C.fondo, borderRadius:10, padding:3, border:`1px solid ${C.borde}` }}>
            {["mensual","semanal"].map(v => (
              <button key={v} onClick={() => setVista(v)}
                style={{ background:vista===v?C.cyan:"transparent", color:vista===v?"white":C.txt2, border:"none", borderRadius:8, padding:"6px 16px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif", transition:"all 0.15s" }}>
                {v === "mensual" ? `📅 ${t("Month")}` : `📋 ${t("Week")}`}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, width:isMobile?"100%":"auto", justifyContent:isMobile?"space-between":"flex-start" }}>
            <button onClick={() => vista === "mensual" ? navMes(-1) : navSemana(-1)}
              style={{ background:C.superficie, border:`1px solid ${C.borde}`, borderRadius:9, width:32, height:32, cursor:"pointer", fontSize:16, color:C.cyan, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
            <span style={{ fontSize:isMobile?13:15, fontWeight:700, color:C.txt, minWidth:isMobile?150:190, textAlign:"center" }}>
              {vista === "mensual" ? `${monthName(mes)} ${año}` : labelSem}
            </span>
            <button onClick={() => vista === "mensual" ? navMes(1) : navSemana(1)}
              style={{ background:C.superficie, border:`1px solid ${C.borde}`, borderRadius:9, width:32, height:32, cursor:"pointer", fontSize:16, color:C.cyan, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
          </div>
          <button onClick={() => setModal({ type:"evento", fecha:todayISO })}
            style={{ background:C.cyan, color:"white", border:"none", borderRadius:10, padding:"8px 16px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
            {t("Add event")}
          </button>
        </div>

        {/* Leyenda + bloqueos */}
        <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
          <button onClick={() => setModalBloqueo({ tipo:"habitacion" })}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:9, background:C.sageLight, border:`1px solid ${C.sage}`, fontSize:11, fontWeight:700, color:C.sageDark, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
            🛏️ {t("Block room")}
          </button>
          <button onClick={() => setModalBloqueo({ tipo:"coche" })}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:9, background:"#fef3c7", border:"1px solid #fcd34d", fontSize:11, fontWeight:700, color:"#b45309", cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
            🚗 {t("Block car")}
          </button>
          <div style={{ marginLeft:isMobile?0:"auto", display:"flex", gap:10, fontSize:11, color:C.txt2, flexWrap:"wrap" }}>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, borderRadius:"50%", background:C.lavender, display:"inline-block" }}/> Sofi</span>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, borderRadius:"50%", background:C.cyan, display:"inline-block" }}/> Marqui</span>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, background:C.cyanMid, display:"inline-block", borderRadius:2 }}/> {t("Trip")}</span>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, background:"repeating-linear-gradient(45deg,#ecfdf5,#ecfdf5 3px,#d1fae5 3px,#d1fae5 6px)", display:"inline-block", border:`1px solid ${C.sage}`, borderRadius:2 }}/> {t("Occupied")}</span>
          </div>
        </div>

        {/* Calendario */}
        <div style={{ ...cardN(isMobile ? { padding:"12px 10px", overflowX:"auto" } : undefined) }}>
          {vista === "mensual"
            ? <CalMensual año={año} mes={mes} eventos={eventos} viajes={viajes} bloqueos={bloqueos} cumpleanos={cumpleanos} onDia={f => setModal({ type:"evento", fecha:f })} onEvento={ev => setModal({ type:"evento", item:ev })} onViaje={v => setModal({ type:"viaje", item:v })} onBloqueo={setModalBloqueo}/>
            : <CalSemanal inicio={inicio} eventos={eventos} viajes={viajes} bloqueos={bloqueos} cumpleanos={cumpleanos} onDia={f => setModal({ type:"evento", fecha:f })} onEvento={ev => setModal({ type:"evento", item:ev })} onViaje={v => setModal({ type:"viaje", item:v })} onBloqueo={setModalBloqueo}/>
          }
        </div>

        {/* Modal bloqueo */}
        {modalBloqueo && (
          <div onClick={e => e.target === e.currentTarget && setModalBloqueo(null)}
            style={{ position:"fixed", inset:0, background:"rgba(17,20,24,0.55)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
            <div style={{ background:C.superficie, borderRadius:20, padding:24, width:"100%", maxWidth:360, boxShadow:"0 24px 60px rgba(0,0,0,0.2)", border:`1px solid ${C.borde}` }}>
              <div style={{ fontSize:17, fontWeight:700, color:C.txt, marginBottom:16 }}>
                {modalBloqueo.tipo === "habitacion" ? `🛏️ ${t("Block room")}` : `🚗 ${t("Block car")}`}
              </div>
              <div style={{ display:"grid", gap:10 }}>
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>{t("From")}</label>
                  <input type="date" value={modalBloqueo.inicio || ""} onChange={e => setModalBloqueo(m => ({ ...m, inicio:e.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                </div>
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>{t("To")}</label>
                  <input type="date" value={modalBloqueo.fin || ""} onChange={e => setModalBloqueo(m => ({ ...m, fin:e.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                </div>
                {modalBloqueo.tipo === "coche" && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <div>
                      <label style={{ ...labelS, color:C.txt2 }}>{t("Start time")}</label>
                      <input type="time" value={modalBloqueo.horaInicio || ""} onChange={e => setModalBloqueo(m => ({ ...m, horaInicio:e.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                    </div>
                    <div>
                      <label style={{ ...labelS, color:C.txt2 }}>{t("End time")}</label>
                      <input type="time" value={modalBloqueo.horaFin || ""} onChange={e => setModalBloqueo(m => ({ ...m, horaFin:e.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                    </div>
                  </div>
                )}
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>{t("Note")}</label>
                  <input value={modalBloqueo.nota || ""} onChange={e => setModalBloqueo(m => ({ ...m, nota:e.target.value }))} placeholder={t("Guests, reason...")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                </div>
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>{t("Amount (€)")}</label>
                  <input type="number" step="0.01" min="0" value={modalBloqueo.importe || ""} onChange={e => setModalBloqueo(m => ({ ...m, importe:+e.target.value }))} placeholder="0.00" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                </div>
                {modalBloqueo.inicio && modalBloqueo.fin && (
                  <div style={{ background:C.sageLight, borderRadius:9, padding:"9px 12px", fontSize:12, color:C.sageDark, fontWeight:600, border:`1px solid ${C.sage}44` }}>
                    📅 {daysBetween(modalBloqueo.inicio, modalBloqueo.fin)} {modalBloqueo.tipo === "coche" ? t("Days") : t(daysBetween(modalBloqueo.inicio, modalBloqueo.fin) !== 1 ? "nights" : "night")}
                    {modalBloqueo.tipo === "coche" && (modalBloqueo.horaInicio || modalBloqueo.horaFin) && <> · ⏰ {modalBloqueo.horaInicio || "--:--"} - {modalBloqueo.horaFin || "--:--"}</>}
                    {Number(modalBloqueo.importe || 0) > 0 && <> · +{fmtd(Number(modalBloqueo.importe || 0))}</>}
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

      {/* ── PANEL LATERAL ── */}
      <div style={{ display:"grid", gap:10, position:isMobile || isTablet ? "static":"sticky", top:70 }}>
        <div style={{ background:"#111418", borderRadius:16, padding:"16px 18px", color:"white" }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.48)", textTransform:"uppercase", letterSpacing:"0.8px" }}>{labelMes(pref)}</div>
          <div style={{ fontSize:27, fontWeight:700, color:C.exito, marginTop:4, fontFamily:"'Playfair Display',serif" }}>{fmtd(totalGastosMes)}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.42)", marginTop:3 }}>{t("Expenses by category and funding")}</div>
        </div>

        <div style={cardN()}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8, marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.6px" }}>{t("By category")}</div>
            <div style={{ fontSize:11, color:C.txt2 }}>{gastosPorOrigen.length} {t("records")}</div>
          </div>
          {gastosPorOrigen.length === 0 && <div style={{ fontSize:12, color:C.txt2 }}>{t("No calendar expenses")}</div>}
          {gastosPorOrigen.map(row => {
            const category = CATEGORIAS[row.categoryKey] || CATEGORIAS.otro;
            return (
              <div key={`${row.categoryKey}-${row.fundingSource}`} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:8, fontSize:12, marginBottom:4, alignItems:"center" }}>
                  <span style={{ minWidth:0, color:category.color, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{category.emoji} {t(category.label)}</span>
                  <span style={{ flexShrink:0, fontWeight:700, color:C.txt }}>{fmtd(row.sum)}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", gap:8, alignItems:"center", marginBottom:5 }}>
                  <span style={{ fontSize:10, color:fundingColor(row.fundingSource), background:fundingBg(row.fundingSource), border:`1px solid ${fundingColor(row.fundingSource)}33`, borderRadius:999, padding:"2px 7px", fontWeight:700 }}>{t(fundingLabel(row.fundingSource))}</span>
                  <span style={{ fontSize:10, color:C.txt2 }}>{row.count} {row.count === 1 ? t("record") : t("records")}</span>
                </div>
                <div style={{ height:5, background:C.borde, borderRadius:5, overflow:"hidden" }}>
                  <div style={{ width:`${Math.min(100, (row.sum / maxGastoOrigen) * 100)}%`, height:"100%", background:category.color, borderRadius:5 }}/>
                </div>
              </div>
            );
          })}
        </div>

        <div style={cardN()}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10, gap:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.6px" }}>{t("Birthdays")}</div>
            <div style={{ fontSize:11, color:C.txt2 }}>{cumpleanos.length} {t("saved")}</div>
          </div>
          {proximosCumpleanos.length === 0 && <div style={{ fontSize:12, color:C.txt2, marginBottom:10 }}>{t("No birthdays saved")}</div>}
          {proximosCumpleanos.map(cumple => (
            <div key={cumple.id || `${cumple.nombre}-${cumple.fecha}`} style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:8, alignItems:"center", borderBottom:`1px solid ${C.borde}`, paddingBottom:8, marginBottom:8 }}>
              <button onClick={() => setCumpleForm({ ...cumple, presupuestoRegalo:cumple.presupuestoRegalo || "" })} style={{ border:"none", background:"transparent", textAlign:"left", padding:0, cursor:"pointer", fontFamily:"'Lato',sans-serif", minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.txt, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>🎂 {cumple.nombre}</div>
                <div style={{ fontSize:10, color:C.txt2, marginTop:2 }}>{formatBirthday(cumple.proximo)} · {daysUntil(cumple.proximo, hoy)} {t("days")}{Number(cumple.presupuestoRegalo || 0) > 0 ? ` · ${fmtd(Number(cumple.presupuestoRegalo || 0))}` : ""}</div>
              </button>
              <button onClick={() => eliminarCumpleanos(cumple.id)} style={{ width:28, height:28, minHeight:28, borderRadius:8, border:`1px solid ${C.error}33`, background:C.errorBg, color:C.error, cursor:"pointer" }}>×</button>
            </div>
          ))}
          <div style={{ display:"grid", gap:7 }}>
            <input value={cumpleForm.nombre} onChange={e => setCumpleForm(f => ({ ...f, nombre:e.target.value }))} placeholder={t("Name")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}`, minHeight:34 }}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 84px", gap:7 }}>
              <input type="date" value={cumpleForm.fecha || ""} onChange={e => setCumpleForm(f => ({ ...f, fecha:e.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}`, minHeight:34 }}/>
              <input type="number" min="0" step="1" value={cumpleForm.presupuestoRegalo || ""} onChange={e => setCumpleForm(f => ({ ...f, presupuestoRegalo:e.target.value }))} placeholder="€" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}`, minHeight:34 }}/>
            </div>
            <button onClick={guardarCumpleanos} disabled={!cumpleForm.nombre.trim() || !cumpleForm.fecha} style={{ background:C.cyan, color:"white", border:"none", borderRadius:10, padding:"8px 10px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif", opacity:!cumpleForm.nombre.trim() || !cumpleForm.fecha ? 0.55 : 1 }}>{cumpleForm.id ? t("Save changes") : t("Add birthday")}</button>
          </div>
        </div>

        <div style={cardN()}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10, gap:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.6px" }}>{t("Supermarket purchases")}</div>
            <div style={{ fontSize:11, color:C.txt2 }}>{fmtd(totalSuperMes)}</div>
          </div>
          <div style={{ display:"grid", gap:7 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 80px", gap:7 }}>
              <input type="date" value={compraSuper.fecha || ""} onChange={e => setCompraSuper(f => ({ ...f, fecha:e.target.value, mesPrimerCargo:(f.origenFondos || FUNDING_SOURCES.MONTH_INCOME) === FUNDING_SOURCES.MONTH_INCOME ? "" : estimateCreditCardFirstChargeMonth({ ...f, fecha:e.target.value }) }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}`, minHeight:34 }}/>
              <input type="number" min="0" step="0.01" value={compraSuper.importe || ""} onChange={e => setCompraSuper(f => ({ ...f, importe:e.target.value }))} placeholder="Total" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}`, minHeight:34 }}/>
            </div>
            <input value={compraSuper.comercio || ""} onChange={e => setCompraSuper(f => ({ ...f, comercio:e.target.value }))} placeholder={t("Store")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}`, minHeight:34 }}/>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:5 }}>
              {[FUNDING_SOURCES.MONTH_INCOME, FUNDING_SOURCES.CREDIT_NEXT_MONTH, FUNDING_SOURCES.CREDIT_INSTALLMENTS].map(source => (
                <button key={source} onClick={() => setOrigenCompraSuper(source)} style={{ minHeight:34, borderRadius:9, border:`1px solid ${(compraSuper.origenFondos || FUNDING_SOURCES.MONTH_INCOME) === source ? fundingColor(source) : C.borde}`, background:(compraSuper.origenFondos || FUNDING_SOURCES.MONTH_INCOME) === source ? fundingBg(source) : C.fondo, color:(compraSuper.origenFondos || FUNDING_SOURCES.MONTH_INCOME) === source ? fundingColor(source) : C.txt2, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif", lineHeight:1.1 }}>{t(fundingLabel(source))}</button>
              ))}
            </div>
            {compraSuper.origenFondos !== FUNDING_SOURCES.MONTH_INCOME && (
              <div style={{ display:"grid", gridTemplateColumns:compraSuper.origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? "1fr 72px" : "1fr", gap:7 }}>
                <input type="month" value={compraSuperMesCargo} onChange={e => setCompraSuper(f => ({ ...f, mesPrimerCargo:e.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}`, minHeight:34 }}/>
                {compraSuper.origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS && (
                  <input type="number" min="2" value={compraSuper.cuotasTarjeta || 2} onChange={e => setCompraSuper(f => ({ ...f, cuotasTarjeta:e.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}`, minHeight:34 }}/>
                )}
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 48px 64px", gap:5 }}>
              <input value={lineaSuper.producto} onChange={e => setLineaSuper(f => ({ ...f, producto:e.target.value }))} placeholder={t("Product")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}`, minHeight:34 }}/>
              <input type="number" min="0" step="0.1" value={lineaSuper.cantidad} onChange={e => setLineaSuper(f => ({ ...f, cantidad:e.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}`, minHeight:34 }}/>
              <input type="number" min="0" step="0.01" value={lineaSuper.importe} onChange={e => setLineaSuper(f => ({ ...f, importe:e.target.value }))} placeholder="€" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}`, minHeight:34 }}/>
            </div>
            <button onClick={agregarLineaSuper} style={{ background:C.fondo, color:C.cyan, border:`1px solid ${C.cyan}44`, borderRadius:10, padding:"7px 10px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>{t("Add product")}</button>
            {(compraSuper.lineas || []).length > 0 && (
              <div style={{ display:"grid", gap:5, maxHeight:120, overflowY:"auto" }}>
                {compraSuper.lineas.map((linea, index) => (
                  <div key={`${linea.producto}-${index}`} style={{ display:"flex", justifyContent:"space-between", gap:8, fontSize:11, color:C.txt2, background:C.fondo, borderRadius:8, padding:"5px 7px" }}>
                    <span style={{ minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{linea.producto} · {linea.cantidad}</span>
                    <span style={{ flexShrink:0, fontWeight:700, color:C.txt }}>{fmtd(Number(linea.importe || 0))}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={guardarCompraSuper} disabled={!compraSuper.fecha || compraSuperTotal <= 0} style={{ background:C.cyan, color:"white", border:"none", borderRadius:10, padding:"9px 10px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif", opacity:!compraSuper.fecha || compraSuperTotal <= 0 ? 0.55 : 1 }}>{t("Save supermarket purchase")} · {fmtd(compraSuperTotal)}</button>
          </div>
          {comprasSuperMes.length > 0 && (
            <div style={{ marginTop:12, borderTop:`1px solid ${C.borde}`, paddingTop:9 }}>
              <div style={{ fontSize:10, color:C.txt2, marginBottom:6 }}>{productosSuperMes} {t("products tracked")}</div>
              {comprasSuperMes.slice(0, 3).map(compra => (
                <div key={compra.id} style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:8, alignItems:"center", fontSize:11, marginTop:6 }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ color:C.txt, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{compra.comercio || t("Supermarket")} · {fmtd(Number(compra.importe || 0))}</div>
                    <div style={{ color:C.txt2 }}>{compra.fecha} · {t(fundingLabel(compra.origenFondos || FUNDING_SOURCES.MONTH_INCOME))}</div>
                  </div>
                  <button onClick={() => onDeleteSuperPurchase?.(compra.id)} style={{ width:28, height:28, minHeight:28, borderRadius:8, border:`1px solid ${C.error}33`, background:C.errorBg, color:C.error, cursor:"pointer" }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const fundingLabel = (source) => {
  if (source === FUNDING_SOURCES.CREDIT_NEXT_MONTH) return "Credit card next month";
  if (source === FUNDING_SOURCES.CREDIT_INSTALLMENTS) return "Credit card installments";
  return "Monthly income";
};

const fundingColor = (source) => {
  if (source === FUNDING_SOURCES.CREDIT_NEXT_MONTH) return C.warn;
  if (source === FUNDING_SOURCES.CREDIT_INSTALLMENTS) return C.lavender;
  return C.sageDark;
};

const fundingBg = (source) => {
  if (source === FUNDING_SOURCES.CREDIT_NEXT_MONTH) return C.warnBg;
  if (source === FUNDING_SOURCES.CREDIT_INSTALLMENTS) return C.lavLight;
  return C.exitoBg;
};

const nextBirthdayDate = (fecha, now = new Date()) => {
  if (!fecha || fecha.length < 10) return null;
  const month = Number(fecha.slice(5, 7));
  const day = Number(fecha.slice(8, 10));
  if (!month || !day) return null;
  const next = new Date(now.getFullYear(), month - 1, day);
  next.setHours(0, 0, 0, 0);
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  if (next < today) next.setFullYear(next.getFullYear() + 1);
  return next;
};

const daysUntil = (target, now = new Date()) => {
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const date = new Date(target); date.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((date.getTime() - today.getTime()) / 86400000));
};

const formatBirthday = (date) => `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
