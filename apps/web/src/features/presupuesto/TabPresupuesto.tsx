import { useCallback, useMemo, useState } from "react";
import { FUNDING_SOURCES, calculateExpenseCashImpactForMonth, expenseFirstChargeMonth, expensePurchaseMonth, utilityAvailabilityDate, utilityCashMonth } from "@sofi-marqui/domain";
import { CATEGORIAS, SUBCAT_VAR, SUMINISTROS_TIPOS, COLOR_VIAJE, BG_VIAJE, categoriaEventoKey } from "../../constants/categorias.ts";
import { C, cardN } from "../../constants/colores.ts";
import { MESES } from "../../constants/meses.ts";
import { fmt, labelMes } from "../../utils/format.ts";
import { todayISO, addMeses, daysBetween } from "../../utils/dates.ts";
import { useDatosMes, calcCuotaDeudaMes } from "../../hooks/useDatosMes.ts";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useI18n } from "../../i18n.tsx";
import { BASE } from "../../data/demo.ts";
import AnalizadorPresionFinanciera from "./AnalizadorPresionFinanciera.tsx";
import PanelDeudas from "./PanelDeudas.tsx";
import SeccionGastosVariables from "./SeccionGastosVariables.tsx";
import ModalPalanca from "./modals/ModalPalanca.tsx";
import ModalDeuda from "./modals/ModalDeuda.tsx";

const UTILITY_UNIT_FALLBACK = { luz:"kWh", gas:"m3", agua:"m3" };

