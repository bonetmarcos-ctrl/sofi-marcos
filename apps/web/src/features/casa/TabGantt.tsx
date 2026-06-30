import { useMemo, useState } from "react";
import { FUNDING_SOURCES, buildCreditCardDebtFromExpense, projectExpenseItem } from "@sofi-marqui/domain";
import { ESTADOS, PRIORIDADES, PROYECTO_CATEGORIAS, projectCategoryId, projectCategoryMeta } from "../../constants/habitaciones.ts";
import { C, cardN } from "../../constants/colores.ts";
import { fmt } from "../../utils/format.ts";
import { todayISO, toISO, daysBetween } from "../../utils/dates.ts";
import { paymentMethodIcon, paymentMethodLabelKey } from "../../utils/paymentMethods.ts";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useI18n } from "../../i18n.tsx";
import ModalProyecto from "./ModalProyecto.tsx";

const estadoRank = { en_curso:0, pendiente:1, bloqueado:2, completado:3 };

export default function TabGantt({ proyectos = [], setProyectos, setDeudas }) {
  const { t, monthName } = useI18n();
  const [modalP, setModalP] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [vista, setVista] = useState("tarjetas");
  const { isMobile, isTablet } = useBreakpoint();

  const guardar = (p) => {
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

  const proyectosNormalizados = useMemo(() => proyectos.map(project => ({
    ...project,
    categoriaProyecto:projectCategoryId(project),
  })), [proyectos]);

  const lista = useMemo(() => filtroCategoria === "todos"
    ? proyectosNormalizados
    : proyectosNormalizados.filter(project => project.categoriaProyecto === filtroCategoria), [filtroCategoria, proyectosNormalizados]);
  const sorted = useMemo(() => [...lista].sort((a, b) => (
    (estadoRank[a.estado] ?? 9) - (estadoRank[b.estado] ?? 9)
    || String(a.inicio || "").localeCompare(String(b.inicio || ""))
    || String(a.titulo || "").localeCompare(String(b.titulo || ""))
  )), [lista]);

  const fechas = useMemo(() => proyectosNormalizados.flatMap(project => [project.inicio, project.fin]).filter(Boolean).sort(), [proyectosNormalizados]);
  const ganttInicio = fechas[0] || todayISO;
  const ganttFin = fechas[fechas.length - 1] || todayISO;
  const totalDias = Math.max(30, daysBetween(ganttInicio, ganttFin) + 14);

  const mesesGantt = useMemo(() => {
    const months = [];
    const cur = new Date(`${ganttInicio}T12:00:00`);
    cur.setDate(1);
    const finDate = new Date(`${ganttFin}T12:00:00`);
    finDate.setMonth(finDate.getMonth() + 1);
    while (cur < finDate) {
      months.push({ label:`${monthName(cur.getMonth(), "short")} ${cur.getFullYear()}`, date:new Date(cur) });
      cur.setMonth(cur.getMonth() + 1);
    }
    return months;
  }, [ganttInicio, ganttFin, monthName]);

  const pctPos = (dateStr) => {
    if (!dateStr) return 0;
    const date = new Date(`${dateStr}T12:00:00`);
    const start = new Date(`${ganttInicio}T12:00:00`);
    return Math.max(0, Math.min(100, ((date.getTime() - start.getTime()) / (totalDias * 86400000)) * 100));
  };

  const totalPpto = useMemo(() => proyectosNormalizados.reduce((sum, project) => sum + Number(project.presupuesto || 0), 0), [proyectosNormalizados]);
  const totalGastado = useMemo(() => proyectosNormalizados.reduce((sum, project) => sum + Number(project.gasto || 0), 0), [proyectosNormalizados]);
  const activos = proyectosNormalizados.filter(project => project.estado !== "completado").length;
  const porEstado = useMemo(() => Object.keys(ESTADOS).reduce<Record<string, number>>((acc, key) => ({ ...acc, [key]:proyectosNormalizados.filter(project => project.estado === key).length }), {}), [proyectosNormalizados]);
  const kpiColumns = isMobile ? "1fr" : isTablet ? "repeat(2,minmax(0,1fr))" : "repeat(4,minmax(0,1fr))";
  const cardColumns = isMobile ? "1fr" : isTablet ? "repeat(2,minmax(0,1fr))" : "repeat(3,minmax(0,1fr))";

  return (
    <div style={{ display:"grid", gap:16, minWidth:0 }}>
      <div style={{ display:"grid", gridTemplateColumns:kpiColumns, gap:10 }}>
        {[
          { label:t("Total projects"), value:proyectosNormalizados.length, sub:`${porEstado.completado || 0} ${t("completed")}`, color:C.brandPrimary, bg:C.brandPrimaryFixed },
          { label:t("Active projects"), value:activos, sub:`${porEstado.bloqueado || 0} ${t("Blocked").toLowerCase()}`, color:C.warn, bg:C.warnBg },
          { label:t("Budgeted"), value:fmt(totalPpto), sub:t("estimated"), color:C.brandSecondaryStrong, bg:C.brandSecondaryFixed },
          { label:t("Spent"), value:fmt(totalGastado), sub:totalPpto > 0 ? `${Math.round((totalGastado / totalPpto) * 100)}% ${t("of")}` : "", color:totalGastado > totalPpto ? C.error : C.exito, bg:totalGastado > totalPpto ? C.errorBg : C.exitoBg },
        ].map(metric => (
          <div key={metric.label} style={cardN({ background:metric.bg, border:`1px solid ${metric.color}33`, padding:"14px 16px" })}>
            <div style={{ fontSize:11, fontWeight:800, color:metric.color, textTransform:"uppercase", letterSpacing:"0.6px" }}>{metric.label}</div>
            <div style={{ fontSize:24, lineHeight:1.1, fontWeight:900, color:metric.color, fontFamily:"'Playfair Display',serif", marginTop:5 }}>{metric.value}</div>
            <div style={{ fontSize:11, color:C.txt2, marginTop:3 }}>{metric.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:4, background:C.fondo, border:`1px solid ${C.borde}`, borderRadius:10, padding:3 }}>
          {[
            { key:"tarjetas", label:t("Cards"), icon:"grid-3x3-gap" },
            { key:"gantt", label:t("Timeline"), icon:"bar-chart-steps" },
          ].map(view => (
            <button key={view.key} onClick={() => setVista(view.key)}
              style={{ display:"flex", alignItems:"center", gap:6, background:vista === view.key ? C.brandPrimaryFixed : "transparent", color:vista === view.key ? C.brandPrimary : C.txt2, border:vista === view.key ? `1px solid ${C.brandPrimaryDim}` : "1px solid transparent", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              <i className={`bi bi-${view.icon}`} aria-hidden="true"/> {view.label}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", minWidth:0 }}>
          <button onClick={() => setFiltroCategoria("todos")}
            style={{ padding:"5px 11px", borderRadius:999, fontSize:11, border:`1px solid ${filtroCategoria === "todos" ? C.brandPrimary : C.borde}`, cursor:"pointer", background:filtroCategoria === "todos" ? C.brandPrimaryFixed : C.superficie, color:filtroCategoria === "todos" ? C.brandPrimary : C.txt2, fontFamily:"'Lato',sans-serif", fontWeight:800 }}>
            {t("All")}
          </button>
          {PROYECTO_CATEGORIAS.map(category => (
            <button key={category.id} onClick={() => setFiltroCategoria(category.id)}
              style={{ padding:"5px 11px", borderRadius:999, fontSize:11, border:`1px solid ${filtroCategoria === category.id ? category.color : C.borde}`, cursor:"pointer", background:filtroCategoria === category.id ? category.bg : C.superficie, color:filtroCategoria === category.id ? category.color : C.txt2, fontFamily:"'Lato',sans-serif", fontWeight:800 }}>
              {category.emoji} {t(category.label)}
            </button>
          ))}
        </div>
        <button onClick={() => setModalP({})}
          style={{ marginLeft:isMobile ? 0 : "auto", width:isMobile ? "100%" : "auto", display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:C.brandPrimary, color:"white", border:"none", borderRadius:10, padding:"8px 15px", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
          <i className="bi bi-plus-circle" aria-hidden="true"/> {t("Project")}
        </button>
      </div>

      {vista === "tarjetas" && (
        <div style={{ display:"grid", gridTemplateColumns:cardColumns, gap:12 }}>
          {sorted.map(project => <ProjectCard key={project.id} project={project} onOpen={() => setModalP(project)} t={t} />)}
          {sorted.length === 0 && (
            <div style={cardN({ gridColumn:"1 / -1", padding:28, textAlign:"center", color:C.txt2, fontSize:13 })}>{t("No projects yet. Create the first one.")}</div>
          )}
        </div>
      )}

      {vista === "gantt" && (
        <div style={cardN(isMobile ? { padding:"12px 10px", overflowX:"auto" } : { overflowX:"auto" })}>
          <div style={{ minWidth:isMobile ? 620 : 700 }}>
            <div style={{ display:"flex", marginBottom:8, borderBottom:`1px solid ${C.borde}`, paddingBottom:8 }}>
              <div style={{ width:230, flexShrink:0, fontSize:11, fontWeight:800, color:C.brandPrimary, textTransform:"uppercase", letterSpacing:"0.6px" }}>{t("Project")}</div>
              <div style={{ flex:1, position:"relative", height:20 }}>
                {mesesGantt.map((month, index) => (
                  <div key={index} style={{ position:"absolute", left:`${pctPos(toISO(month.date))}%`, fontSize:10, fontWeight:800, color:C.txt2, whiteSpace:"nowrap", transform:"translateX(-50%)" }}>
                    {month.label}
                  </div>
                ))}
                <div style={{ position:"absolute", left:`${pctPos(todayISO)}%`, top:-4, bottom:-8, width:2, background:C.error, opacity:0.7 }}/>
              </div>
            </div>
            {sorted.map(project => {
              const category = projectCategoryMeta(project);
              const status = ESTADOS[project.estado] || ESTADOS.pendiente;
              const priority = PRIORIDADES[project.prioridad] || PRIORIDADES.media;
              const left = pctPos(project.inicio);
              const right = pctPos(project.fin);
              const width = Math.max(1, right - left);
              return (
                <div key={project.id} style={{ display:"flex", alignItems:"center", marginBottom:7, minHeight:38 }}>
                  <div style={{ width:230, flexShrink:0, display:"flex", alignItems:"center", gap:8, paddingRight:10, minWidth:0 }}>
                    <span style={{ width:28, height:28, borderRadius:8, background:category.bg, color:category.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:`1px solid ${category.color}33` }}>{category.emoji}</span>
                    <div style={{ flex:1, overflow:"hidden", minWidth:0 }}>
                      <div style={{ fontSize:12.5, fontWeight:800, color:C.txt, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{project.titulo}</div>
                      <div style={{ display:"flex", gap:4, marginTop:2, flexWrap:"wrap" }}>
                        <span style={{ fontSize:9.5, padding:"1px 5px", borderRadius:999, background:status.bg, color:status.color, fontWeight:800 }}>{t(status.label)}</span>
                        <span style={{ fontSize:9.5, padding:"1px 5px", borderRadius:999, background:priority.bg, color:priority.color, fontWeight:800 }}>{t(priority.label)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ flex:1, position:"relative", height:30, background:C.fondo, borderRadius:8, cursor:"pointer" }} onClick={() => setModalP(project)}>
                    <div style={{ position:"absolute", left:`${left}%`, width:`${width}%`, height:"100%", borderRadius:8, background:project.estado === "completado" ? C.exito : project.estado === "bloqueado" ? C.error : project.estado === "en_curso" ? category.color : `${category.color}88`, display:"flex", alignItems:"center", paddingLeft:8, overflow:"hidden", minWidth:4, boxShadow:`0 2px 8px ${category.color}33` }}>
                      {width > 9 && <span style={{ fontSize:10.5, color:"white", fontWeight:800, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{project.titulo}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {sorted.length === 0 && (
              <div style={{ textAlign:"center", padding:32, color:C.txt2, fontSize:13 }}>{t("No projects yet. Create the first one.")}</div>
            )}
          </div>
        </div>
      )}

      {modalP !== null && (
        <ModalProyecto proyecto={modalP?.id ? modalP : undefined} onSave={guardar} onDelete={eliminar} onClose={() => setModalP(null)}/>
      )}
    </div>
  );
}

function ProjectCard({ project, onOpen, t }) {
  const category = projectCategoryMeta(project);
  const status = ESTADOS[project.estado] || ESTADOS.pendiente;
  const priority = PRIORIDADES[project.prioridad] || PRIORIDADES.media;
  const budget = Number(project.presupuesto || 0);
  const spent = Number(project.gasto || 0);
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const planningRows = [
    { label:t("Goal"), value:project.objetivo, icon:"bullseye" },
    { label:t("Next step"), value:project.siguientePaso, icon:"arrow-right-circle" },
    { label:t("Watch"), value:project.decisionPendiente, icon:"exclamation-diamond" },
  ].filter(row => String(row.value || "").trim());

  return (
    <button onClick={onOpen}
      style={{ ...cardN({ padding:16, textAlign:"left", cursor:"pointer", border:`1px solid ${category.color}2f` }), fontFamily:"'Lato',sans-serif" }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"flex-start", marginBottom:10 }}>
        <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 8px", borderRadius:999, background:category.bg, color:category.color, fontSize:11, fontWeight:900, minWidth:0 }}>
          <span>{category.emoji}</span><span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t(category.label)}</span>
        </span>
        <span style={{ padding:"4px 8px", borderRadius:999, background:status.bg, color:status.color, fontSize:10.5, fontWeight:900, whiteSpace:"nowrap" }}>{t(status.label)}</span>
      </div>
      <div style={{ fontSize:16, lineHeight:1.15, fontWeight:900, color:C.txt, marginBottom:5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{project.titulo}</div>
      {project.descripcion && <div style={{ fontSize:12, lineHeight:1.35, color:C.txt2, marginBottom:10 }}>{project.descripcion}</div>}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:budget > 0 || planningRows.length > 0 ? 11 : 0 }}>
        <span style={{ fontSize:10.5, padding:"3px 7px", borderRadius:999, background:priority.bg, color:priority.color, fontWeight:900 }}>{t(priority.label)}</span>
        {project.inicio && <span style={{ fontSize:10.5, padding:"3px 7px", borderRadius:999, background:C.fondo, color:C.txt2, fontWeight:800 }}>{formatDate(project.inicio)}{project.fin ? ` - ${formatDate(project.fin)}` : ""}</span>}
        {spent > 0 && <span style={{ fontSize:10.5, padding:"3px 7px", borderRadius:999, background:fundingBg(project.origenFondos), color:fundingColor(project.origenFondos), fontWeight:900 }}>{paymentMethodIcon(project.origenFondos)} {t(paymentMethodLabelKey(project.origenFondos || FUNDING_SOURCES.MONTH_INCOME))}</span>}
      </div>
      {budget > 0 && (
        <div style={{ marginBottom:planningRows.length > 0 ? 12 : 0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", gap:8, fontSize:11.5, color:C.txt2, marginBottom:5 }}>
            <span>{fmt(spent)}</span>
            <span>{fmt(budget)}</span>
          </div>
          <div style={{ height:5, borderRadius:999, background:C.fondo, overflow:"hidden" }}>
            <div style={{ width:`${pct}%`, height:"100%", borderRadius:999, background:spent > budget ? C.error : category.color }}/>
          </div>
        </div>
      )}
      {planningRows.length > 0 && (
        <div style={{ display:"grid", gap:6 }}>
          {planningRows.slice(0, 2).map(row => (
            <div key={row.label} style={{ display:"grid", gridTemplateColumns:"16px minmax(0,1fr)", gap:7, alignItems:"start", fontSize:11.5, color:C.txt2 }}>
              <i className={`bi bi-${row.icon}`} style={{ color:category.color, lineHeight:1.3 }} aria-hidden="true"/>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}><strong style={{ color:C.txt }}>{row.label}:</strong> {row.value}</span>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}

const formatDate = (date) => String(date || "").split("-").reverse().join("/");

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