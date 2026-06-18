import { useMemo, useState } from "react";
import { FUNDING_SOURCES, calculateExpenseCashImpactForMonth } from "@sofi-marqui/domain";
import Modal from "../../components/Modal.tsx";
import { CATEGORIAS, SUMINISTROS_TIPOS, COLOR_VIAJE, BG_VIAJE, categoriaEvento, categoriaEventoKey } from "../../constants/categorias.ts";
import { C, cardN, inputS, labelS } from "../../constants/colores.ts";
import { MESES } from "../../constants/meses.ts";
import { fmt, fmtd } from "../../utils/format.ts";
import { addMeses } from "../../utils/dates.ts";
import { BASE } from "../../data/demo.ts";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useI18n } from "../../i18n.tsx";

const UNIDADES_SUMINISTRO = { luz:"kWh", gas:"m3", agua:"m3" };
const FRECUENCIAS_FACTURA = ["mensual", "bimestral", "trimestral", "anual", "puntual"];
const etiquetasFrecuencia = { mensual:"Monthly", bimestral:"Bimonthly", trimestral:"Quarterly", anual:"Annual", puntual:"One-off" };

export default function SeccionGastosVariables({ base = BASE, setModal, eventos, viajes, proyectos = [], año, mesActual, mesSeleccionado, setMesSeleccionado, suministros, setSuministros, gastosVariables = [], setGastosVariables }) {
  const { t, monthName } = useI18n();
  const [mesIdxLocal, setMesIdxLocal] = useState(mesActual);
  const [modalSuministro, setModalSuministro] = useState(null);
  const [modalGasto, setModalGasto] = useState(null);
  const { isMobile, isTablet } = useBreakpoint();

  const mesIdx = mesSeleccionado ?? mesIdxLocal;
  const setMesIdx = setMesSeleccionado ?? setMesIdxLocal;

  const pref        = `${año}-${String(mesIdx + 1).padStart(2, "0")}`;
  const prefAnterior = mesIdx > 0 ? `${año}-${String(mesIdx).padStart(2, "0")}` : `${año - 1}-12`;
  const fixedCostForMonth = base.monthlyOverrides?.[pref]?.fixedExpenses ?? base.gastos_fijos;

  // Suministros del mes
  const suministrosPorClave = useMemo(() => {
    const index = new Map();
    suministros.forEach(s => index.set(`${s.mes}:${s.tipo}`, s));
    return index;
  }, [suministros]);

  const suministrosMes = SUMINISTROS_TIPOS.map(t => {
    const reg = suministrosPorClave.get(`${pref}:${t.key}`);
    return { ...t, ...reg, key:t.key, label:t.label, emoji:t.emoji, mes:pref, tipo:t.key, importe:reg?.importe ?? 0, notas:reg?.notas ?? "" };
  });
  const totalSuministros = suministrosMes.reduce((a, s) => a + (+s.importe || 0), 0);

  const suministrosAnt = SUMINISTROS_TIPOS.map(t => {
    const reg = suministrosPorClave.get(`${prefAnterior}:${t.key}`);
    return { ...t, importe: reg?.importe ?? null };
  });

  const abrirSuministro = (suministro) => setModalSuministro({
    id:suministro.id,
    mes:pref,
    tipo:suministro.key,
    label:suministro.label,
    emoji:suministro.emoji,
    importe:suministro.importe || "",
    proveedor:suministro.proveedor || "",
    frecuencia:suministro.frecuencia || "mensual",
    consumo:suministro.consumo ?? "",
    unidad:suministro.unidad || UNIDADES_SUMINISTRO[suministro.key] || "",
    periodoInicio:suministro.periodoInicio || "",
    periodoFin:suministro.periodoFin || "",
    notas:suministro.notas || "",
  });

  const guardarSuministro = (draft) => {
    const item = {
      id:draft.id || Date.now()+Math.random(),
      mes:pref,
      tipo:draft.tipo,
      importe:Number(draft.importe || 0),
      proveedor:draft.proveedor || "",
      frecuencia:draft.frecuencia || "",
      consumo:draft.consumo === "" || draft.consumo === null || draft.consumo === undefined ? undefined : Number(draft.consumo || 0),
      unidad:draft.unidad || "",
      periodoInicio:draft.periodoInicio || "",
      periodoFin:draft.periodoFin || "",
      notas:draft.notas || "",
    };

    setSuministros(prev => {
      const exist = prev.find(s => s.mes === pref && s.tipo === item.tipo);
      if (exist) return prev.map(s => s.mes===pref && s.tipo===item.tipo ? item : s);
      return [...prev, item];
    });
    setModalSuministro(null);
  };

  const resumenSuministro = (s) => [
    s.consumo ? `${s.consumo} ${s.unidad || UNIDADES_SUMINISTRO[s.key] || ""}`.trim() : "",
    s.frecuencia ? t(etiquetasFrecuencia[s.frecuencia] || s.frecuencia) : "",
    s.proveedor || "",
  ].filter(Boolean).join(" · ");

  // Gastos calendario del mes
  const evMes       = useMemo(() => eventos.filter(e => categoriaEvento(e)?.tipo === "gasto" && calculateExpenseCashImpactForMonth(e, pref) > 0), [eventos, pref]);
  const lineasMes   = useMemo(() => gastosVariables.filter(g => calculateExpenseCashImpactForMonth(g, pref) > 0), [gastosVariables, pref]);
  const tareasCasaMes = useMemo(() => proyectos.filter(p => p.estado === "completado" && p.fin?.startsWith(pref)), [proyectos, pref]);
  const viajesMes   = useMemo(() => viajes.filter(v => v.inicio?.startsWith(pref) || v.fin?.startsWith(pref)), [viajes, pref]);
  const gastoViajeMes = viajesMes.reduce((a, v) => a + Object.values(v.gastos || {}).reduce<number>((x, y) => x + Number(y || 0), 0), 0);

  const catsCal = Object.entries(CATEGORIAS)
    .filter(([, v]) => v.tipo === "gasto")
    .map(([k, v]) => ({ key:k, ...v, sum:evMes.filter(e => categoriaEventoKey(e)===k).reduce((a, e) => a+calculateExpenseCashImpactForMonth(e, pref), 0) + lineasMes.filter(g => g.categoria===k).reduce((a, g) => a+calculateExpenseCashImpactForMonth(g, pref), 0) + (k === "hogar" ? tareasCasaMes.reduce((a, p) => a+Number(p.gasto||0), 0) : 0) }))
    .filter(c => c.sum > 0)
    .sort((a, b) => b.sum - a.sum);
  const totalCalendario = catsCal.reduce((a, c) => a + c.sum, 0);
  const totalMes        = totalSuministros + totalCalendario + gastoViajeMes;
  const editableDiscretionaryItems = useMemo(() => [
    ...evMes.map(evento => ({
      key:`evento-${evento.id}`,
      label:evento.titulo,
      amount:calculateExpenseCashImpactForMonth(evento, pref),
      source:t("Calendar"),
      onEdit:() => setModal?.({ type:"evento", item:evento }),
    })),
    ...lineasMes.map(gasto => ({
      key:`gasto-${gasto.id}`,
      label:gasto.titulo,
      amount:calculateExpenseCashImpactForMonth(gasto, pref),
      source:t("Variable expense"),
      onEdit:() => setModalGasto(gasto),
    })),
  ], [evMes, lineasMes, pref, setModal, t]);
  const sectionColumns = isMobile ? "1fr" : isTablet ? "repeat(2,minmax(0,1fr))" : "repeat(4,minmax(0,1fr))";
  const guardarGastoVariable = (gasto) => {
    const origenFondos = gasto.origenFondos || FUNDING_SOURCES.MONTH_INCOME;
    const item = {
      ...gasto,
      id:gasto.id || Date.now(),
      mes:pref,
      importe:Number(gasto.importe || 0),
      origenFondos,
      cuotasTarjeta:origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? Math.max(1, Number(gasto.cuotasTarjeta || 1)) : 1,
      mesPrimerCargo:origenFondos === FUNDING_SOURCES.MONTH_INCOME ? "" : (gasto.mesPrimerCargo || addMeses(pref, 1)),
    };
    setGastosVariables(prev => item.id && prev.find(g => g.id === item.id) ? prev.map(g => g.id === item.id ? item : g) : [...prev, item]);
    setModalGasto(null);
  };
  const eliminarGastoVariable = (id) => {
    setGastosVariables(prev => prev.filter(g => g.id !== id));
    setModalGasto(null);
  };

  const modalOrigenFondos = modalGasto?.origenFondos || FUNDING_SOURCES.MONTH_INCOME;
  const modalMesCargo = modalGasto?.mesPrimerCargo || addMeses(pref, 1);
  const modalCuotasTarjeta = Math.max(1, Number(modalGasto?.cuotasTarjeta || 1));
  const modalCuotaTarjeta = Number(modalGasto?.importe || 0) / modalCuotasTarjeta;
  const opcionesFondos = [
    { key:FUNDING_SOURCES.MONTH_INCOME, label:t("Monthly income") },
    { key:FUNDING_SOURCES.CREDIT_NEXT_MONTH, label:t("Credit card next month") },
    { key:FUNDING_SOURCES.CREDIT_INSTALLMENTS, label:t("Credit card installments") },
  ];
  const setOrigenGasto = (value) => setModalGasto(g => ({
    ...g,
    origenFondos:value,
    cuotasTarjeta:value === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? Math.max(2, Number(g.cuotasTarjeta || 2)) : 1,
    mesPrimerCargo:value === FUNDING_SOURCES.MONTH_INCOME ? "" : (g.mesPrimerCargo || addMeses(pref, 1)),
  }));

  // Helpers de layout
  const colHeader = (color, bg, border, dot, label) => (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, padding:"8px 12px", background:bg, borderRadius:10, border:`1px solid ${border}` }}>
      <div style={{ width:10, height:10, borderRadius:"50%", background:dot, flexShrink:0 }}/>
      <span style={{ fontSize:12, fontWeight:700, color, textTransform:"uppercase", letterSpacing:"0.6px" }}>{label}</span>
    </div>
  );

  const rowItem = (left, right, bg=C.fondo, color=C.txt, colorR=C.txt) => (
    <div key={typeof left === "string" ? left : undefined} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13, padding:"8px 12px", background:bg, borderRadius:9, border:`1px solid ${C.borde}` }}>
      <span style={{ color }}>{left}</span>
      <span style={{ fontWeight:700, color:colorR }}>{right}</span>
    </div>
  );

  const rowTotal = (label, value, bg, color) => (
    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"9px 12px", background:bg, borderRadius:9, color, marginTop:2 }}>
      <span style={{ fontWeight:700 }}>{label}</span>
      <span style={{ fontWeight:700 }}>{fmt(value)}</span>
    </div>
  );

  return (
    <div style={cardN(isMobile ? { padding:"14px 12px" } : undefined)}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:C.txt }}>{t("Monthly variable expenses")}</div>
          <div style={{ fontSize:12, color:C.txt2, marginTop:2 }}>
            {t("Utilities · Discretionary · Trips")}
            {totalMes > 0 && <strong style={{ color:C.txt, marginLeft:8 }}>→ {fmt(totalMes)} {t("this month")}</strong>}
          </div>
        </div>
        {/* Selector de mes */}
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <button onClick={() => setModalGasto({ mes:pref, titulo:"", categoria:"otro", importe:"", origenFondos:FUNDING_SOURCES.MONTH_INCOME, cuotasTarjeta:1, mesPrimerCargo:"", notas:"" })}
            style={{ background:C.cyan, color:"white", border:"none", borderRadius:9, padding:"7px 12px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif", whiteSpace:"nowrap" }}>
            + {t("Variable expense")}
          </button>
          <button onClick={() => setMesIdx(i => Math.max(0, i-1))}
            style={{ background:C.fondo, border:`1px solid ${C.borde}`, borderRadius:8, width:28, height:28, cursor:"pointer", fontSize:14, color:C.txt2, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Lato',sans-serif" }}>‹</button>
          <span style={{ fontSize:13, fontWeight:700, color:C.txt, minWidth:100, textAlign:"center" }}>{monthName(mesIdx)} {año}</span>
          <button onClick={() => setMesIdx(i => Math.min(11, i+1))}
            style={{ background:C.fondo, border:`1px solid ${C.borde}`, borderRadius:8, width:28, height:28, cursor:"pointer", fontSize:14, color:C.txt2, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Lato',sans-serif" }}>›</button>
        </div>
      </div>

      {/* 4 columnas */}
      <div style={{ display:"grid", gridTemplateColumns:sectionColumns, gap:isMobile?12:16, marginTop:16 }}>

        {/* COL 0: Gastos fijos */}
        <div>
          {colHeader("#64748b","#f1f5f9","#64748b33","#64748b",`🏠 ${t("Fixed costs")}`)}
          <div style={{ display:"grid", gap:5 }}>
            {(base.detalle_fijos || []).map(d => rowItem(d.nombre, fmt(d.importe), C.fondo, C.txt2, "#64748b"))}
            {rowTotal(t("Monthly total"), fixedCostForMonth, "#64748b", "white")}
          </div>
        </div>

        {/* COL 1: Suministros */}
        <div>
          {colHeader("#d97706","#fef3c7","#d9770633","#d97706",`💡 ${t("Utilities")}`)}
          <div style={{ display:"grid", gap:5 }}>
            {suministrosMes.map((s, i) => {
              const ant    = suministrosAnt[i];
              const diff   = ant.importe !== null && s.importe > 0 ? s.importe - ant.importe : null;
              const resumen = resumenSuministro(s);
              return (
                <div key={s.key}
                  style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, fontSize:13, padding:"8px 12px", background:s.importe>0?"#fef3c7":C.fondo, borderRadius:9, border:`1px solid ${s.importe>0?"#d9770633":C.borde}`, transition:"all 0.15s" }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:4 }}>
                      <span style={{ color:s.importe>0?"#d97706":C.txt2 }}>{s.emoji} {t(s.label)}</span>
                      {diff !== null && (
                        <span style={{ fontSize:9, marginLeft:2, fontWeight:700, color:diff>0?C.error:C.sageDark }}>
                          {diff > 0 ? `▲+${fmt(diff)}` : diff < 0 ? `▼${fmt(diff)}` : ""}
                        </span>
                      )}
                    </div>
                    {resumen && <div style={{ fontSize:10, color:C.txt2, marginTop:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{resumen}</div>}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontWeight:700, color:s.importe>0?"#d97706":C.txt2 }}>{s.importe>0?fmt(s.importe):"—"}</span>
                    <button onClick={() => abrirSuministro(s)} aria-label={`${t("Edit utility bill")} ${t(s.label)}`}
                      style={{ width:24, height:24, borderRadius:7, border:`1px solid ${s.importe>0?"#d9770633":C.borde}`, background:"white", color:"#d97706", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, flexShrink:0 }}>
                      ✏️
                    </button>
                  </div>
                </div>
              );
            })}
            {rowTotal(`${t("Total")} ${monthName(mesIdx)}`, totalSuministros, "#d97706", "white")}
          </div>
        </div>

        {/* COL 2: Discrecional */}
        <div>
          {colHeader(C.lavender, C.lavLight, `${C.lavender}33`, C.lavender, `🗓️ ${t("Discretionary")}`)}
          <div style={{ display:"grid", gap:5 }}>
            {catsCal.length === 0
              ? <div style={{ textAlign:"center", padding:"20px 0", fontSize:12, color:C.txt2 }}>{t("No calendar expenses")}</div>
              : catsCal.map(c => (
                <div key={c.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13, padding:"8px 12px", background:c.bg, borderRadius:9, border:`1px solid ${c.color}33` }}>
                  <span style={{ color:c.color }}>{c.emoji} {t(c.label)}</span>
                  <span style={{ fontWeight:700, color:c.color }}>{fmt(c.sum)}</span>
                </div>
              ))
            }
            {rowTotal(`${t("Total")} ${monthName(mesIdx)}`, totalCalendario, C.lavender, "white")}
            {editableDiscretionaryItems.length > 0 && (
              <div style={{ display:"grid", gap:5, marginTop:4 }}>
                <div style={{ fontSize:10, fontWeight:700, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.5px" }}>{t("Editable records")}</div>
                {editableDiscretionaryItems.map(item => (
                  <div key={item.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, fontSize:12, padding:"7px 9px", background:"white", borderRadius:9, border:`1px solid ${C.borde}` }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ color:C.txt, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.label}</div>
                      <div style={{ fontSize:10, color:C.txt2 }}>{item.source} · {fmt(item.amount)}</div>
                    </div>
                    <button onClick={item.onEdit} aria-label={`${t("Edit")} ${item.label}`} style={{ width:25, height:25, borderRadius:7, border:`1px solid ${C.lavender}33`, background:C.lavLight, color:C.lavender, cursor:"pointer", flexShrink:0 }}>✏️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COL 3: Viajes */}
        <div>
          {colHeader(COLOR_VIAJE, BG_VIAJE, `${COLOR_VIAJE}33`, COLOR_VIAJE, `✈️ ${t("Trips")}`)}
          <div style={{ display:"grid", gap:5 }}>
            {viajesMes.length === 0
              ? <div style={{ textAlign:"center", padding:"20px 0", fontSize:12, color:C.txt2 }}>{t("No trips this month")}</div>
              : viajesMes.map(v => {
                const total = Object.values(v.gastos || {}).reduce<number>((x, y) => x + Number(y || 0), 0);
                return (
                  <div key={v.id} style={{ fontSize:13, padding:"8px 12px", background:BG_VIAJE, borderRadius:9, border:`1px solid ${COLOR_VIAJE}33` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                      <span style={{ color:COLOR_VIAJE, fontWeight:600, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.emoji||"✈️"} {v.nombre}</span>
                      <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                        <span style={{ fontWeight:700, color:COLOR_VIAJE }}>{fmt(total)}</span>
                        <button onClick={() => setModal?.({ type:"viaje", item:v })} aria-label={`${t("Edit trip")} ${v.nombre}`} style={{ width:24, height:24, borderRadius:7, border:`1px solid ${COLOR_VIAJE}33`, background:"white", color:COLOR_VIAJE, cursor:"pointer" }}>✏️</button>
                      </div>
                    </div>
                    {Object.entries(v.gastos || {}).filter(([, val]) => Number(val || 0) > 0).map(([k, val]) => (
                      <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.txt2, marginTop:3, paddingLeft:8 }}>
                        <span>{k}</span><span>{fmt(Number(val || 0))}</span>
                      </div>
                    ))}
                  </div>
                );
              })
            }
            {rowTotal(`${t("Total")} ${monthName(mesIdx)}`, gastoViajeMes, COLOR_VIAJE, "white")}
          </div>
        </div>

      </div>
      {modalSuministro && (() => {
        const importe = Number(modalSuministro.importe || 0);
        const consumo = Number(modalSuministro.consumo || 0);
        const precioUnidad = consumo > 0 ? importe / consumo : null;
        const modalColumns = isMobile ? "1fr" : "repeat(2,minmax(0,1fr))";

        return (
          <Modal onClose={() => setModalSuministro(null)} maxW={560}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <h3 style={{ fontSize:18, fontWeight:700, color:C.txt }}>{t("Edit utility bill")} · {modalSuministro.emoji} {t(modalSuministro.label)}</h3>
              <button onClick={() => setModalSuministro(null)} style={{ border:"none", background:C.fondo, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:15, color:C.txt2 }}>✕</button>
            </div>
            <div style={{ display:"grid", gap:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:modalColumns, gap:12 }}>
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>{t("Amount (€)")}</label>
                  <input type="number" step="0.01" min="0" value={modalSuministro.importe} onChange={e => setModalSuministro(s => ({ ...s, importe:e.target.value }))} placeholder="0.00" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                </div>
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>{t("Provider")}</label>
                  <input value={modalSuministro.proveedor || ""} onChange={e => setModalSuministro(s => ({ ...s, proveedor:e.target.value }))} placeholder={t("Provider name")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                </div>
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>{t("Billing frequency")}</label>
                  <select value={modalSuministro.frecuencia || "mensual"} onChange={e => setModalSuministro(s => ({ ...s, frecuencia:e.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}>
                    {FRECUENCIAS_FACTURA.map(f => <option key={f} value={f}>{t(etiquetasFrecuencia[f])}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>{t("Consumption")}</label>
                  <input type="number" step="0.01" min="0" value={modalSuministro.consumo} onChange={e => setModalSuministro(s => ({ ...s, consumo:e.target.value }))} placeholder="0" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                </div>
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>{t("Unit")}</label>
                  <input value={modalSuministro.unidad || ""} onChange={e => setModalSuministro(s => ({ ...s, unidad:e.target.value }))} placeholder={UNIDADES_SUMINISTRO[modalSuministro.tipo] || ""} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                </div>
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>{t("Billing period")}</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <input type="date" value={modalSuministro.periodoInicio || ""} onChange={e => setModalSuministro(s => ({ ...s, periodoInicio:e.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                    <input type="date" value={modalSuministro.periodoFin || ""} onChange={e => setModalSuministro(s => ({ ...s, periodoFin:e.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                  </div>
                </div>
              </div>
              <div>
                <label style={{ ...labelS, color:C.txt2 }}>{t("Notes")}</label>
                <textarea value={modalSuministro.notas || ""} onChange={e => setModalSuministro(s => ({ ...s, notas:e.target.value }))} placeholder={t("Details...")} style={{ ...inputS, minHeight:70, resize:"vertical", background:C.fondo, border:`1px solid ${C.borde}` }}/>
              </div>
              <div style={{ background:"#fef3c7", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#d97706", border:"1px solid #d9770644" }}>
                {t("Cash flow month")} {'->'} {monthName(mesIdx)} {año}
                {importe > 0 && <strong> · {fmtd(importe)}</strong>}
                {consumo > 0 && <span> · {consumo} {modalSuministro.unidad || UNIDADES_SUMINISTRO[modalSuministro.tipo] || ""}</span>}
                {precioUnidad !== null && modalSuministro.unidad && <span> · {precioUnidad.toFixed(2)} €/{modalSuministro.unidad}</span>}
              </div>
              <button onClick={() => guardarSuministro(modalSuministro)}
                style={{ background:"#d97706", color:"white", border:"none", borderRadius:12, padding:11, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
                {t("Save utility bill")}
              </button>
            </div>
          </Modal>
        );
      })()}
      {modalGasto && (
        <Modal onClose={() => setModalGasto(null)} maxW={420}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <h3 style={{ fontSize:18, fontWeight:700, color:C.txt }}>{modalGasto.id ? t("Edit expense") : t("Variable expense")}</h3>
            <button onClick={() => setModalGasto(null)} style={{ border:"none", background:C.fondo, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:15, color:C.txt2 }}>✕</button>
          </div>
          <div style={{ display:"grid", gap:14 }}>
            <div>
              <label style={{ ...labelS, color:C.txt2 }}>{t("Type")}</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {Object.entries(CATEGORIAS).filter(([k, v]) => v.tipo === "gasto" && k !== "viaje").map(([k, v]) => (
                  <button key={k} onClick={() => setModalGasto(g => ({ ...g, categoria:k }))}
                    style={{ padding:"5px 11px", borderRadius:20, fontSize:12, border:"none", cursor:"pointer", fontFamily:"'Lato',sans-serif", background:modalGasto.categoria===k?v.color:v.bg, color:modalGasto.categoria===k?"white":v.color, fontWeight:modalGasto.categoria===k?700:400 }}>
                    {v.emoji} {t(v.label)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ ...labelS, color:C.txt2 }}>{t("Description")}</label>
              <input value={modalGasto.titulo || ""} onChange={e => setModalGasto(g => ({ ...g, titulo:e.target.value }))} placeholder={t("What is it?")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
            </div>
            <div>
              <label style={{ ...labelS, color:C.txt2 }}>{t("Amount (€)")}</label>
              <input type="number" step="0.01" min="0" value={modalGasto.importe || ""} onChange={e => setModalGasto(g => ({ ...g, importe:+e.target.value }))} placeholder="0.00" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
            </div>
            <div style={{ display:"grid", gap:10 }}>
              <div>
                <label style={{ ...labelS, color:C.txt2 }}>{t("Funding source")}</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:6 }}>
                  {opcionesFondos.map(option => (
                    <button key={option.key} onClick={() => setOrigenGasto(option.key)}
                      style={{ minHeight:38, padding:"6px 8px", borderRadius:10, border:`1px solid ${modalOrigenFondos === option.key ? C.cyan : C.borde}`, background:modalOrigenFondos === option.key ? C.cyanLight : C.fondo, color:modalOrigenFondos === option.key ? C.cyan : C.txt2, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif", lineHeight:1.15 }}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              {modalOrigenFondos !== FUNDING_SOURCES.MONTH_INCOME && (
                <div style={{ display:"grid", gridTemplateColumns:modalOrigenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? "1fr 1fr" : "1fr", gap:10 }}>
                  <div>
                    <label style={{ ...labelS, color:C.txt2 }}>{modalOrigenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? t("First debit month") : t("Debit month")}</label>
                    <input type="month" value={modalMesCargo} onChange={e => setModalGasto(g => ({ ...g, mesPrimerCargo:e.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                  </div>
                  {modalOrigenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS && (
                    <div>
                      <label style={{ ...labelS, color:C.txt2 }}>{t("Installments")}</label>
                      <input type="number" min="1" step="1" value={modalCuotasTarjeta} onChange={e => setModalGasto(g => ({ ...g, cuotasTarjeta:+e.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label style={{ ...labelS, color:C.txt2 }}>{t("Notes")}</label>
              <input value={modalGasto.notas || ""} onChange={e => setModalGasto(g => ({ ...g, notas:e.target.value }))} placeholder={t("Details...")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
            </div>
            <div style={{ background:C.lavLight, borderRadius:10, padding:"10px 14px", fontSize:12, color:C.lavender, border:`1px solid ${C.lavender}44` }}>
              {t("Variable expense")} {'->'} {monthName(mesIdx)} {año}
              {Number(modalGasto.importe || 0) > 0 && <strong> · {fmtd(Number(modalGasto.importe || 0))}</strong>}
              {modalOrigenFondos !== FUNDING_SOURCES.MONTH_INCOME && <div style={{ marginTop:4, color:C.txt2 }}>{t(modalOrigenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? "Credit card installments" : "Credit card next month")} · {modalMesCargo}{modalOrigenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? ` · ${modalCuotasTarjeta} ${t("Installments").toLowerCase()} · ${fmtd(modalCuotaTarjeta)}/${t("month")}` : ""}</div>}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => guardarGastoVariable(modalGasto)} disabled={!modalGasto.titulo || Number(modalGasto.importe || 0) <= 0}
                style={{ flex:1, background:C.cyan, color:"white", border:"none", borderRadius:12, padding:11, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif", opacity:!modalGasto.titulo || Number(modalGasto.importe || 0) <= 0 ? 0.55 : 1 }}>
                {modalGasto.id ? t("Save changes") : t("Save expense")}
              </button>
              {modalGasto.id && (
                <button onClick={() => eliminarGastoVariable(modalGasto.id)}
                  style={{ background:C.errorBg, color:C.error, border:`1px solid ${C.error}44`, borderRadius:12, padding:"11px 16px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
                  🗑️ {t("Delete")}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