export default function TabPresupuesto({ eventos, bloqueos, viajes, proyectos = [], palancas, setPalancas, deudas, setDeudas, suministros, setSuministros, gastosVariables = [], setGastosVariables }) {
  const { t, monthName } = useI18n();
  const año       = new Date().getFullYear();
  const mesActual = new Date().getMonth();
  const { isMobile, isTablet } = useBreakpoint();

  const [mesDetalle,  setMesDetalle]  = useState(null);
  const [mesVista,    setMesVista]    = useState(mesActual);
  const [hoveredMes,  setHoveredMes]  = useState(null);
  const [explorerLayer, setExplorerLayer] = useState("suministros");
  const [explorerKey, setExplorerKey] = useState(null);
  const [expenseTimingMode, setExpenseTimingMode] = useState("cash");
  const [modalPalanca,setModalPalanca]= useState(null);
  const [modalDeuda,  setModalDeuda]  = useState(null);
  const prefVista = `${año}-${String(mesVista+1).padStart(2,"0")}`;

  // ── Handlers palancas ──
  const normalizarMesPalanca = (palanca) => ({ ...palanca, mes:palanca.mes || prefVista });
  const guardarPalanca  = (palancaDraft) => { const palanca = normalizarMesPalanca(palancaDraft); setPalancas(prev => palanca.id && prev.find(x=>x.id===palanca.id) ? prev.map(x=>x.id===palanca.id?palanca:x) : [...prev,palanca]); setModalPalanca(null); };
  const eliminarPalanca = (id) => { setPalancas(prev=>prev.filter(x=>x.id!==id)); setModalPalanca(null); };
  const togglePalanca   = (id) => setPalancas(prev=>prev.map(p=>p.id===id?normalizarMesPalanca({ ...p, activa:!p.activa }):p));

  // ── Handlers deudas ──
  const guardarDeuda    = (d) => { setDeudas(prev => d.id && prev.find(x=>x.id===d.id) ? prev.map(x=>x.id===d.id?d:x) : [...prev,d]); setModalDeuda(null); };
  const eliminarDeuda   = (id) => { setDeudas(prev=>prev.filter(x=>x.id!==id)); setModalDeuda(null); };

  // ── Datos calculados ──
  const { datosMes } = useDatosMes({ eventos, bloqueos, viajes, palancas, deudas, suministros, gastosVariables, proyectos, año, mesActual });
  const detalle = mesDetalle !== null ? datosMes[mesDetalle] : null;
  const resumenMes = datosMes[mesVista] || datosMes[mesActual];

  // KPIs deudas
  const cuotaMesVista   = useMemo(() => calcCuotaDeudaMes(deudas, prefVista), [deudas, prefVista]);
  const totalPendienteMes = useMemo(() => calcularDeudaPendienteMes(deudas, prefVista), [deudas, prefVista]);
  const proxVencimiento = useMemo(() => deudas
    .map(d=>({ ...d, fin:addMeses(d.mes_inicio, d.cuotas_totales-1) }))
    .filter(d=>d.fin>=todayISO.slice(0,7))
    .sort((a,b)=>a.fin.localeCompare(b.fin))[0], [deudas]);

  const utilityBreakdown = useMemo(() => SUMINISTROS_TIPOS
    .map(tipo => {
      const monthly = MESES.map((_, index) => {
        const prefMes = `${año}-${String(index + 1).padStart(2, "0")}`;
        const registros = suministros.filter(s => utilityCashMonth(s) === prefMes && s.tipo === tipo.key);
        const importe = registros.reduce((sum, item) => sum + Number(item.importe || 0), 0);
        const consumo = registros.reduce((sum, item) => sum + Number(item.consumo || 0), 0);
        return { mes:index, pref:prefMes, importe, consumo, registros };
      });
      return {
        ...tipo,
        monthly,
        total:monthly.reduce((sum, item) => sum + item.importe, 0),
        consumoTotal:monthly.reduce((sum, item) => sum + item.consumo, 0),
      };
    })
    .filter(item => item.total > 0 || item.consumoTotal > 0), [suministros, año]);

  const explorerExpenseAmount = useCallback((expense, prefMes) => expenseTimingMode === "purchase"
    ? (expensePurchaseMonth(expense) === prefMes ? Number(expense.importe || 0) : 0)
    : calculateExpenseCashImpactForMonth(expense, prefMes), [expenseTimingMode]);

  const discretionaryBreakdown = useMemo(() => Object.entries(CATEGORIAS)
    .filter(([,v])=>v.tipo==="gasto")
    .filter(([k])=>k!=="viaje")
    .map(([k,v])=>{
      const monthly = MESES.map((_, index) => {
        const prefMes = `${año}-${String(index + 1).padStart(2, "0")}`;
        const eventItems = eventos
          .map(e=>({ ...e, importeExplorer:explorerExpenseAmount(e, prefMes) }))
          .filter(e=>categoriaEventoKey(e)===k&&e.importeExplorer>0);
        const expenseItems = gastosVariables
          .map(g=>({ ...g, importeExplorer:explorerExpenseAmount(g, prefMes) }))
          .filter(g=>g.categoria===k&&g.importeExplorer>0);
        const projectItems = k === "hogar" ? proyectos.filter(p=>p.estado==="completado"&&p.fin?.startsWith(prefMes)) : [];
        const importe = eventItems.reduce((a,e)=>a+Number(e.importeExplorer||0),0)
          + expenseItems.reduce((a,g)=>a+Number(g.importeExplorer||0),0)
          + projectItems.reduce((a,p)=>a+Number(p.gasto||0),0);
        return { mes:index, pref:prefMes, importe, eventItems, expenseItems, projectItems };
      });
      return { ...v, key:k, monthly, sum:monthly.reduce((a,m)=>a+m.importe,0) };
    })
    .filter(c=>c.sum>0).sort((a,b)=>b.sum-a.sum), [eventos, gastosVariables, proyectos, año, explorerExpenseAmount]);

  const tripBreakdown = useMemo(() => viajes
    .map(v=>{
      const total = Object.values(v.gastos||{}).reduce<number>((a,b)=>a+Number(b || 0),0);
      const monthly = MESES.map((_, index) => {
        const prefMes = `${año}-${String(index + 1).padStart(2, "0")}`;
        const inMonth = v.inicio?.startsWith(prefMes) || v.fin?.startsWith(prefMes);
        return { mes:index, pref:prefMes, importe:inMonth ? total : 0 };
      });
      return { ...v, total, monthly };
    })
    .filter(v=>v.total>0 || v.inicio?.startsWith(`${año}`) || v.fin?.startsWith(`${año}`)), [viajes, año]);

  const ingresosVariablesMes = useMemo(() => {
    const dm = datosMes[mesVista];
    return Object.entries(SUBCAT_VAR)
      .map(([k, v]) => ({
        key:k,
        ...v,
        val:k==="habitacion"?dm?.ing_habitacion:k==="coche"?dm?.ing_coche:k==="ventas"?dm?.ing_ventas:dm?.ing_otros,
      }))
      .filter(item => Number(item.val || 0) > 0);
  }, [datosMes, mesVista]);

  const palancasMesVista = useMemo(() => palancas
    .filter(p => p.mes === prefVista), [palancas, prefVista]);
  const palancasPotResumen = useMemo(() => palancas
    .filter(p => !p.activa && p.mes === prefVista), [palancas, prefVista]);

  const ingresosFijosResumen = BASE.monthlyOverrides?.[prefVista]?.fixedIncome ?? BASE.ingresos_fijos;
  const ajusteIngresosMes = ingresosFijosResumen - BASE.detalle_ingresos.reduce((a, d) => a + Number(d.importe || 0), 0);
  const detalleIngresosMes = Math.abs(ajusteIngresosMes) > 0.005
    ? [...BASE.detalle_ingresos, { nombre:t("Monthly adjustment"), importe:ajusteIngresosMes }]
    : BASE.detalle_ingresos;
  const gastosFijosResumen = (BASE.monthlyOverrides?.[prefVista]?.fixedExpenses ?? BASE.gastos_fijos) + (resumenMes?.gasto_deudas || 0) + (BASE.previsiones || 0);
  const presionResumen = resumenMes?.presion || 0;

  const kpiColumns = isMobile ? "1fr" : isTablet ? "repeat(2,minmax(0,1fr))" : "repeat(3,minmax(0,1fr))";
  const threeColumns = isMobile ? "1fr" : isTablet ? "repeat(2,minmax(0,1fr))" : "repeat(3,minmax(0,1fr))";
  const expenseLayerColumns = isMobile ? "1fr" : isTablet ? "repeat(2,minmax(0,1fr))" : "repeat(4,minmax(0,1fr))";
  const debtProjectionColumns = `92px ${deudas.map(() => "minmax(86px,1fr)").join(" ")} 96px 104px`;
  const explorerColumns = isMobile ? "1fr" : "minmax(0,1.35fr) minmax(280px,0.65fr)";
  const explorerMonth = mesDetalle ?? mesVista;
  const expenseLayers = [
    { key:"estructural", color:"#64748b", bg:"#f8fafc", label:`1 ${t("Structural")}` },
    { key:"suministros", color:"#d97706", bg:"#fef3c7", label:`2 ${t("Utilities")}` },
    { key:"discrecional", color:C.lavender, bg:C.lavLight, label:`3 ${t("Discretionary")}` },
    { key:"viajes", color:COLOR_VIAJE, bg:BG_VIAJE, label:`4 ${t("Trips")}` },
  ];
  const selectedLayer = expenseLayers.find(layer => layer.key === explorerLayer) || expenseLayers[1];
  const selectedUtility = utilityBreakdown.find(item => item.key === explorerKey) || utilityBreakdown[0];
  const selectedCategory = discretionaryBreakdown.find(item => item.key === explorerKey) || discretionaryBreakdown[0];
  const selectedTrip = tripBreakdown.find(item => String(item.id) === String(explorerKey));
  const tripMonthlyTotal = MESES.map((_, index) => ({
    mes:index,
    pref:`${año}-${String(index + 1).padStart(2, "0")}`,
    importe:tripBreakdown.reduce((sum, trip) => sum + Number(trip.monthly[index]?.importe || 0), 0),
  }));
  const structuralMonthly = datosMes.map(month => ({ mes:month.mes, pref:month.pref, importe:month.gasto_estructural }));
  const numberFmt = (value) => Number(value || 0).toLocaleString("es-ES", { maximumFractionDigits:1 });
  const sumMonthly = (monthly, valueKey = "importe") => monthly.reduce((sum, item) => sum + Number(item[valueKey] || 0), 0);
  const selectedMonthlyValue = (monthly, valueKey = "importe") => Number(monthly.find(item => item.mes === explorerMonth)?.[valueKey] || 0);
  const selectExplorer = (layer, key = null) => { setExplorerLayer(layer); setExplorerKey(key); };
  const formatCardDetail = (item, prefMes) => {
    const fundingSource = item.origenFondos || FUNDING_SOURCES.MONTH_INCOME;
    if (fundingSource === FUNDING_SOURCES.MONTH_INCOME) return "";

    const card = item.tarjetaNombre || t("Card");
    const close = item.tarjetaDiaCierre ? `${t("Card closing day")} ${item.tarjetaDiaCierre}` : "";
    const charge = expenseFirstChargeMonth(item);
    const chargeLabel = charge ? `${t("First debit month")} ${labelMes(charge)}` : "";
    const purchaseLabel = expensePurchaseMonth(item) && expensePurchaseMonth(item) !== prefMes ? `${t("Purchase month")} ${labelMes(expensePurchaseMonth(item))}` : "";
    return [fundingSource === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? t("Credit card installments") : t("Credit card next month"), card, close, chargeLabel, purchaseLabel].filter(Boolean).join(" · ");
  };
  const renderMetricStrip = (metrics, color) => (
    <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,minmax(0,1fr))",background:C.fondo,border:`1px solid ${C.borde}`,borderRadius:12,overflow:"hidden",marginBottom:16 }}>
      {metrics.map((metric, index) => (
        <div key={metric.label} style={{ padding:"10px 12px",borderRight:!isMobile && index < metrics.length - 1 ? `1px solid ${C.borde}`:"none",borderBottom:isMobile && index < metrics.length - 2 ? `1px solid ${C.borde}`:"none" }}>
          <div style={{ fontSize:10,fontWeight:700,color:C.txt2,textTransform:"uppercase",letterSpacing:"0.6px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{metric.label}</div>
          <div style={{ fontSize:18,fontWeight:800,color:metric.color || color,fontFamily:"'Playfair Display',serif",marginTop:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{metric.value}</div>
          {metric.sub && <div style={{ fontSize:10,color:C.txt2,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{metric.sub}</div>}
        </div>
      ))}
    </div>
  );
  const renderMonthlyTrend = (monthly, color, valueKey = "importe", suffix = "") => {
    const width = 720;
    const height = 156;
    const padX = 28;
    const padY = 22;
    const chartW = width - padX * 2;
    const chartH = height - padY * 2;
    const max = Math.max(...monthly.map(item => Number(item[valueKey] || 0)), 1);
    const points = monthly.map((item, index) => {
      const value = Number(item[valueKey] || 0);
      const x = padX + (chartW / Math.max(1, monthly.length - 1)) * index;
      const y = height - padY - (value / max) * chartH;
      return { ...item, value, x, y };
    });
    const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    const areaPath = points.length > 0 ? `${path} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z` : "";
    const selectedPoint = points.find(point => point.mes === explorerMonth);
    return (
      <div style={{ minWidth:isMobile?560:"auto" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width:"100%",height:170,display:"block",background:C.fondo,borderRadius:12,border:`1px solid ${C.borde}` }} role="img" aria-label={t("Monthly evolution")}>
          {[0, 0.5, 1].map(ratio => (
            <line key={ratio} x1={padX} x2={width - padX} y1={height - padY - chartH * ratio} y2={height - padY - chartH * ratio} stroke={C.borde} strokeWidth="1" />
          ))}
          {areaPath && <path d={areaPath} fill={color} opacity="0.12" />}
          {path && <path d={path} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
          {selectedPoint && <line x1={selectedPoint.x} x2={selectedPoint.x} y1={padY} y2={height - padY} stroke={color} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.55" />}
          {points.map(point => {
            const selected = point.mes === explorerMonth;
            const label = valueKey === "importe" ? fmt(point.value) : `${numberFmt(point.value)} ${suffix}`.trim();
            return (
              <g key={point.pref} onClick={() => setMesDetalle(point.mes)} style={{ cursor:"pointer" }}>
                <title>{monthName(point.mes)} · {label}</title>
                <circle cx={point.x} cy={point.y} r={selected?8:5.5} fill="white" stroke={color} strokeWidth={selected?4:3} />
                {selected && <text x={point.x} y={Math.max(14, point.y - 14)} textAnchor="middle" fontSize="18" fontWeight="700" fill={color}>{valueKey === "importe" ? label.replace("€", "").trim() : label}</text>}
              </g>
            );
          })}
        </svg>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(12,minmax(34px,1fr))",gap:4,marginTop:6 }}>
          {points.map(point => {
            const selected = point.mes === explorerMonth;
            return (
              <button key={point.pref} onClick={() => setMesDetalle(point.mes)}
                style={{ border:"none",background:selected?`${color}18`:"transparent",borderRadius:6,padding:"4px 0",cursor:"pointer",fontFamily:"'Lato',sans-serif",fontSize:9,color:selected?color:C.txt2,fontWeight:selected?800:500 }}>
                {monthName(point.mes, "short")}
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  const explorerSeries = explorerLayer === "estructural"
    ? structuralMonthly
    : explorerLayer === "suministros"
      ? selectedUtility?.monthly || datosMes.map(month => ({ mes:month.mes, pref:month.pref, importe:month.gasto_suministros }))
      : explorerLayer === "discrecional"
        ? selectedCategory?.monthly || datosMes.map(month => ({ mes:month.mes, pref:month.pref, importe:month.gastos_var }))
        : selectedTrip?.monthly || tripMonthlyTotal;
  const explorerTotal = sumMonthly(explorerSeries);
  const explorerSelected = selectedMonthlyValue(explorerSeries);
  const selectedUtilityUnit = selectedUtility?.monthly.find(month => month.consumo > 0)?.registros?.[0]?.unidad || (selectedUtility ? UTILITY_UNIT_FALLBACK[selectedUtility.key] : "") || "";
  const selectedUtilityConsumption = explorerLayer === "suministros" && selectedUtility ? selectedMonthlyValue(selectedUtility.monthly, "consumo") : 0;
  const explorerMetrics = [
    { label:t("Annual total"), value:fmt(explorerTotal) },
    { label:t("Average"), value:fmt(explorerTotal / 12) },
    { label:t("Selected month"), value:fmt(explorerSelected), sub:`${monthName(explorerMonth)} ${año}` },
    explorerLayer === "suministros" && selectedUtility?.consumoTotal > 0
      ? { label:t("Consumption"), value:`${numberFmt(selectedUtilityConsumption)} ${selectedUtilityUnit}`.trim(), sub:`${t("Annual total")} ${numberFmt(selectedUtility.consumoTotal)} ${selectedUtilityUnit}`.trim(), color:C.cyan }
      : { label:t("Monthly total"), value:fmt(datosMes[explorerMonth]?.total_gastos || 0), sub:t("Layered expenses") },
  ];

  return (
    <div style={{ display:"grid", gap:20, minWidth:0 }}>

      {/* ── KPIs ── */}
      <div style={{ display:"grid", gap:10 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10 }}>
          <div>
            <div style={{ fontSize:16,fontWeight:700,color:C.txt }}>{t("Monthly summary")}</div>
            <div style={{ fontSize:12,color:C.txt2,marginTop:2 }}>{t("Income · expenses · debt snapshot")}</div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <button onClick={() => setMesVista(i => Math.max(0, i-1))}
              style={{ background:C.fondo,border:`1px solid ${C.borde}`,borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:14,color:C.txt2,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Lato',sans-serif" }}>‹</button>
            <span style={{ fontSize:13,fontWeight:700,color:C.txt,minWidth:100,textAlign:"center" }}>{monthName(mesVista)} {año}</span>
            <button onClick={() => setMesVista(i => Math.min(11, i+1))}
              style={{ background:C.fondo,border:`1px solid ${C.borde}`,borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:14,color:C.txt2,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Lato',sans-serif" }}>›</button>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:kpiColumns, gap:isMobile?10:12 }}>
          <div style={{ ...cardN(), borderTop:`3px solid ${C.cyan}` }}>
            <div style={{ fontSize:10,fontWeight:700,color:C.cyan,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6 }}>💶 {t("Fixed income")}</div>
            <div style={{ fontSize:26,fontWeight:700,color:C.txt,fontFamily:"'Playfair Display',serif" }}>{fmt(ingresosFijosResumen)}</div>
            <div style={{ fontSize:11,color:C.txt2,marginTop:3 }}>{t("guaranteed monthly")}</div>
          </div>
          <div style={{ ...cardN(), borderTop:`3px solid ${C.lavender}` }}>
            <div style={{ fontSize:10,fontWeight:700,color:C.lavender,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6 }}>📈 {t("Variable income")}</div>
            <div style={{ fontSize:26,fontWeight:700,color:C.txt,fontFamily:"'Playfair Display',serif" }}>{fmt(resumenMes?.ingresos_var_total || 0)}</div>
            <div style={{ fontSize:11,color:C.txt2,marginTop:3 }}>{monthName(mesVista)} {año}</div>
          </div>
          <div style={{ ...cardN(), borderTop:`3px solid ${C.sage}`, background:`linear-gradient(135deg,${C.superficie},${C.sageLight})` }}>
            <div style={{ fontSize:10,fontWeight:700,color:C.sageDark,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6 }}>✨ {t("Inactive potential")}</div>
            <div style={{ fontSize:26,fontWeight:700,color:C.sageDark,fontFamily:"'Playfair Display',serif" }}>{fmt(resumenMes?.palancasPot || 0)}</div>
            <div style={{ fontSize:11,color:C.sageDark,opacity:0.7,marginTop:3 }}>{palancasPotResumen.length} {t("Levers")}</div>
          </div>
          <div style={{ ...cardN(), borderTop:`3px solid ${C.warn}` }}>
            <div style={{ fontSize:10,fontWeight:700,color:"#b45309",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6 }}>📌 {t("Fixed expenses")}</div>
            <div style={{ fontSize:26,fontWeight:700,color:C.txt,fontFamily:"'Playfair Display',serif" }}>{fmt(gastosFijosResumen)}</div>
            <div style={{ fontSize:11,color:C.txt2,marginTop:3 }}>{t("monthly structure")}</div>
          </div>
          <div style={{ ...cardN(), borderTop:`3px solid ${presionResumen>85?C.error:presionResumen>70?C.warn:C.exito}` }}>
            <div style={{ fontSize:10,fontWeight:700,color:C.txt2,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6 }}>⚡ {t("Financial pressure")}</div>
            <div style={{ fontSize:26,fontWeight:700,color:presionResumen>85?C.error:presionResumen>70?C.warn:C.sageDark,fontFamily:"'Playfair Display',serif" }}>{presionResumen}%</div>
            <div style={{ fontSize:11,color:C.txt2,marginTop:3 }}>{t("of committed income")}</div>
            <div style={{ marginTop:8,height:4,background:C.borde,borderRadius:4,overflow:"hidden" }}>
              <div style={{ width:`${Math.min(100, presionResumen)}%`,height:"100%",borderRadius:4,background:presionResumen>85?C.error:presionResumen>70?C.warn:C.exito,transition:"width 0.5s" }}/>
            </div>
          </div>
          <div style={{ ...cardN(), background:"linear-gradient(135deg,#1e1a2e,#2d1f3d)", border:"none" }}>
            <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6 }}>💳 {t("Outstanding debt")}</div>
            <div style={{ fontSize:26,fontWeight:700,color:C.warn,fontFamily:"'Playfair Display',serif" }}>{fmt(totalPendienteMes)}</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:3 }}>{fmt(cuotaMesVista)}{t("/month")} · {deudas.length} {t("debts")}</div>
            {proxVencimiento && (
              <div style={{ marginTop:8,fontSize:10,color:"rgba(255,255,255,0.3)" }}>
                {t("Next payoff")}: {proxVencimiento.nombre} · {labelMes(addMeses(proxVencimiento.mes_inicio, proxVencimiento.cuotas_totales-1))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ANALIZADOR PRESIÓN FINANCIERA ── */}
      <AnalizadorPresionFinanciera resumenMes={resumenMes} ingresosFijosResumen={ingresosFijosResumen} mesVista={mesVista} año={año}/>

      {/* ── PANEL DEUDAS ── */}
      <PanelDeudas deudas={deudas} totalPendiente={totalPendienteMes} cuotaMesActual={cuotaMesVista} onNueva={()=>setModalDeuda({})} onEditar={(d)=>setModalDeuda(d)}/>

      {/* ── ESTRUCTURA DE INGRESOS ── */}
      <div style={cardN(isMobile ? { padding:"14px 12px" } : undefined)}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:10 }}>
          <div>
            <div style={{ fontSize:16,fontWeight:700,color:C.txt,marginBottom:4 }}>{t("Income structure")}</div>
            <div style={{ fontSize:12,color:C.txt2 }}>{t("Guaranteed fixed · Recorded variable · Activatable potential")}</div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <button onClick={() => setMesVista(i => Math.max(0, i-1))}
              style={{ background:C.fondo,border:`1px solid ${C.borde}`,borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:14,color:C.txt2,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Lato',sans-serif" }}>‹</button>
            <span style={{ fontSize:13,fontWeight:700,color:C.txt,minWidth:100,textAlign:"center" }}>{monthName(mesVista)} {año}</span>
            <button onClick={() => setMesVista(i => Math.min(11, i+1))}
              style={{ background:C.fondo,border:`1px solid ${C.borde}`,borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:14,color:C.txt2,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Lato',sans-serif" }}>›</button>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:threeColumns, gap:isMobile?12:16 }}>

          {/* Fijos */}
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"8px 12px",background:C.cyanLight,borderRadius:10,border:`1px solid ${C.cyan}33` }}>
              <div style={{ width:10,height:10,borderRadius:"50%",background:C.cyan,flexShrink:0 }}/>
              <span style={{ fontSize:12,fontWeight:700,color:C.cyan,textTransform:"uppercase",letterSpacing:"0.6px" }}>{t("Fixed income")}</span>
            </div>
            <div style={{ display:"grid", gap:5 }}>
              {detalleIngresosMes.map(d => (
                <div key={d.nombre} style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"8px 12px",background:C.fondo,borderRadius:9,border:`1px solid ${C.borde}` }}>
                  <span style={{ color:C.txt2 }}>{d.nombre}</span>
                  <span style={{ fontWeight:700,color:Number(d.importe || 0)<0?C.error:C.txt }}>{fmt(d.importe)}</span>
                </div>
              ))}
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"9px 12px",background:C.cyan,borderRadius:9,color:"white",marginTop:2 }}>
                <span style={{ fontWeight:700 }}>{t("Monthly total")}</span><span style={{ fontWeight:700 }}>{fmt(ingresosFijosResumen)}</span>
              </div>
            </div>
          </div>

          {/* Variables */}
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"8px 12px",background:C.lavLight,borderRadius:10,border:`1px solid ${C.lavender}33` }}>
              <div style={{ width:10,height:10,borderRadius:"50%",background:C.lavender,flexShrink:0 }}/>
              <span style={{ fontSize:12,fontWeight:700,color:C.lavender,textTransform:"uppercase",letterSpacing:"0.6px" }}>{t("Variable income")}</span>
            </div>
            <div style={{ display:"grid", gap:5 }}>
              {ingresosVariablesMes.map(v => (
                <div key={v.key} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,padding:"8px 12px",background:v.bg,borderRadius:9,border:`1px solid ${v.color}33` }}>
                  <span style={{ color:v.color }}>{v.emoji} {t(v.label)}</span>
                  <span style={{ fontWeight:700,color:v.color }}>{fmt(v.val)}</span>
                </div>
              ))}
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"9px 12px",background:C.lavender,borderRadius:9,color:"white",marginTop:2 }}>
                <span style={{ fontWeight:700 }}>{t("This month total")}</span><span style={{ fontWeight:700 }}>{fmt(datosMes[mesVista]?.ingresos_var_total||0)}</span>
              </div>
            </div>
          </div>

          {/* Palancas */}
          <div>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,padding:"8px 12px",background:C.sageLight,borderRadius:10,border:`1px solid ${C.sage}44` }}>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <div style={{ width:10,height:10,borderRadius:"50%",background:C.sage,flexShrink:0 }}/>
                <span style={{ fontSize:12,fontWeight:700,color:C.sageDark,textTransform:"uppercase",letterSpacing:"0.6px" }}>{t("Levers")}</span>
              </div>
              <button onClick={()=>setModalPalanca({ mes:prefVista })} style={{ background:C.sage,color:"white",border:"none",borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Lato',sans-serif" }}>+ {t("New")}</button>
            </div>
            <div style={{ display:"grid", gap:6 }}>
              {palancasMesVista.length === 0 && <div style={{ textAlign:"center",padding:"20px 0",fontSize:12,color:C.txt2 }}>{t("No levers yet")}</div>}
              {palancasMesVista.map(p => {
                const sub = SUBCAT_VAR[p.subcategoria];
                return (
                  <div key={p.id} style={{ padding:"9px 12px",background:p.activa?C.sageLight:C.fondo,borderRadius:10,border:`1px solid ${p.activa?C.sage+"66":C.borde}`,transition:"all 0.2s" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12,fontWeight:700,color:C.txt,display:"flex",alignItems:"center",gap:5 }}><span>{sub?.emoji}</span> {p.nombre}</div>
                        <div style={{ fontSize:10,color:C.txt2,marginTop:2 }}>{labelMes(p.mes)} · {fmt(p.importe)}</div>
                      </div>
                      <button onClick={()=>setModalPalanca(p)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:13,color:C.txt2,padding:"0 4px" }}>✏️</button>
                    </div>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <span style={{ fontSize:10,padding:"2px 8px",borderRadius:10,background:sub?.bg,color:sub?.color,fontWeight:600 }}>{t(sub?.label || "")}</span>
                      <button onClick={()=>togglePalanca(p.id)}
                        style={{ display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Lato',sans-serif",background:p.activa?C.sage:"white",color:p.activa?"white":C.txt2,border:`1px solid ${p.activa?C.sage:C.borde}`,transition:"all 0.2s" }}>
                        <span style={{ width:14,height:14,borderRadius:"50%",background:p.activa?"white":C.borde,display:"inline-block",flexShrink:0 }}/>
                        {p.activa?t("Active"):t("Activate")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── GASTOS VARIABLES DEL MES ── */}
      <SeccionGastosVariables eventos={eventos} viajes={viajes} proyectos={proyectos} año={año} mesActual={mesActual} mesSeleccionado={mesVista} setMesSeleccionado={setMesVista} suministros={suministros} setSuministros={setSuministros} gastosVariables={gastosVariables} setGastosVariables={setGastosVariables} setDeudas={setDeudas}/>

      {/* ── GRÁFICO MENSUAL APILADO ── */}
      <div style={cardN(isMobile ? { padding:"14px 12px" } : undefined)}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4,flexDirection:isMobile?"column":"row",gap:isMobile?8:12 }}>
          <div>
            <div style={{ fontSize:16,fontWeight:700,color:C.txt }}>{t("Layered expenses")} - {año}</div>
            <div style={{ fontSize:12,color:C.txt2,marginTop:2 }}>{t("Hover each bar · future months are gray estimates")}</div>
          </div>
          <div style={{ display:"flex",gap:12,alignItems:"center",flexWrap:"wrap" }}>
            {expenseLayers.map(l=>(
              <button key={l.key} onClick={() => selectExplorer(l.key)}
                style={{ display:"flex",alignItems:"center",gap:4,border:`1px solid ${explorerLayer===l.key?`${l.color}55`:"transparent"}`,background:explorerLayer===l.key?l.bg:"transparent",borderRadius:8,padding:"4px 6px",cursor:"pointer",fontFamily:"'Lato',sans-serif" }}>
                <div style={{ width:10,height:10,borderRadius:2,background:l.color,flexShrink:0 }}/>
                <span style={{ fontSize:10,color:C.txt2,fontWeight:600 }}>{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX:isMobile?"auto":"visible", paddingBottom:isMobile?6:0 }}>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(12,minmax(34px,1fr))",gap:3,alignItems:"end",height:160,position:"relative",minWidth:isMobile?520:"auto" }}>
          {(() => {
            const maxG = Math.max(...datosMes.map(d=>Math.max(d.total_gastos,d.total_ingresos)), BASE.ingresos_fijos, 1);
            const fixedPx = Math.min(138,(BASE.ingresos_fijos/maxG)*140);
            return <div style={{ position:"absolute",left:0,right:0,bottom:`${fixedPx}px`,height:1,background:C.cyan,opacity:0.5,pointerEvents:"none",zIndex:1 }}/>;
          })()}

          {datosMes.map((m,i) => {
            const maxG     = Math.max(...datosMes.map(d=>Math.max(d.total_gastos,d.total_ingresos)), BASE.ingresos_fijos, 1);
            const totalH   = Math.max(4,(m.total_gastos/maxG)*140);
            const h1       = m.total_gastos>0?(m.gasto_estructural/m.total_gastos)*totalH:0;
            const h2       = m.total_gastos>0?(m.gasto_suministros/m.total_gastos)*totalH:0;
            const gastoViajes = m.gastos_viaje || 0;
            const gastoDiscrecionalReal = Math.max(0, m.gasto_discrecional - gastoViajes);
            const h3       = m.total_gastos>0?(gastoDiscrecionalReal/m.total_gastos)*totalH:0;
            const h4       = m.total_gastos>0?(gastoViajes/m.total_gastos)*totalH:0;
            const ingresosPx = Math.min(138,(m.total_ingresos/maxG)*140);
            const sel      = mesDetalle===i;
            const op       = m.esFuturo?0.35:1;
            const showTip  = hoveredMes===i;
            return (
              <div key={i}
                style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",position:"relative" }}
                onClick={()=>setMesDetalle(mesDetalle===i?null:i)}
                onMouseEnter={()=>setHoveredMes(i)}
                onMouseLeave={()=>setHoveredMes(null)}>
                {showTip && (
                  <div style={{ position:"absolute",bottom:"100%",left:"50%",transform:"translateX(-50%)",zIndex:100,background:"#1a1a2e",borderRadius:10,padding:"10px 12px",minWidth:160,marginBottom:6,pointerEvents:"none",boxShadow:"0 4px 16px rgba(0,0,0,0.3)" }}>
                    <div style={{ fontSize:11,fontWeight:700,color:"white",marginBottom:6 }}>{monthName(i)} {año}{m.esFuturo?` · ${t("estimated")}`:""}</div>
                    {[
                      {l:`1 ${t("Structural")}`,  v:fmt(m.gasto_estructural),  c:"#94a3b8"},
                      {l:`2 ${t("Utilities")}`,  v:fmt(m.gasto_suministros),  c:"#fbbf24"},
                      {l:`3 ${t("Discretionary")}`, v:fmt(gastoDiscrecionalReal), c:C.lavender},
                      {l:`4 ${t("Trips")}`, v:fmt(gastoViajes), c:COLOR_VIAJE},
                      {l:t("Total income"),v:fmt(m.total_ingresos),    c:C.exito},
                    ].map(x=>(
                      <div key={x.l} style={{ display:"flex",justifyContent:"space-between",gap:12 }}>
                        <span style={{ fontSize:10,color:"rgba(255,255,255,0.5)" }}>{x.l}</span>
                        <span style={{ fontSize:10,fontWeight:700,color:x.c }}>{x.v}</span>
                      </div>
                    ))}
                    <div style={{ height:1,background:"rgba(255,255,255,0.1)",margin:"4px 0" }}/>
                    <div style={{ display:"flex",justifyContent:"space-between",gap:12 }}>
                      <span style={{ fontSize:10,color:"rgba(255,255,255,0.5)" }}>{t("Balance")}</span>
                      <span style={{ fontSize:10,fontWeight:700,color:m.saldo>=0?C.exito:C.error }}>{fmt(m.saldo)}</span>
                    </div>
                    <div style={{ position:"absolute",bottom:-5,left:"50%",transform:"translateX(-50%)",width:10,height:10,background:"#1a1a2e",clipPath:"polygon(0 0,100% 0,50% 100%)" }}/>
                  </div>
                )}
                <div style={{ position:"absolute",left:0,right:0,bottom:`${ingresosPx}px`,height:2,borderTop:`2px dashed ${m.esFuturo?"#9ca3af":C.exito}`,opacity:m.esFuturo?0.3:0.8,pointerEvents:"none",zIndex:2 }}/>
                <div style={{ width:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",height:140,borderRadius:"4px 4px 0 0",overflow:"hidden",opacity:op,outline:sel?`2px solid ${C.cyan}`:"2px solid transparent" }}>
                  <div style={{ width:"100%",height:`${h4}px`,background:m.esFuturo?"#6b7280":COLOR_VIAJE,flexShrink:0 }}/>
                  <div style={{ width:"100%",height:`${h3}px`,background:m.esFuturo?"#9ca3af":C.lavender,flexShrink:0 }}/>
                  <div style={{ width:"100%",height:`${h2}px`,background:m.esFuturo?"#d1d5db":"#d97706",flexShrink:0 }}/>
                  <div style={{ width:"100%",height:`${h1}px`,background:m.esFuturo?"#e5e7eb":"#64748b",flexShrink:0 }}/>
                </div>
                <div style={{ fontSize:8,fontWeight:700,color:m.saldo>=0?C.sageDark:C.error,opacity:op,textAlign:"center",whiteSpace:"nowrap" }}>
                  {m.total_gastos>0?fmt(m.saldo).replace("€","").trim():""}
                </div>
                <div style={{ fontSize:9,color:m.esActual?C.cyan:C.txt2,fontWeight:m.esActual?700:400 }}>{monthName(i, "short")}</div>
              </div>
            );
          })}
        </div>
        </div>

        {/* Detalle al click */}
        {detalle && (
          <div style={{ marginTop:16,padding:16,background:C.fondo,borderRadius:12,border:`1px solid ${C.borde}` }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
              <span style={{ fontWeight:700,fontSize:15,color:C.txt }}>{monthName(detalle.mes)} {año}{detalle.esFuturo?` · ${t("estimated")}`:""}</span>
              <span style={{ fontWeight:700,fontSize:18,color:detalle.saldo>=0?C.sageDark:C.error }}>{fmt(detalle.saldo)}</span>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:expenseLayerColumns,gap:8,marginBottom:12 }}>
              {[
                {key:"estructural", l:`1 ${t("Structural")}`,  v:fmt(detalle.gasto_estructural),  c:"#64748b", bg:"#f8fafc", sub:`${t("Fixed expenses")} ${fmt(BASE.monthlyOverrides?.[detalle.pref]?.fixedExpenses ?? BASE.gastos_fijos)} + ${t("Debt")} ${fmt(detalle.gasto_deudas)}`},
                {key:"suministros", l:`2 ${t("Utilities")}`,  v:fmt(detalle.gasto_suministros),  c:"#d97706", bg:"#fef3c7", sub:"Power, gas, water, internet..."},
                {key:"discrecional", l:`3 ${t("Discretionary")}`, v:fmt(Math.max(0, detalle.gasto_discrecional - (detalle.gastos_viaje || 0))), c:C.lavender,bg:C.lavLight,sub:`${t("Calendar")} ${fmt(detalle.gastos_var)}`},
                {key:"viajes", l:`4 ${t("Trips")}`, v:fmt(detalle.gastos_viaje), c:COLOR_VIAJE,bg:BG_VIAJE,sub:t("Expense breakdown")},
              ].map(x=>(
                <button key={x.l} onClick={() => selectExplorer(x.key)}
                  style={{ textAlign:"left",background:x.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${explorerLayer===x.key?x.c:`${x.c}33`}`,cursor:"pointer",fontFamily:"'Lato',sans-serif" }}>
                  <div style={{ fontSize:10,color:x.c,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4 }}>{x.l}</div>
                  <div style={{ fontSize:18,fontWeight:700,color:x.c,fontFamily:"'Playfair Display',serif" }}>{x.v}</div>
                  <div style={{ fontSize:10,color:x.c,opacity:0.7,marginTop:3 }}>{x.sub}</div>
                </button>
              ))}
            </div>
            {detalle.palancasMes.length > 0 && (
              <div style={{ padding:"10px 12px",background:C.sageLight,borderRadius:10,border:`1px solid ${C.sage}44`,marginBottom:10 }}>
                <div style={{ fontSize:11,fontWeight:700,color:C.sageDark,marginBottom:6 }}>✨ {t("Active levers")}</div>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                  {detalle.palancasMes.map(p=>(
                    <span key={p.id} style={{ fontSize:11,padding:"3px 10px",borderRadius:10,background:"white",color:C.sageDark,fontWeight:600,border:`1px solid ${C.sage}` }}>{p.nombre}: {fmt(p.importe)}</span>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <span style={{ fontSize:11,color:C.txt2,flexShrink:0 }}>{t("Pressure")}: {detalle.presion}%</span>
              <div style={{ flex:1,height:6,background:C.borde,borderRadius:6,overflow:"hidden" }}>
                <div style={{ width:`${detalle.presion}%`,height:"100%",background:detalle.presion>85?C.error:detalle.presion>70?C.warn:C.exito,borderRadius:6,transition:"width 0.5s" }}/>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── EXPLORADOR DE GASTOS ── */}
      <div style={cardN(isMobile ? { padding:"14px 12px" } : undefined)}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap",marginBottom:16 }}>
          <div>
            <div style={{ fontSize:16,fontWeight:700,color:C.txt }}>🔎 {t("Expense explorer")} - {año}</div>
            <div style={{ fontSize:12,color:C.txt2,marginTop:2 }}>{selectedLayer.label} · {monthName(explorerMonth)} {año}</div>
          </div>
          <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
            {explorerLayer === "discrecional" && [
              { key:"cash", label:t("Real pressure") },
              { key:"purchase", label:t("Purchase month") },
            ].map(mode => (
              <button key={mode.key} onClick={() => setExpenseTimingMode(mode.key)}
                style={{ border:`1px solid ${expenseTimingMode===mode.key?C.cyan:C.borde}`,background:expenseTimingMode===mode.key?C.cyanLight:"white",color:expenseTimingMode===mode.key?C.cyan:C.txt2,borderRadius:9,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Lato',sans-serif" }}>
                {mode.label}
              </button>
            ))}
            {expenseLayers.map(layer => (
              <button key={layer.key} onClick={() => selectExplorer(layer.key)}
                style={{ display:"flex",alignItems:"center",gap:5,border:`1px solid ${explorerLayer===layer.key?layer.color:C.borde}`,background:explorerLayer===layer.key?layer.bg:"white",color:explorerLayer===layer.key?layer.color:C.txt2,borderRadius:9,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Lato',sans-serif" }}>
                <span style={{ width:8,height:8,borderRadius:2,background:layer.color,display:"inline-block" }}/>{layer.label}
              </button>
            ))}
          </div>
        </div>

        {renderMetricStrip(explorerMetrics, selectedLayer.color)}

        <div style={{ display:"grid",gridTemplateColumns:explorerColumns,gap:16,alignItems:"start" }}>
          <div style={{ overflowX:isMobile?"auto":"visible",minWidth:0 }}>
            {explorerLayer === "estructural" && (
              <div>
                <div style={{ fontSize:12,fontWeight:700,color:"#64748b",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px" }}>{t("Monthly evolution")}</div>
                {renderMonthlyTrend(structuralMonthly, "#64748b")}
              </div>
            )}

            {explorerLayer === "suministros" && (
              <div>
                {utilityBreakdown.length === 0 ? (
                  <div style={{ padding:24,textAlign:"center",color:C.txt2,fontSize:13,background:C.fondo,borderRadius:12 }}>{t("No utility data")}</div>
                ) : (
                  <>
                    <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
                      {utilityBreakdown.map(item => (
                        <button key={item.key} onClick={() => selectExplorer("suministros", item.key)}
                          style={{ border:`1px solid ${selectedUtility?.key===item.key?"#d97706":C.borde}`,background:selectedUtility?.key===item.key?"#fef3c7":"white",color:selectedUtility?.key===item.key?"#d97706":C.txt2,borderRadius:999,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Lato',sans-serif" }}>
                          {item.emoji} {t(item.label)} · {fmt(item.total)}
                        </button>
                      ))}
                    </div>
                    {selectedUtility && (
                      <>
                        <div style={{ fontSize:12,fontWeight:700,color:"#d97706",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px" }}>{t("Monthly evolution")} · {selectedUtility.emoji} {t(selectedUtility.label)}</div>
                        {renderMonthlyTrend(selectedUtility.monthly, "#d97706")}
                        {selectedUtility.consumoTotal > 0 && (
                          <div style={{ marginTop:16 }}>
                            <div style={{ fontSize:12,fontWeight:700,color:C.cyan,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px" }}>{t("Consumption")}</div>
                            {renderMonthlyTrend(selectedUtility.monthly, C.cyan, "consumo", selectedUtility.monthly.find(m=>m.registros?.[0]?.unidad)?.registros?.[0]?.unidad || UTILITY_UNIT_FALLBACK[selectedUtility.key] || "")}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {explorerLayer === "discrecional" && (
              <div>
                {discretionaryBreakdown.length === 0 ? (
                  <div style={{ padding:24,textAlign:"center",color:C.txt2,fontSize:13,background:C.fondo,borderRadius:12 }}>{t("No records")}</div>
                ) : (
                  <>
                    <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
                      {discretionaryBreakdown.map(item => (
                        <button key={item.key} onClick={() => selectExplorer("discrecional", item.key)}
                          style={{ border:`1px solid ${selectedCategory?.key===item.key?item.color:C.borde}`,background:selectedCategory?.key===item.key?item.bg:"white",color:selectedCategory?.key===item.key?item.color:C.txt2,borderRadius:999,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Lato',sans-serif" }}>
                          {item.emoji} {t(item.label)} · {fmt(item.sum)}
                        </button>
                      ))}
                    </div>
                    {selectedCategory && (
                      <>
                        <div style={{ fontSize:12,fontWeight:700,color:selectedCategory.color,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px" }}>{t("Monthly evolution")} · {selectedCategory.emoji} {t(selectedCategory.label)}</div>
                        {renderMonthlyTrend(selectedCategory.monthly, selectedCategory.color)}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {explorerLayer === "viajes" && (
              <div>
                {tripBreakdown.length === 0 ? (
                  <div style={{ padding:24,textAlign:"center",color:C.txt2,fontSize:13,background:C.fondo,borderRadius:12 }}>{t("No trips this month")}</div>
                ) : (
                  <>
                    <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
                      <button onClick={() => selectExplorer("viajes")}
                        style={{ border:`1px solid ${!selectedTrip?COLOR_VIAJE:C.borde}`,background:!selectedTrip?BG_VIAJE:"white",color:!selectedTrip?COLOR_VIAJE:C.txt2,borderRadius:999,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Lato',sans-serif" }}>
                        {t("All")} · {fmt(tripBreakdown.reduce((sum, trip)=>sum+trip.total,0))}
                      </button>
                      {tripBreakdown.map(trip => (
                        <button key={trip.id} onClick={() => selectExplorer("viajes", trip.id)}
                          style={{ border:`1px solid ${selectedTrip?.id===trip.id?COLOR_VIAJE:C.borde}`,background:selectedTrip?.id===trip.id?BG_VIAJE:"white",color:selectedTrip?.id===trip.id?COLOR_VIAJE:C.txt2,borderRadius:999,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Lato',sans-serif" }}>
                          {trip.emoji || "✈️"} {trip.nombre} · {fmt(trip.total)}
                        </button>
                      ))}
                    </div>
                    <div style={{ fontSize:12,fontWeight:700,color:COLOR_VIAJE,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px" }}>{t("Monthly evolution")} · {selectedTrip ? selectedTrip.nombre : t("All")}</div>
                    {renderMonthlyTrend(selectedTrip ? selectedTrip.monthly : tripMonthlyTotal, COLOR_VIAJE)}
                  </>
                )}
              </div>
            )}
          </div>

          <div style={{ background:C.fondo,borderRadius:12,border:`1px solid ${C.borde}`,padding:14,minWidth:0 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:12 }}>
              <span style={{ fontSize:12,fontWeight:700,color:selectedLayer.color,textTransform:"uppercase",letterSpacing:"0.5px" }}>{t("Selected month")}</span>
              <span style={{ fontSize:12,fontWeight:700,color:C.txt }}>{monthName(explorerMonth)} {año}</span>
            </div>

            {explorerLayer === "estructural" && (() => {
              const month = datosMes[explorerMonth];
              const fixedExpenses = BASE.monthlyOverrides?.[month.pref]?.fixedExpenses ?? BASE.gastos_fijos;
              const activeDebts = deudas
                .map(deuda => ({ ...deuda, cuotaMes:calcularCuotaDeudaEnMes(deuda, month.pref) }))
                .filter(deuda => deuda.cuotaMes > 0);
              return (
                <div style={{ display:"grid",gap:10 }}>
                  <div style={{ display:"flex",justifyContent:"space-between" }}><span style={{ color:C.txt2,fontSize:12 }}>{t("Fixed expenses")}</span><strong>{fmt(fixedExpenses)}</strong></div>
                  <div style={{ display:"flex",justifyContent:"space-between" }}><span style={{ color:C.txt2,fontSize:12 }}>{t("Debt")}</span><strong>{fmt(month.gasto_deudas)}</strong></div>
                  {activeDebts.length > 0 && (
                    <div style={{ height:1,background:C.borde }}/>
                  )}
                  {activeDebts.map(deuda => (
                    <div key={deuda.id} style={{ background:"white",borderRadius:9,padding:"8px 10px",border:`1px solid ${C.borde}` }}>
                      <div style={{ display:"flex",justifyContent:"space-between",gap:10 }}><span style={{ fontSize:12,fontWeight:700,color:deuda.origen===FUNDING_SOURCES.CREDIT_INSTALLMENTS?C.lavender:C.txt }}>{deuda.nombre}</span><strong style={{ fontSize:12 }}>{fmt(deuda.cuotaMes)}</strong></div>
                      <div style={{ fontSize:10,color:C.txt2,marginTop:3 }}>{[deuda.tarjetaNombre, deuda.tarjetaDiaCierre ? `${t("Card closing day")} ${deuda.tarjetaDiaCierre}` : "", deuda.compraMes ? `${t("Purchase month")} ${labelMes(deuda.compraMes)}` : "", `${deuda.cuotas_totales} ${t("Installments").toLowerCase()}`].filter(Boolean).join(" · ")}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {explorerLayer === "suministros" && selectedUtility && (() => {
              const month = selectedUtility.monthly[explorerMonth];
              const records = month?.registros || [];
              const unit = records[0]?.unidad || UTILITY_UNIT_FALLBACK[selectedUtility.key] || "";
              const price = month?.consumo > 0 ? month.importe / month.consumo : null;
              return (
                <div style={{ display:"grid",gap:10 }}>
                  <div style={{ display:"flex",justifyContent:"space-between" }}><span style={{ color:C.txt2,fontSize:12 }}>{t("Amount (€)")}</span><strong>{fmt(month?.importe || 0)}</strong></div>
                  {month?.consumo > 0 && <div style={{ display:"flex",justifyContent:"space-between" }}><span style={{ color:C.txt2,fontSize:12 }}>{t("Consumption")}</span><strong>{numberFmt(month.consumo)} {unit}</strong></div>}
                  {price !== null && unit && <div style={{ display:"flex",justifyContent:"space-between" }}><span style={{ color:C.txt2,fontSize:12 }}>€/{unit}</span><strong>{price.toFixed(2)}</strong></div>}
                  <div style={{ height:1,background:C.borde }}/>
                  {records.length === 0 ? <div style={{ fontSize:12,color:C.txt2 }}>{t("No records")}</div> : records.map(record => (
                    <div key={record.id || `${record.mes}-${record.tipo}`} style={{ background:"white",borderRadius:9,padding:"8px 10px",border:`1px solid ${C.borde}` }}>
                      <div style={{ display:"flex",justifyContent:"space-between",gap:10 }}><span style={{ fontSize:12,fontWeight:700,color:"#d97706" }}>{record.proveedor || t(selectedUtility.label)}</span><strong style={{ fontSize:12 }}>{fmt(record.importe)}</strong></div>
                      <div style={{ fontSize:10,color:C.txt2,marginTop:3 }}>{[record.frecuencia, utilityAvailabilityDate(record) ? `${t("Money needed")} ${utilityAvailabilityDate(record).split("-").reverse().join("/")}` : "", record.periodoInicio && record.periodoFin ? `${record.periodoInicio} → ${record.periodoFin}` : "", record.notas].filter(Boolean).join(" · ")}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {explorerLayer === "discrecional" && selectedCategory && (() => {
              const month = selectedCategory.monthly[explorerMonth];
              const records = [
                ...(month?.eventItems || []).map(item => ({ id:item.id, label:item.titulo, amount:item.importeExplorer ?? explorerExpenseAmount(item, month.pref), detail:formatCardDetail(item, month.pref) })),
                ...(month?.expenseItems || []).map(item => ({ id:item.id, label:item.titulo, amount:item.importeExplorer ?? explorerExpenseAmount(item, month.pref), detail:formatCardDetail(item, month.pref) })),
                ...(month?.projectItems || []).map(item => ({ id:item.id, label:item.titulo, amount:item.gasto })),
              ];
              return (
                <div style={{ display:"grid",gap:10 }}>
                  <div style={{ display:"flex",justifyContent:"space-between" }}><span style={{ color:C.txt2,fontSize:12 }}>{t("Selected month")}</span><strong>{fmt(month?.importe || 0)}</strong></div>
                  {records.length === 0 ? <div style={{ fontSize:12,color:C.txt2 }}>{t("No records")}</div> : records.map(record => (
                    <div key={record.id || record.label} style={{ background:"white",borderRadius:9,padding:"8px 10px",border:`1px solid ${C.borde}` }}>
                      <div style={{ display:"flex",justifyContent:"space-between",gap:10 }}>
                        <span style={{ fontSize:12,color:C.txt,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{record.label}</span>
                        <strong style={{ fontSize:12,color:selectedCategory.color }}>{fmt(record.amount)}</strong>
                      </div>
                      {record.detail && <div style={{ fontSize:10,color:C.txt2,marginTop:3,lineHeight:1.35 }}>{record.detail}</div>}
                    </div>
                  ))}
                </div>
              );
            })()}

            {explorerLayer === "viajes" && (() => {
              const totalTrips = tripBreakdown.reduce((sum, trip)=>sum+trip.total,0);
              if (tripBreakdown.length === 0) return <div style={{ fontSize:12,color:C.txt2 }}>{t("No records")}</div>;
              if (selectedTrip) {
                const pct = selectedTrip.presupuesto > 0 ? Math.min(100, (selectedTrip.total / selectedTrip.presupuesto) * 100) : 0;
                const entries = Object.entries(selectedTrip.gastos || {}).filter(([, value]) => Number(value || 0) > 0);
                return (
                  <div style={{ display:"grid",gap:10 }}>
                    <div style={{ display:"flex",justifyContent:"space-between" }}><span style={{ color:C.txt2,fontSize:12 }}>{selectedTrip.nombre}</span><strong>{fmt(selectedTrip.total)}</strong></div>
                    {selectedTrip.presupuesto > 0 && <div style={{ height:6,background:C.borde,borderRadius:6,overflow:"hidden" }}><div style={{ width:`${pct}%`,height:"100%",background:COLOR_VIAJE,borderRadius:6 }}/></div>}
                    {selectedTrip.inicio && <div style={{ fontSize:11,color:C.txt2 }}>{selectedTrip.inicio.split("-").reverse().join("/")} → {selectedTrip.fin?.split("-").reverse().join("/")} · {daysBetween(selectedTrip.inicio,selectedTrip.fin)}n</div>}
                    <div style={{ height:1,background:C.borde }}/>
                    {entries.length === 0 ? <div style={{ fontSize:12,color:C.txt2 }}>{t("No records")}</div> : entries.map(([key, value]) => (
                      <div key={key} style={{ display:"flex",justifyContent:"space-between",background:"white",borderRadius:9,padding:"8px 10px",border:`1px solid ${C.borde}` }}>
                        <span style={{ fontSize:12,color:C.txt }}>{key}</span>
                        <strong style={{ fontSize:12,color:COLOR_VIAJE }}>{fmt(Number(value || 0))}</strong>
                      </div>
                    ))}
                  </div>
                );
              }
              return (
                <div style={{ display:"grid",gap:10 }}>
                  {tripBreakdown.map(trip => {
                    const pct = trip.presupuesto > 0 ? Math.min(100, (trip.total / trip.presupuesto) * 100) : 0;
                    return (
                      <button key={trip.id} onClick={() => selectExplorer("viajes", trip.id)}
                        style={{ textAlign:"left",background:"white",borderRadius:9,padding:"8px 10px",border:`1px solid ${C.borde}`,cursor:"pointer",fontFamily:"'Lato',sans-serif" }}>
                        <div style={{ display:"flex",justifyContent:"space-between",gap:10 }}><span style={{ fontSize:12,fontWeight:700,color:COLOR_VIAJE }}>{trip.emoji || "✈️"} {trip.nombre}</span><strong style={{ fontSize:12,color:C.txt }}>{fmt(trip.total)}</strong></div>
                        {trip.presupuesto > 0 && <div style={{ height:4,background:C.borde,borderRadius:4,overflow:"hidden",marginTop:6 }}><div style={{ width:`${pct}%`,height:"100%",background:COLOR_VIAJE,borderRadius:4 }}/></div>}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── PROYECCIÓN SIN DEUDAS ── */}
      {(() => {
        const hoy   = `${año}-${String(mesActual+1).padStart(2,"0")}`;
        const meses = Array.from({length:30},(_,i)=>addMeses(hoy,i));
        const filas = meses.map(pref=>{
          const [ay,am]=pref.split("-").map(Number);
          const detalleDeudas=deudas.map(d=>{
            const [iy,im]=d.mes_inicio.split("-").map(Number);
            const offset=(ay-iy)*12+(am-im);
            const activa=offset>=d.cuota_actual&&offset<d.cuotas_totales;
            const esUltima=offset===d.cuotas_totales-1;
            const pendientes=Math.max(0,d.cuotas_totales-offset);
            return{...d,activa,esUltima,pendientes,cuotaMes:activa?d.cuota+(d.interes_mensual||0):0};
          });
          const totalCuotas=detalleDeudas.reduce((a,d)=>a+d.cuotaMes,0);
          const saldoLibre=BASE.ingresos_fijos-BASE.gastos_fijos-totalCuotas;
          const liberaciones=detalleDeudas.filter(d=>d.esUltima);
          return{pref,detalleDeudas,totalCuotas,saldoLibre,liberaciones};
        });
        const totalLiberado=deudas.reduce((a,d)=>a+d.cuota+(d.interes_mensual||0),0);
        const saldoHoy=BASE.ingresos_fijos-BASE.gastos_fijos-(filas[0]?.totalCuotas||0);
        const saldoFinal=BASE.ingresos_fijos-BASE.gastos_fijos;
        return(
          <div style={{ ...cardN(isMobile ? { padding:"14px 12px" } : undefined),background:"linear-gradient(135deg,#0f2420,#1a3d30)",border:"none" }}>
            <div style={{ fontSize:16,fontWeight:700,color:"white",marginBottom:4 }}>🔮 {t("Monthly debt-free projection")}</div>
            <div style={{ fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:16 }}>{t("Month-by-month payment release · impact on free balance")}</div>
            <div style={{ display:"grid",gridTemplateColumns:threeColumns,gap:12,marginBottom:20 }}>
              {[
                {l:t("Free balance today"),       v:fmt(saldoHoy),      sub:t("with all payments active")},
                {l:t("Free balance without debt"),v:fmt(saldoFinal),    sub:t("once everything is paid off")},
                {l:t("Total released"),   v:fmt(totalLiberado), sub:t("per month when finished")},
              ].map(x=>(
                <div key={x.l} style={{ background:"rgba(255,255,255,0.08)",borderRadius:12,padding:"14px 16px",textAlign:"center",border:"1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ fontSize:10,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:"0.6px" }}>{x.l}</div>
                  <div style={{ fontSize:20,fontWeight:700,color:C.exito,fontFamily:"'Playfair Display',serif",marginTop:6 }}>{x.v}</div>
                  <div style={{ fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:3 }}>{x.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ borderRadius:12,overflowX:"auto",overflowY:"hidden",border:"1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ minWidth:isMobile?Math.max(620, 380 + deudas.length * 92):"auto" }}>
              <div style={{ display:"grid",gridTemplateColumns:debtProjectionColumns,gap:0,background:"rgba(255,255,255,0.1)",padding:"8px 14px" }}>
                <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase" }}>{t("Month")}</div>
                {deudas.map(d=><div key={d.id} style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",textAlign:"center" }}>{d.nombre}</div>)}
                <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",textAlign:"right" }}>{t("Payments")}</div>
                <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",textAlign:"right" }}>{t("Free balance")}</div>
              </div>
              <div style={{ maxHeight:isMobile?340:400,overflowY:"auto" }}>
                {filas.map((f,fi)=>{
                  const esHoy=fi===0;
                  const hayLib=f.liberaciones.length>0;
                  const todoSaldado=f.detalleDeudas.every(d=>!d.activa)&&fi>0;
                  if(todoSaldado&&fi>filas.findIndex(x=>x.detalleDeudas.every(d=>!d.activa))) return null;
                  return(
                    <div key={f.pref}>
                      <div style={{ display:"grid",gridTemplateColumns:debtProjectionColumns,gap:0,padding:"9px 14px",background:hayLib?"rgba(117,223,144,0.12)":esHoy?"rgba(255,255,255,0.06)":fi%2===0?"rgba(255,255,255,0.02)":"transparent",borderTop:"1px solid rgba(255,255,255,0.05)",alignItems:"center" }}>
                        <div style={{ fontSize:12,fontWeight:esHoy?700:400,color:esHoy?C.cyan:"rgba(255,255,255,0.7)" }}>{esHoy?"→ ":""}{monthName(+f.pref.split("-")[1]-1, "short")} {f.pref.split("-")[0]}</div>
                        {f.detalleDeudas.map(d=>(
                          <div key={d.id} style={{ textAlign:"center" }}>
                            {d.esUltima?<span style={{ fontSize:11,fontWeight:700,color:C.exito }}>✓ {t("last")}</span>
                              :d.activa?<div><div style={{ fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.8)" }}>{fmt(d.cuotaMes)}</div><div style={{ fontSize:9,color:"rgba(255,255,255,0.35)",marginTop:1 }}>{d.pendientes-1} {t("pending")}</div></div>
                              :<span style={{ fontSize:13,color:"rgba(255,255,255,0.2)" }}>—</span>}
                          </div>
                        ))}
                        <div style={{ textAlign:"right",fontSize:12,fontWeight:700,color:f.totalCuotas>0?"#fbbf24":"rgba(255,255,255,0.3)" }}>{f.totalCuotas>0?fmt(f.totalCuotas):"—"}</div>
                        <div style={{ textAlign:"right",fontSize:13,fontWeight:700,color:f.saldoLibre>0?C.exito:C.error,fontFamily:"'Playfair Display',serif" }}>{fmt(f.saldoLibre)}</div>
                      </div>
                      {hayLib&&<div style={{ padding:"6px 14px",background:"rgba(117,223,144,0.15)",borderTop:"1px solid rgba(117,223,144,0.2)" }}><span style={{ fontSize:11,color:C.exito,fontWeight:700 }}>🎉 {f.liberaciones.map(d=>d.nombre).join(" + ")} - {t("final payment")} · {t("is released")} {fmt(f.liberaciones.reduce((a,d)=>a+d.cuota+(d.interes_mensual||0),0))}{t("/month")}</span></div>}
                    </div>
                  );
                })}
              </div>
              </div>
            </div>
          </div>
        );
      })()}

      {modalPalanca !== null && <ModalPalanca palanca={modalPalanca?.id?modalPalanca:undefined} defaults={modalPalanca?.id?{}:modalPalanca} onSave={guardarPalanca} onDelete={eliminarPalanca} onClose={()=>setModalPalanca(null)}/>}
      {modalDeuda   !== null && <ModalDeuda   deuda={modalDeuda?.id?modalDeuda:undefined}       onSave={guardarDeuda}   onDelete={eliminarDeuda}   onClose={()=>setModalDeuda(null)}/>}
    </div>
  );
}

const calcularDeudaPendienteMes = (deudas, pref) => {
  const [añoObjetivo, mesObjetivo] = pref.split("-").map(Number);
  return deudas.reduce((total, deuda) => {
    const [añoInicio, mesInicio] = deuda.mes_inicio.split("-").map(Number);
    const offset = (añoObjetivo - añoInicio) * 12 + (mesObjetivo - mesInicio);
    const cuotasTotales = Number(deuda.cuotas_totales || 0);
    const cuotasPendientes = offset < 0 ? cuotasTotales : Math.max(0, cuotasTotales - offset);
    return total + cuotasPendientes * (Number(deuda.cuota || 0) + Number(deuda.interes_mensual || 0));
  }, 0);
};

const calcularCuotaDeudaEnMes = (deuda, pref) => {
  const [añoObjetivo, mesObjetivo] = pref.split("-").map(Number);
  const [añoInicio, mesInicio] = deuda.mes_inicio.split("-").map(Number);
  const offset = (añoObjetivo - añoInicio) * 12 + (mesObjetivo - mesInicio);
  const activa = offset >= Number(deuda.cuota_actual || 0) && offset < Number(deuda.cuotas_totales || 0);
  return activa ? Number(deuda.cuota || 0) + Number(deuda.interes_mensual || 0) : 0;
};
