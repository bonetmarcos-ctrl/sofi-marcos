import { useMemo, useState } from "react";
import { FUNDING_SOURCES, buildCreditCardDebtFromExpense, projectExpenseItem } from "@sofi-marqui/domain";
import { HABITACIONES, PRIORIDADES, ESTADOS } from "../../constants/habitaciones.ts";
import { C, card } from "../../constants/colores.ts";
import { fmt } from "../../utils/format.ts";
import { todayISO, toISO, daysBetween } from "../../utils/dates.ts";
import { MESES_CORTO } from "../../constants/meses.ts";
import { paymentMethodIcon, paymentMethodLabelKey } from "../../utils/paymentMethods.ts";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useI18n } from "../../i18n.tsx";
import ModalProyecto from "./ModalProyecto.tsx";

export default function TabGantt({ proyectos, setProyectos, setDeudas }) {
  const { t, monthName } = useI18n();
  const [modalP, setModalP]     = useState(null);
  const [filtroHab, setFiltroHab] = useState("todos");
  const [vista, setVista]       = useState("gantt");
  const { isMobile, isTablet } = useBreakpoint();

  const guardar  = (p) => {
    const expense = projectExpenseItem(p);
    const debt = buildCreditCardDebtFromExpense(expense, "proyectos");
    const item = debt ? { ...p, deudaTarjetaId:debt.id } : { ...p, deudaTarjetaId:"" };

    setDeudas?.(prev => {
      const withoutLinked = prev.filter(deuda => {
        if (p.deudaTarjetaId && String(deuda.id) === String(p.deudaTarjetaId)) return false;
        return !(deuda.origenColeccion === "proyectos" && String(deuda.origenId) === String(item.id));
      });
      return debt ? [...withoutLinked, debt] : withoutLinked;
    });
    setProyectos(prev => item.id && prev.find(x => x.id === item.id) ? prev.map(x => x.id === item.id ? item : x) : [...prev, item]);
    setModalP(null);
  };
  const eliminar = (id) => {
    setProyectos(prev => prev.filter(x => x.id !== id));
    setDeudas?.(prev => prev.filter(deuda => !(deuda.origenColeccion === "proyectos" && String(deuda.origenId) === String(id))));
    setModalP(null);
  };

  const lista  = useMemo(() => filtroHab === "todos" ? proyectos : proyectos.filter(p => p.habitacion === filtroHab), [filtroHab, proyectos]);
  const sorted = useMemo(() => [...lista].sort((a, b) => a.inicio?.localeCompare(b.inicio)), [lista]);

  // ── Rango de fechas para el Gantt ──
  const fechas      = useMemo(() => proyectos.flatMap(p => [p.inicio, p.fin]).filter(Boolean).sort(), [proyectos]);
  const ganttInicio = fechas[0] || todayISO;
  const ganttFin    = fechas[fechas.length - 1] || todayISO;
  const totalDias   = Math.max(30, daysBetween(ganttInicio, ganttFin) + 14);

  // Cabeceras de meses para el Gantt
  const mesesGantt = useMemo(() => {
    const months = [];
    const cur = new Date(ganttInicio + "T12:00:00");
    cur.setDate(1);
    const finDate = new Date(ganttFin + "T12:00:00");
    finDate.setMonth(finDate.getMonth() + 1);
    while (cur < finDate) {
      months.push({ label: `${monthName(cur.getMonth(), "short")} ${cur.getFullYear()}`, date: new Date(cur) });
      cur.setMonth(cur.getMonth() + 1);
    }
    return months;
  }, [ganttInicio, ganttFin, monthName]);

  const pctPos = (dateStr) => {
    if (!dateStr) return 0;
    const d     = new Date(dateStr + "T12:00:00");
    const start = new Date(ganttInicio + "T12:00:00");
    return Math.max(0, Math.min(100, ((d.getTime() - start.getTime()) / (totalDias * 86400000)) * 100));
  };

  // KPIs
  const totalPpto   = useMemo(() => proyectos.reduce((a, p) => a + p.presupuesto, 0), [proyectos]);
  const totalGastado = useMemo(() => proyectos.reduce((a, p) => a + p.gasto, 0), [proyectos]);
  const porEstado   = useMemo(() => Object.keys(ESTADOS).reduce<Record<string, number>>((acc, k) => ({ ...acc, [k]: proyectos.filter(p => p.estado === k).length }), {}), [proyectos]);
  const kpiColumns = isMobile ? "1fr" : isTablet ? "repeat(2,minmax(0,1fr))" : "repeat(4,minmax(0,1fr))";

  return (
    <div style={{ display:"grid", gap:16, minWidth:0 }}>

      {/* ── KPIs ── */}
      <div style={{ display:"grid", gridTemplateColumns:kpiColumns, gap:10 }}>
        {[
          { l:t("Total tasks"), v:proyectos.length,    sub:`${porEstado.completado||0} ${t("completed")}`,                       c:"#7c3aed" },
          { l:t("In progress"), v:porEstado.en_curso||0, sub:`${porEstado.pendiente||0} ${t("pending")}`,                       c:"#f59e0b" },
          { l:t("Budgeted"),  v:fmt(totalPpto),        sub:t("estimated"),                                              c:"#0891b2" },
          { l:t("Spent"),      v:fmt(totalGastado),     sub:totalPpto>0?`${((totalGastado/totalPpto)*100).toFixed(0)}% ${t("of")}`:"", c:totalGastado>totalPpto?"#ef4444":"#22c55e" },
        ].map(k => (
          <div key={k.l} style={{ ...card() }}>
            <div style={{ fontSize:11, fontWeight:700, color:k.c, textTransform:"uppercase", letterSpacing:"0.6px" }}>{k.l}</div>
            <div style={{ fontSize:22, fontWeight:700, color:k.c, fontFamily:"'Playfair Display',serif", marginTop:4 }}>{k.v}</div>
            <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Controles ── */}
      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:4 }}>
          {["gantt","lista"].map(v => (
            <button key={v} onClick={() => setVista(v)}
              style={{ background:vista===v?"#1a1a2e":"white", color:vista===v?"white":"#7c6f9e", border:`1px solid ${vista===v?"#1a1a2e":"#e2e0ed"}`, borderRadius:9, padding:"7px 14px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              {v === "gantt" ? "📊 Gantt" : `📋 ${t("List")}`}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          <button onClick={() => setFiltroHab("todos")}
            style={{ padding:"5px 12px", borderRadius:20, fontSize:11, border:"none", cursor:"pointer", background:filtroHab==="todos"?"#1a1a2e":"#f1f0f7", color:filtroHab==="todos"?"white":"#475569", fontFamily:"'Lato',sans-serif", fontWeight:600 }}>
            {t("All")}
          </button>
          {HABITACIONES.map(h => (
            <button key={h.id} onClick={() => setFiltroHab(h.id)}
              style={{ padding:"5px 12px", borderRadius:20, fontSize:11, border:"none", cursor:"pointer", background:filtroHab===h.id?h.color:"#f1f0f7", color:filtroHab===h.id?"white":"#475569", fontFamily:"'Lato',sans-serif", fontWeight:600 }}>
              {h.emoji} {t(h.label)}
            </button>
          ))}
        </div>
        <button onClick={() => setModalP({})}
          style={{ marginLeft:isMobile?0:"auto", width:isMobile?"100%":"auto", background:"#7c3aed", color:"white", border:"none", borderRadius:9, padding:"8px 16px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
          + {t("Task")}
        </button>
      </div>

      {/* ── VISTA GANTT ── */}
      {vista === "gantt" && (
        <div style={{ ...card(isMobile ? { padding:"12px 10px" } : undefined), overflowX:"auto" }}>
          <div style={{ minWidth:isMobile?620:700 }}>
            {/* Header meses */}
            <div style={{ display:"flex", marginBottom:8, borderBottom:"1px solid #ebe9f5", paddingBottom:8 }}>
              <div style={{ width:220, flexShrink:0, fontSize:11, fontWeight:700, color:"#7c6f9e", textTransform:"uppercase", letterSpacing:"0.6px" }}>{t("Task")}</div>
              <div style={{ flex:1, position:"relative", height:20 }}>
                {mesesGantt.map((m, i) => (
                  <div key={i} style={{ position:"absolute", left:`${pctPos(toISO(m.date))}%`, fontSize:10, fontWeight:700, color:"#7c6f9e", whiteSpace:"nowrap", transform:"translateX(-50%)" }}>
                    {m.label}
                  </div>
                ))}
                {/* Línea de hoy */}
                <div style={{ position:"absolute", left:`${pctPos(todayISO)}%`, top:-4, bottom:-8, width:2, background:"#ef4444", opacity:0.7 }}/>
              </div>
            </div>
            {/* Filas */}
            {sorted.map(p => {
              const hab = HABITACIONES.find(h => h.id === p.habitacion) || HABITACIONES[0];
              const est = ESTADOS[p.estado];
              const pri = PRIORIDADES[p.prioridad];
              const left  = pctPos(p.inicio);
              const right = pctPos(p.fin);
              const width = Math.max(1, right - left);
              return (
                <div key={p.id} style={{ display:"flex", alignItems:"center", marginBottom:6, minHeight:36 }}>
                  <div style={{ width:220, flexShrink:0, display:"flex", alignItems:"center", gap:6, paddingRight:10 }}>
                    <span style={{ fontSize:14 }}>{hab.emoji}</span>
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#1a1a2e", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.titulo}</div>
                      <div style={{ display:"flex", gap:4, marginTop:2 }}>
                        <span style={{ fontSize:9, padding:"1px 5px", borderRadius:8, background:est.bg, color:est.color, fontWeight:600 }}>{t(est.label)}</span>
                        <span style={{ fontSize:9, padding:"1px 5px", borderRadius:8, background:pri.bg, color:pri.color, fontWeight:600 }}>{"▲".repeat(p.prioridad==="alta"?3:p.prioridad==="media"?2:1)}</span>
                        {Number(p.gasto || 0) > 0 && <span style={{ fontSize:9, padding:"1px 5px", borderRadius:8, background:fundingBg(p.origenFondos), color:fundingColor(p.origenFondos), fontWeight:700 }}>{paymentMethodIcon(p.origenFondos)} {t(paymentMethodLabelKey(p.origenFondos || FUNDING_SOURCES.MONTH_INCOME))}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ flex:1, position:"relative", height:28, background:"#f8f7ff", borderRadius:6, cursor:"pointer" }} onClick={() => setModalP(p)}>
                    <div style={{
                      position:"absolute", left:`${left}%`, width:`${width}%`,
                      height:"100%", borderRadius:6,
                      background: p.estado==="completado" ? "#22c55e" : p.estado==="bloqueado" ? "#ef4444" : p.estado==="en_curso" ? `linear-gradient(90deg,${hab.color},${hab.color}cc)` : hab.color + "66",
                      display:"flex", alignItems:"center", paddingLeft:6,
                      overflow:"hidden", minWidth:4,
                      boxShadow:`0 2px 6px ${hab.color}44`,
                    }}>
                      {width > 8 && <span style={{ fontSize:10, color:"white", fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.titulo}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {sorted.length === 0 && (
              <div style={{ textAlign:"center", padding:32, color:"#94a3b8", fontSize:14 }}>{t("No tasks. Add the first one!")}</div>
            )}
          </div>
        </div>
      )}

      {/* ── VISTA LISTA ── */}
      {vista === "lista" && (
        <div style={{ display:"grid", gap:8 }}>
          {HABITACIONES.filter(h => filtroHab === "todos" || h.id === filtroHab).map(hab => {
            const tareasHab = sorted.filter(p => p.habitacion === hab.id);
            if (tareasHab.length === 0 && filtroHab === "todos") return null;
            return (
              <div key={hab.id} style={{ ...card() }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                  <span style={{ fontSize:20 }}>{hab.emoji}</span>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:hab.color, fontWeight:700 }}>{t(hab.label)}</span>
                  <span style={{ fontSize:11, color:"#94a3b8", marginLeft:4 }}>{tareasHab.length} {t("Task")}{tareasHab.length !== 1 ? "s" : ""}</span>
                </div>
                {tareasHab.length === 0 && <div style={{ fontSize:12, color:"#94a3b8", fontStyle:"italic" }}>{t("No tasks")}</div>}
                <div style={{ display:"grid", gap:8 }}>
                  {tareasHab.map(p => {
                    const est = ESTADOS[p.estado];
                    const pri = PRIORIDADES[p.prioridad];
                    const pct = p.presupuesto > 0 ? Math.min(100, (p.gasto / p.presupuesto) * 100) : 0;
                    return (
                      <div key={p.id} onClick={() => setModalP(p)}
                        style={{ padding:"11px 13px", background:est.bg, borderRadius:10, cursor:"pointer", border:`1px solid ${est.color}33`, transition:"transform 0.1s" }}
                        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:700, fontSize:13, color:"#1a1a2e" }}>{p.titulo}</div>
                            {p.descripcion && <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{p.descripcion}</div>}
                            <div style={{ display:"flex", gap:6, marginTop:5, flexWrap:"wrap" }}>
                              <span style={{ fontSize:10, padding:"2px 7px", borderRadius:10, background:est.color, color:"white", fontWeight:700 }}>{t(est.label)}</span>
                              <span style={{ fontSize:10, padding:"2px 7px", borderRadius:10, background:pri.bg, color:pri.color, fontWeight:700 }}>{"▲".repeat(p.prioridad==="alta"?3:p.prioridad==="media"?2:1)} {t(pri.label)}</span>
                              {Number(p.gasto || 0) > 0 && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:10, background:fundingBg(p.origenFondos), color:fundingColor(p.origenFondos), fontWeight:700 }}>{paymentMethodIcon(p.origenFondos)} {t(paymentMethodLabelKey(p.origenFondos || FUNDING_SOURCES.MONTH_INCOME))}</span>}
                              {p.inicio && <span style={{ fontSize:10, color:"#94a3b8" }}>📅 {p.inicio.split("-").reverse().join("/")} → {p.fin?.split("-").reverse().join("/")}</span>}
                            </div>
                          </div>
                          {p.presupuesto > 0 && (
                            <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
                              <div style={{ fontSize:13, fontWeight:700, color:"#1a1a2e" }}>{fmt(p.gasto)}</div>
                              <div style={{ fontSize:10, color:"#94a3b8" }}>{t("of")} {fmt(p.presupuesto)}</div>
                            </div>
                          )}
                        </div>
                        {p.presupuesto > 0 && (
                          <div style={{ marginTop:8, height:3, background:"#e2e0ed", borderRadius:3, overflow:"hidden" }}>
                            <div style={{ width:`${pct}%`, height:"100%", background:p.gasto>p.presupuesto?"#ef4444":hab.color, borderRadius:3 }}/>
                          </div>
                        )}
                        {p.notas && <div style={{ fontSize:11, color:"#64748b", marginTop:6, fontStyle:"italic" }}>📝 {p.notas}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalP !== null && (
        <ModalProyecto proyecto={modalP?.id ? modalP : undefined} onSave={guardar} onDelete={eliminar} onClose={() => setModalP(null)}/>
      )}
    </div>
  );
}

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
