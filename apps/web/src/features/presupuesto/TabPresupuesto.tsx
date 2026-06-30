import { useCallback, useMemo, useState } from "react";
import { FUNDING_SOURCES, annualCommitmentMonthlyReserve, annualCommitmentReserveWindowForYear, buildCreditCardDebtFromExpense, calculateAnnualCommitmentCashImpactForMonth, calculateAnnualCommitmentReserveForMonth, calculateExpenseCashImpactForMonth, calculateLeverBudgetAmount, calculateLeverCalendarFit, expenseFirstChargeMonth, expensePurchaseMonth, leverCalendarMonths, projectExpenseItem, simulatePaymentScenarios, tripExpenseItems, utilityAvailabilityDate, utilityCashMonth } from "@sofi-marqui/domain";
import Modal from "../../components/Modal.tsx";
import { CATEGORIAS, SUBCAT_VAR, SUMINISTROS_TIPOS, COLOR_VIAJE, BG_VIAJE, categoriaEventoKey } from "../../constants/categorias.ts";
import { C, cardN, inputS } from "../../constants/colores.ts";
import { MESES } from "../../constants/meses.ts";
import { fmt, labelMes } from "../../utils/format.ts";
import { todayISO, addMeses, daysBetween } from "../../utils/dates.ts";
import { useDatosMes, calcCuotaDeudaMes } from "../../hooks/useDatosMes.ts";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useI18n } from "../../i18n.tsx";
import { BASE } from "../../data/demo.ts";
import AnalizadorPresionFinanciera from "./AnalizadorPresionFinanciera.tsx";
import ActionIconButton from "./ActionIconButton.tsx";
import PanelDeudas from "./PanelDeudas.tsx";
import SeccionGastosVariables from "./SeccionGastosVariables.tsx";
import { actualizarIngresosFijosDesdeMes, editarLineaIngresoEnMes, eliminarLineaIngresoEnMes, fechaAcreditacionIngresoEnMes, lineaIngresoActivaEnMes } from "./incomeTimeline.ts";
import ModalPalanca from "./modals/ModalPalanca.tsx";
import ModalDeuda from "./modals/ModalDeuda.tsx";

const UTILITY_UNIT_FALLBACK = { luz:"kWh", gas:"m3", agua:"m3" };
const ANNUAL_COMMITMENT_TYPES = [
  { key:"seguro", label:"Seguro" },
  { key:"impuesto", label:"Impuesto" },
  { key:"coche", label:"Coche" },
  { key:"vivienda", label:"Vivienda" },
  { key:"suscripcion", label:"Suscripción" },
  { key:"salud", label:"Salud" },
  { key:"otro", label:"Otro" },
];
const ANNUAL_FREQUENCIES = [
  { key:"anual", label:"Anual" },
  { key:"semestral", label:"Semestral" },
  { key:"trimestral", label:"Trimestral" },
];
const PAYMENT_SOURCE_OPTIONS = [
  { key:FUNDING_SOURCES.MONTH_INCOME, label:"Efectivo" },
  { key:FUNDING_SOURCES.CREDIT_NEXT_MONTH, label:"Tarjeta mes siguiente" },
  { key:FUNDING_SOURCES.CREDIT_INSTALLMENTS, label:"Tarjeta en cuotas" },
];

const calcularOffsetMesDeuda = (deuda, pref) => {
  if (!deuda?.mes_inicio || !pref) return null;
  const [añoObjetivo, mesObjetivo] = pref.split("-").map(Number);
  const [añoInicio, mesInicio] = deuda.mes_inicio.split("-").map(Number);
  if (![añoObjetivo, mesObjetivo, añoInicio, mesInicio].every(Number.isFinite)) return null;
  return (añoObjetivo - añoInicio) * 12 + (mesObjetivo - mesInicio);
};

const deudaVisibleEnMes = (deuda, pref) => {
  const offset = calcularOffsetMesDeuda(deuda, pref);
  const cuotasTotales = Number(deuda?.cuotas_totales || 0);
  return offset === null || cuotasTotales <= 0 || offset < cuotasTotales;
};

export default function TabPresupuesto({ base = BASE, setBase, eventos, bloqueos, viajes, proyectos = [], palancas, setPalancas, deudas, setDeudas, suministros, setSuministros, gastosVariables = [], setGastosVariables, compromisosAnuales = [], setCompromisosAnuales }) {
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
  const [modalCompromiso,setModalCompromiso] = useState(null);
  const [simulacionPago, setSimulacionPago] = useState({ titulo:"Gasto simulado", categoria:"otro", importe:600, fecha:todayISO, tarjetaDiaCierre:20, tarjetaNombre:"", cuotas:"3,6,12" });
  const [deudasAbiertas, setDeudasAbiertas] = useState(false);
  const [compromisosAbiertos, setCompromisosAbiertos] = useState(false);
  const [simulacionesAbiertas, setSimulacionesAbiertas] = useState(false);
  const [ultimoGastoSimulado, setUltimoGastoSimulado] = useState(null);
  const prefVista = `${año}-${String(mesVista+1).padStart(2,"0")}`;

  // ── Handlers palancas ──
  const normalizarMesPalanca = (palanca) => ({ ...palanca, mes:palanca.calendarioVinculado && palanca.fechaInicio ? palanca.fechaInicio.slice(0, 7) : palanca.mes || prefVista });
  const guardarPalanca  = (palancaDraft) => { const palanca = normalizarMesPalanca(palancaDraft); setPalancas(prev => palanca.id && prev.find(x=>x.id===palanca.id) ? prev.map(x=>x.id===palanca.id?palanca:x) : [...prev,palanca]); setModalPalanca(null); };
  const eliminarPalanca = (id) => { setPalancas(prev=>prev.filter(x=>x.id!==id)); setModalPalanca(null); };
  const togglePalanca   = (id) => setPalancas(prev=>prev.map(p=>p.id===id?normalizarMesPalanca({ ...p, activa:!p.activa }):p));

  // ── Handlers deudas ──
  const guardarDeuda    = (d) => { setDeudas(prev => d.id && prev.find(x=>x.id===d.id) ? prev.map(x=>x.id===d.id?d:x) : [...prev,d]); setModalDeuda(null); };
  const eliminarDeuda   = (id) => { setDeudas(prev=>prev.filter(x=>x.id!==id)); setModalDeuda(null); };
  const guardarCompromiso = (draft) => {
    const item = {
      ...draft,
      id:draft.id || Date.now(),
      importe:Number(draft.importe || 0),
      cuotasTarjeta:Number(draft.cuotasTarjeta || 1),
      mesesReserva:Number(draft.mesesReserva || 12),
      avisoDiasAntes:Number(draft.avisoDiasAntes || 30),
      tarjetaDiaCierre:draft.tarjetaDiaCierre ? Number(draft.tarjetaDiaCierre) : undefined,
    };

    setCompromisosAnuales?.(prev => item.id && prev.find(compromiso => String(compromiso.id) === String(item.id)) ? prev.map(compromiso => String(compromiso.id) === String(item.id) ? item : compromiso) : [...prev, item]);
    setModalCompromiso(null);
  };
  const eliminarCompromiso = (id) => { setCompromisosAnuales?.(prev => prev.filter(compromiso => String(compromiso.id) !== String(id))); setModalCompromiso(null); };

  // ── Datos calculados ──
  const { datosMes } = useDatosMes({ base, eventos, bloqueos, viajes, palancas, deudas, suministros, gastosVariables, proyectos, compromisosAnuales, año, mesActual });
  const detalle = mesDetalle !== null ? datosMes[mesDetalle] : null;
  const resumenMes = datosMes[mesVista] || datosMes[mesActual];
  const escenariosPago = useMemo(() => {
    const cuotas = String(simulacionPago.cuotas || "")
      .split(",")
      .map(value => Math.trunc(Number(value.trim() || 0)))
      .filter(value => value > 1);

    return simulatePaymentScenarios({
      amount:Number(simulacionPago.importe || 0),
      purchaseDate:simulacionPago.fecha || `${prefVista}-01`,
      cardCloseDay:simulacionPago.tarjetaDiaCierre || undefined,
      installmentOptions:cuotas.length > 0 ? cuotas : [3, 6, 12],
      horizonMonths:14,
    });
  }, [prefVista, simulacionPago]);
  const crearGastoDesdeSimulacion = useCallback((scenario) => {
    const id = Date.now() + Math.random();
    const origenFondos = scenario.origenFondos || FUNDING_SOURCES.MONTH_INCOME;
    const compraMes = scenario.compraMes || simulacionPago.fecha?.slice(0, 7) || prefVista;
    const item = {
      id,
      mes:compraMes,
      titulo:String(simulacionPago.titulo || "Gasto simulado").trim() || "Gasto simulado",
      categoria:simulacionPago.categoria || "otro",
      importe:Number(simulacionPago.importe || 0),
      origenFondos,
      cuotasTarjeta:origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? Math.max(2, Number(scenario.cuotasTarjeta || 2)) : 1,
      mesPrimerCargo:origenFondos === FUNDING_SOURCES.MONTH_INCOME ? "" : (scenario.primerImpacto || ""),
      tarjetaNombre:origenFondos === FUNDING_SOURCES.MONTH_INCOME ? "" : String(simulacionPago.tarjetaNombre || ""),
      tarjetaDiaCierre:origenFondos === FUNDING_SOURCES.MONTH_INCOME || !simulacionPago.tarjetaDiaCierre ? undefined : Number(simulacionPago.tarjetaDiaCierre),
      notas:[`Creado desde simulacion: ${scenario.label}`, `Compra ${compraMes}`].filter(Boolean).join(" · "),
    };
    const debt = buildCreditCardDebtFromExpense(item, "gastosVariables");
    const finalItem = debt ? { ...item, deudaTarjetaId:debt.id } : { ...item, deudaTarjetaId:"" };

    setGastosVariables?.(prev => [...prev, finalItem]);
    setDeudas?.(prev => debt ? [...prev.filter(deuda => !(deuda.origenColeccion === "gastosVariables" && String(deuda.origenId) === String(finalItem.id))), debt] : prev);
    const focusMonth = scenario.primerImpacto || compraMes;
    if (Number(focusMonth.slice(0, 4)) === año) setMesVista(Math.min(11, Math.max(0, Number(focusMonth.slice(5, 7)) - 1)));
    setUltimoGastoSimulado({ id:finalItem.id, titulo:finalItem.titulo, scenario:scenario.label, mes:compraMes, deuda:debt?.id || "" });
  }, [año, prefVista, setDeudas, setGastosVariables, simulacionPago]);

  // KPIs deudas
  const cuotaMesVista   = useMemo(() => calcCuotaDeudaMes(deudas, prefVista, base), [base, deudas, prefVista]);
  const totalPendienteMes = useMemo(() => calcularDeudaPendienteMes(deudas, prefVista), [deudas, prefVista]);
  const deudasVisiblesMes = useMemo(() => deudas.filter(deuda => deudaVisibleEnMes(deuda, prefVista)), [deudas, prefVista]);

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
        const projectItems = k === "hogar" ? proyectos
          .filter(p=>p.estado==="completado")
          .map(p=>({ ...projectExpenseItem(p), importeExplorer:explorerExpenseAmount(projectExpenseItem(p), prefMes) }))
          .filter(p=>p.importeExplorer>0) : [];
        const importe = eventItems.reduce((a,e)=>a+Number(e.importeExplorer||0),0)
          + expenseItems.reduce((a,g)=>a+Number(g.importeExplorer||0),0)
          + projectItems.reduce((a,p)=>a+Number(p.importeExplorer||0),0);
        return { mes:index, pref:prefMes, importe, eventItems, expenseItems, projectItems };
      });
      return { ...v, key:k, monthly, sum:monthly.reduce((a,m)=>a+m.importe,0) };
    })
    .filter(c=>c.sum>0).sort((a,b)=>b.sum-a.sum), [eventos, gastosVariables, proyectos, año, explorerExpenseAmount]);

  const tripBreakdown = useMemo(() => viajes
    .map(v=>{
      const items = tripExpenseItems(v);
      const total = items.reduce((a,b)=>a+Number(b.importe || 0),0);
      const monthly = MESES.map((_, index) => {
        const prefMes = `${año}-${String(index + 1).padStart(2, "0")}`;
        const conceptItems = items
          .map(item=>({ ...item, importeExplorer:explorerExpenseAmount(item, prefMes) }))
          .filter(item=>item.importeExplorer>0);
        return { mes:index, pref:prefMes, importe:conceptItems.reduce((sum, item)=>sum+Number(item.importeExplorer || 0), 0), conceptItems };
      });
      return { ...v, total, monthly };
    })
    .filter(v=>v.total>0 || v.inicio?.startsWith(`${año}`) || v.fin?.startsWith(`${año}`)), [viajes, año, explorerExpenseAmount]);

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

  const palancaEnMes = useCallback((palanca) => palanca.calendarioVinculado ? leverCalendarMonths(palanca).includes(prefVista) : palanca.mes === prefVista, [prefVista]);
  const palancasMesVista = useMemo(() => palancas
    .filter(palancaEnMes), [palancas, palancaEnMes]);
  const palancasPotResumen = useMemo(() => palancas
    .filter(p => !p.activa && palancaEnMes(p)), [palancas, palancaEnMes]);

  const ingresosFijosResumen = base.monthlyOverrides?.[prefVista]?.fixedIncome ?? base.ingresos_fijos;
  const detalleIngresosMes = useMemo(() => (base.detalle_ingresos || [])
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => lineaIngresoActivaEnMes(line, prefVista)), [base.detalle_ingresos, prefVista]);
  const ingresosFijosLineasTotal = useMemo(() => detalleIngresosMes.reduce((sum, { line }) => sum + Number(line.importe || 0), 0), [detalleIngresosMes]);
  const ajusteIngresosFijos = ingresosFijosResumen - ingresosFijosLineasTotal;
  const updateIncomeLines = useCallback((updater) => {
    if (!setBase) return;

    setBase((currentBase) => {
      const source = currentBase || base;
      const nextLines = updater([...(source.detalle_ingresos || [])]);
      return actualizarIngresosFijosDesdeMes(source, prefVista, nextLines);
    });
  }, [base, prefVista, setBase]);
  const incomeLineIds = () => ({ current:Date.now() + Math.random(), future:Date.now() + Math.random() });
  const setIncomeLine = (index, patch) => updateIncomeLines((lines) => editarLineaIngresoEnMes(lines, index, prefVista, patch, incomeLineIds()));
  const addIncomeLine = () => updateIncomeLines((lines) => [...lines, { id:Date.now() + Math.random(), nombre:t("Income"), importe:0, recurrente:true, desde:prefVista, hasta:prefVista, fechaAcreditacion:`${prefVista}-01`, notas:"" }]);
  const removeIncomeLine = (index) => updateIncomeLines((lines) => eliminarLineaIngresoEnMes(lines, index, prefVista, incomeLineIds()));

  const threeColumns = isMobile ? "1fr" : isTablet ? "repeat(2,minmax(0,1fr))" : "repeat(3,minmax(0,1fr))";
  const expenseLayerColumns = isMobile ? "1fr" : isTablet ? "repeat(2,minmax(0,1fr))" : "repeat(4,minmax(0,1fr))";
  const debtProjectionSummaryColumns = isMobile ? "1fr" : isTablet ? "repeat(2,minmax(0,1fr))" : "repeat(4,minmax(0,1fr))";
  const debtProjectionColumns = `92px ${deudas.map(() => "minmax(76px,0.8fr)").join(" ")} 96px 108px 108px 92px`;
  const explorerColumns = isMobile ? "1fr" : "minmax(0,1.35fr) minmax(280px,0.65fr)";
  const explorerMonth = mesDetalle ?? mesVista;
  const expenseLayers = [
    { key:"estructural", color:"#64748b", bg:"#f8fafc", label:`1 ${t("Structural")}` },
    { key:"suministros", color:"#d97706", bg:"#fef3c7", label:`2 ${t("Utilities")}` },
    { key:"discrecional", color:C.lavender, bg:C.lavLight, label:`3 ${t("Variable expenses")}` },
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
  const resourceSections = [
    { id:"recursos-resumen", label:"Resumen", detail:"Capacidad del mes" },
    { id:"recursos-detalle", label:"Detalle", detail:"Ingresos y gastos" },
    { id:"recursos-compromisos", label:"Compromisos", detail:"Reservas y vencimientos" },
    { id:"recursos-deudas", label:"Deudas", detail:"Cuotas y liberación" },
    { id:"recursos-flujo", label:"Flujos", detail:"Capas y presión" },
    { id:"recursos-explorador", label:"Explorador", detail:"Origen de gastos" },
    { id:"recursos-simulaciones", label:"Simulaciones", detail:"Pago y caja" },
  ];
  const scrollToResourceSection = useCallback((sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior:"smooth", block:"start" });
  }, []);

  return (
    <div style={{ display:"grid", gap:20, minWidth:0 }}>

      <RecursosResumenPanel resumen={resumenMes?.resumen_recursos} mesVista={mesVista} año={año} setMesVista={setMesVista} />

      <RecursosNav sections={resourceSections} onSelect={scrollToResourceSection} />

      <div style={{ order:20 }}>
      {compromisosAbiertos ? (
        <PanelCompromisosAnuales compromisos={compromisosAnuales} prefVista={prefVista} año={año} onNuevo={() => setModalCompromiso(nuevoCompromisoAnual(prefVista))} onEditar={setModalCompromiso} onClose={() => setCompromisosAbiertos(false)} />
      ) : (
        <section id="recursos-compromisos" style={cardN(isMobile ? { padding:"14px 12px", scrollMarginTop:96 } : { scrollMarginTop:96 })}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:isMobile?"stretch":"center", gap:12, flexDirection:isMobile?"column":"row", minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:C.brandSecondaryFixed, color:C.brandSecondaryStrong, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <i className="bi bi-calendar2-check" aria-hidden="true" />
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:800, color:C.txt }}>Compromisos anuales</div>
                <div style={{ fontSize:12, color:C.txt2, marginTop:2, whiteSpace:isMobile?"normal":"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {compromisosAnuales.length} registrados · reservas, vencimientos y avisos.
                </div>
              </div>
            </div>
            <button onClick={() => setCompromisosAbiertos(true)} style={{ background:C.brandSecondaryStrong, color:"white", border:"none", borderRadius:10, padding:"9px 13px", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:7, whiteSpace:"nowrap" }}>
              <i className="bi bi-chevron-down" aria-hidden="true" /> Abrir compromisos
            </button>
          </div>
        </section>
      )}
      </div>

      <div style={{ order:30 }}>
      {deudasAbiertas ? (
        <div id="recursos-deudas" style={{ scrollMarginTop:96 }}>
          <PanelDeudas deudas={deudasVisiblesMes} prefVista={prefVista} totalPendiente={totalPendienteMes} cuotaMesActual={cuotaMesVista} onNueva={()=>setModalDeuda({})} onEditar={(d)=>setModalDeuda(d)} onCerrar={() => setDeudasAbiertas(false)}/>
        </div>
      ) : (
        <section id="recursos-deudas" style={cardN(isMobile ? { padding:"14px 12px", scrollMarginTop:96, background:`linear-gradient(135deg,${C.brandPrimaryFixed},${C.superficie})`, border:`1px solid ${C.brandPrimaryDim}` } : { scrollMarginTop:96, background:`linear-gradient(135deg,${C.brandPrimaryFixed},${C.superficie})`, border:`1px solid ${C.brandPrimaryDim}` })}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:isMobile?"stretch":"center", gap:12, flexDirection:isMobile?"column":"row", minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:C.superficie, color:C.brandPrimary, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:`1px solid ${C.brandPrimaryDim}` }}>
                <i className="bi bi-credit-card-2-front" aria-hidden="true" />
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:800, color:C.txt }}>Deudas</div>
                <div style={{ fontSize:12, color:C.txt2, marginTop:2, whiteSpace:isMobile?"normal":"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {deudasVisiblesMes.length} registradas · {fmt(cuotaMesVista)}{t("/month")} · {fmt(totalPendienteMes)} pendiente.
                </div>
              </div>
            </div>
            <button onClick={() => setDeudasAbiertas(true)} style={{ background:C.brandPrimary, color:"white", border:"none", borderRadius:10, padding:"9px 13px", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:7, whiteSpace:"nowrap" }}>
              <i className="bi bi-chevron-down" aria-hidden="true" /> Abrir deudas
            </button>
          </div>
        </section>
      )}
      </div>

      <div style={{ order:70 }}>
      {simulacionesAbiertas ? (
        <PanelSimulacionesPago datosMes={datosMes} simulacion={simulacionPago} setSimulacion={setSimulacionPago} escenarios={escenariosPago} año={año} onCreateExpense={crearGastoDesdeSimulacion} lastCreated={ultimoGastoSimulado} onClose={() => setSimulacionesAbiertas(false)} />
      ) : (
        <section id="recursos-simulaciones" style={cardN(isMobile ? { padding:"14px 12px", scrollMarginTop:96 } : { scrollMarginTop:96 })}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:isMobile?"stretch":"center", gap:12, flexDirection:isMobile?"column":"row", minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:C.brandPrimaryFixed, color:C.brandPrimary, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <i className="bi bi-calculator" aria-hidden="true" />
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:800, color:C.txt }}>Simulaciones de pago</div>
                <div style={{ fontSize:12, color:C.txt2, marginTop:2, whiteSpace:isMobile?"normal":"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>Caja, tarjeta y cuotas antes de registrar un gasto.</div>
              </div>
            </div>
            <button onClick={() => setSimulacionesAbiertas(true)} style={{ background:C.cyan, color:"white", border:"none", borderRadius:10, padding:"9px 13px", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:7, whiteSpace:"nowrap" }}>
              <i className="bi bi-chevron-down" aria-hidden="true" /> Abrir simulaciones
            </button>
          </div>
        </section>
      )}
      </div>

      {/* ── ESTRUCTURA DE INGRESOS ── */}
      <div id="recursos-detalle" style={cardN(isMobile ? { order:10, padding:"14px 12px", scrollMarginTop:96 } : { order:10, scrollMarginTop:96 })}>
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
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:12,padding:"8px 12px",background:C.cyanLight,borderRadius:10,border:`1px solid ${C.cyan}33` }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,minWidth:0 }}>
                <div style={{ width:10,height:10,borderRadius:"50%",background:C.cyan,flexShrink:0 }}/>
                <span style={{ fontSize:12,fontWeight:700,color:C.cyan,textTransform:"uppercase",letterSpacing:"0.6px",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{t("Fixed income")}</span>
              </div>
              <button onClick={addIncomeLine} aria-label={t("New")} style={{ background:C.cyan,color:"white",border:"none",borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Lato',sans-serif",flexShrink:0 }}>+ {t("New")}</button>
            </div>
            <div style={{ display:"grid", gap:5 }}>
              {detalleIngresosMes.length === 0 && <div style={{ fontSize:12,color:C.txt2,background:C.fondo,border:`1px solid ${C.borde}`,borderRadius:9,padding:"10px 12px" }}>{t("No records")}</div>}
              {detalleIngresosMes.map(({ line, index }) => (
                <div key={String((line as Record<string, unknown>).id || `${line.nombre}-${index}`)} style={{ display:"grid",gridTemplateColumns:isMobile?"minmax(0,1fr) minmax(82px,0.38fr) 30px":"minmax(0,1fr) minmax(88px,0.34fr) minmax(132px,0.46fr) 30px",gap:6,alignItems:"center",fontSize:13,padding:6,background:C.fondo,borderRadius:9,border:`1px solid ${C.borde}`,minWidth:0 }}>
                  <input value={line.nombre || ""} onChange={(event) => setIncomeLine(index, { nombre:event.target.value })} placeholder={t("Name")} style={{ ...inputS,background:"white",padding:"7px 9px",borderRadius:7,minHeight:30,fontSize:12.5,minWidth:0 }}/>
                  <input type="number" step="0.01" value={line.importe ?? ""} onChange={(event) => setIncomeLine(index, { importe:event.target.value })} placeholder="0" style={{ ...inputS,background:"white",padding:"7px 8px",borderRadius:7,minHeight:30,fontSize:12.5,minWidth:0,textAlign:"right",color:Number(line.importe || 0)<0?C.error:C.txt }}/>
                  {!isMobile && <input type="date" aria-label={t("Credit date")} value={fechaAcreditacionIngresoEnMes(line, prefVista)} onChange={(event) => setIncomeLine(index, { fechaAcreditacion:event.target.value })} style={{ ...inputS,background:"white",padding:"7px 8px",borderRadius:7,minHeight:30,fontSize:12.5,minWidth:0 }}/>
                  }
                  <ActionIconButton label={t("Delete")} bootstrapIcon="trash3" tone="delete" size={30} onClick={() => removeIncomeLine(index)} />
                  {isMobile && <input type="date" aria-label={t("Credit date")} value={fechaAcreditacionIngresoEnMes(line, prefVista)} onChange={(event) => setIncomeLine(index, { fechaAcreditacion:event.target.value })} style={{ ...inputS,background:"white",padding:"7px 8px",borderRadius:7,minHeight:30,fontSize:12.5,minWidth:0,gridColumn:"1 / -1" }}/>
                  }
                  <span style={{ gridColumn:"1 / -1",fontSize:10,color:C.txt2,padding:"0 2px" }}>{t("Credited")} {fechaAcreditacionIngresoEnMes(line, prefVista)}</span>
                </div>
              ))}
              {Math.abs(ajusteIngresosFijos) > 0.005 && (
                <div style={{ display:"flex",justifyContent:"space-between",gap:10,fontSize:13,padding:"8px 12px",background:C.cyanLight,borderRadius:9,border:`1px solid ${C.cyan}33` }}>
                  <span style={{ color:C.cyan,fontWeight:700 }}>{t("Monthly adjustment")}</span>
                  <span style={{ fontWeight:800,color:ajusteIngresosFijos<0?C.error:C.cyan }}>{fmt(ajusteIngresosFijos)}</span>
                </div>
              )}
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"9px 12px",background:C.cyan,borderRadius:9,color:"white",marginTop:2 }}>
                <span style={{ fontWeight:700 }}>{t("Monthly total")}</span><span style={{ fontWeight:700 }}>{fmt(ingresosFijosResumen)}</span>
              </div>
            </div>
          </div>

          {/* Variables */}
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"8px 12px",background:C.incomeVariableLight,borderRadius:10,border:`1px solid ${C.incomeVariable}33` }}>
              <div style={{ width:10,height:10,borderRadius:"50%",background:C.incomeVariable,flexShrink:0 }}/>
              <span style={{ fontSize:12,fontWeight:700,color:C.incomeVariable,textTransform:"uppercase",letterSpacing:"0.6px" }}>{t("Variable income")}</span>
            </div>
            <div style={{ display:"grid", gap:5 }}>
              {ingresosVariablesMes.map(v => (
                <div key={v.key} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,padding:"8px 12px",background:v.bg,borderRadius:9,border:`1px solid ${v.color}33` }}>
                  <span style={{ color:v.color }}>{v.emoji} {t(v.label)}</span>
                  <span style={{ fontWeight:700,color:v.color }}>{fmt(v.val)}</span>
                </div>
              ))}
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"9px 12px",background:C.incomeVariable,borderRadius:9,color:"white",marginTop:2 }}>
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
                const calendarFit = calculateLeverCalendarFit(p, { events:eventos, blocks:bloqueos, trips:viajes });
                const viableAmount = calculateLeverBudgetAmount(p, { events:eventos, blocks:bloqueos, trips:viajes }, prefVista);
                const displayAmount = calendarFit.calendarioVinculado ? viableAmount || p.importe : p.importe;
                return (
                  <div key={p.id} style={{ padding:"9px 12px",background:p.activa?C.sageLight:C.fondo,borderRadius:10,border:`1px solid ${p.activa?C.sage+"66":C.borde}`,transition:"all 0.2s" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5 }}>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:12,fontWeight:700,color:C.txt,display:"flex",alignItems:"center",gap:5 }}><span>{sub?.emoji}</span> {p.nombre}</div>
                        <div style={{ fontSize:10,color:C.txt2,marginTop:2 }}>{labelMes(p.mes)} · {fmt(displayAmount)}</div>
                      </div>
                      <ActionIconButton label={t("Edit lever")} bootstrapIcon="pencil" tone="edit" size={28} onClick={()=>setModalPalanca(p)} />
                    </div>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <div style={{ display:"flex",gap:5,flexWrap:"wrap",minWidth:0 }}>
                        <span style={{ fontSize:10,padding:"2px 8px",borderRadius:10,background:sub?.bg,color:sub?.color,fontWeight:600 }}>{t(sub?.label || "")}</span>
                        {calendarFit.calendarioVinculado && (
                          <span style={{ fontSize:10,padding:"2px 8px",borderRadius:10,background:calendarFit.disponible?C.exitoBg:C.warnBg,color:calendarFit.disponible?C.sageDark:C.warn,fontWeight:700 }}>
                            {calendarFit.disponible ? `Calendario libre · ${fmt(viableAmount)}` : "Revisar calendario"}
                          </span>
                        )}
                      </div>
                      <button onClick={()=>togglePalanca(p.id)}
                        style={{ display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Lato',sans-serif",background:p.activa?C.sage:"white",color:p.activa?"white":C.txt2,border:`1px solid ${p.activa?C.sage:C.borde}`,transition:"all 0.2s" }}>
                        <span style={{ width:14,height:14,borderRadius:"50%",background:p.activa?"white":C.borde,display:"inline-block",flexShrink:0 }}/>
                        {p.activa?t("Active"):t("Activate")}
                      </button>
                    </div>
                    {calendarFit.calendarioVinculado && calendarFit.conflictos.length > 0 && (
                      <div style={{ marginTop:6,fontSize:10,color:C.txt2,lineHeight:1.25 }}>
                        {calendarFit.conflictos[0].tipo}: {calendarFit.conflictos[0].titulo} · {calendarFit.conflictos[0].inicio}
                        {calendarFit.conflictos.length > 1 ? ` +${calendarFit.conflictos.length - 1}` : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── GASTOS VARIABLES DEL MES ── */}
      <div style={{ order:11 }}>
      <SeccionGastosVariables base={base} setBase={setBase} eventos={eventos} viajes={viajes} proyectos={proyectos} año={año} mesActual={mesActual} mesSeleccionado={mesVista} setMesSeleccionado={setMesVista} suministros={suministros} setSuministros={setSuministros} gastosVariables={gastosVariables} setGastosVariables={setGastosVariables} deudas={deudas} setDeudas={setDeudas}/>
      </div>

      {/* ── GRÁFICO MENSUAL APILADO ── */}
      <div id="recursos-flujo" style={cardN(isMobile ? { order:40, padding:"14px 12px", scrollMarginTop:96 } : { order:40, scrollMarginTop:96 })}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4,flexDirection:isMobile?"column":"row",gap:isMobile?8:12 }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:8,minWidth:0 }}>
              <div style={{ fontSize:16,fontWeight:700,color:C.txt }}>{t("Annual expense evolution")} - {año}</div>
              <button
                type="button"
                title={t("Annual expense evolution help")}
                aria-label={t("Annual expense evolution help")}
                style={{ border:`1px solid ${C.borde}`,background:C.fondo,color:C.txt2,borderRadius:999,width:24,height:24,display:"grid",placeItems:"center",cursor:"help",flexShrink:0 }}>
                <i className="bi bi-info-circle" aria-hidden="true" />
              </button>
            </div>
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
            const maxG = Math.max(...datosMes.map(d=>Math.max(d.total_gastos,d.total_ingresos)), base.ingresos_fijos, 1);
            const fixedPx = Math.min(138,(base.ingresos_fijos/maxG)*140);
            return <div style={{ position:"absolute",left:0,right:0,bottom:`${fixedPx}px`,height:1,background:C.cyan,opacity:0.5,pointerEvents:"none",zIndex:1 }}/>;
          })()}

          {datosMes.map((m,i) => {
            const maxG     = Math.max(...datosMes.map(d=>Math.max(d.total_gastos,d.total_ingresos)), base.ingresos_fijos, 1);
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
                      {l:`3 ${t("Variable expenses")}`, v:fmt(gastoDiscrecionalReal), c:C.lavender},
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
                {key:"estructural", l:`1 ${t("Structural")}`,  v:fmt(detalle.gasto_estructural),  c:"#64748b", bg:"#f8fafc", sub:`${t("Fixed expenses")} ${fmt(base.monthlyOverrides?.[detalle.pref]?.fixedExpenses ?? base.gastos_fijos)} + ${t("Debt")} ${fmt(detalle.gasto_deudas)}`},
                {key:"suministros", l:`2 ${t("Utilities")}`,  v:fmt(detalle.gasto_suministros),  c:"#d97706", bg:"#fef3c7", sub:"Power, gas, water, internet..."},
                {key:"discrecional", l:`3 ${t("Variable expenses")}`, v:fmt(Math.max(0, detalle.gasto_discrecional - (detalle.gastos_viaje || 0))), c:C.lavender,bg:C.lavLight,sub:`${t("Calendar")} ${fmt(detalle.gastos_var)}`},
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

      {/* ── ANALIZADOR PRESIÓN FINANCIERA ── */}
      <div style={{ order:41 }}>
      <AnalizadorPresionFinanciera resumenMes={resumenMes} ingresosFijosResumen={ingresosFijosResumen} mesVista={mesVista} año={año}/>
      </div>

      {/* ── EXPLORADOR DE GASTOS ── */}
      <div id="recursos-explorador" style={cardN(isMobile ? { order:50, padding:"14px 12px", scrollMarginTop:96 } : { order:50, scrollMarginTop:96 })}>
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
              const fixedExpenses = base.monthlyOverrides?.[month.pref]?.fixedExpenses ?? base.gastos_fijos;
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
                ...(month?.projectItems || []).map(item => ({ id:item.id, label:item.titulo, amount:item.importeExplorer ?? explorerExpenseAmount(item, month.pref), detail:formatCardDetail(item, month.pref) })),
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
                const month = selectedTrip.monthly[explorerMonth];
                const pct = selectedTrip.presupuesto > 0 ? Math.min(100, (selectedTrip.total / selectedTrip.presupuesto) * 100) : 0;
                const entries = month?.conceptItems || [];
                return (
                  <div style={{ display:"grid",gap:10 }}>
                    <div style={{ display:"flex",justifyContent:"space-between" }}><span style={{ color:C.txt2,fontSize:12 }}>{selectedTrip.nombre}</span><strong>{fmt(month?.importe || 0)}</strong></div>
                    {selectedTrip.presupuesto > 0 && <div style={{ height:6,background:C.borde,borderRadius:6,overflow:"hidden" }}><div style={{ width:`${pct}%`,height:"100%",background:COLOR_VIAJE,borderRadius:6 }}/></div>}
                    {selectedTrip.inicio && <div style={{ fontSize:11,color:C.txt2 }}>{selectedTrip.inicio.split("-").reverse().join("/")} → {selectedTrip.fin?.split("-").reverse().join("/")} · {daysBetween(selectedTrip.inicio,selectedTrip.fin)}n</div>}
                    <div style={{ height:1,background:C.borde }}/>
                    {entries.length === 0 ? <div style={{ fontSize:12,color:C.txt2 }}>{t("No records")}</div> : entries.map(item => (
                      <div key={item.id} style={{ background:"white",borderRadius:9,padding:"8px 10px",border:`1px solid ${C.borde}` }}>
                        <div style={{ display:"flex",justifyContent:"space-between",gap:10 }}>
                          <span style={{ fontSize:12,color:C.txt }}>{item.conceptKey}</span>
                          <strong style={{ fontSize:12,color:COLOR_VIAJE }}>{fmt(Number(item.importeExplorer || 0))}</strong>
                        </div>
                        {formatCardDetail(item, month.pref) && <div style={{ fontSize:10,color:C.txt2,marginTop:3,lineHeight:1.35 }}>{formatCardDetail(item, month.pref)}</div>}
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
        const presupuestoProyectado = (pref, cuotaDeudas) => {
          const [year, month] = pref.split("-").map(Number);
          const budgetMonth = year === año ? datosMes[month - 1] : null;

          if (budgetMonth) {
            const impactoDeuda = Number(budgetMonth.gasto_deudas || cuotaDeudas || 0);
            const saldoConDeudas = Number(budgetMonth.saldo || 0);
            return {
              totalCuotas:impactoDeuda,
              saldoConDeudas,
              saldoSinDeudas:saldoConDeudas + impactoDeuda,
            };
          }

          const monthlyOverride = base.monthlyOverrides?.[pref] || {};
          const ingresos = Number(monthlyOverride.fixedIncome ?? base.ingresos_fijos ?? 0);
          const gastosSinDeudas = Number(monthlyOverride.fixedExpenses ?? base.gastos_fijos ?? 0);
          const totalCuotas = Number(cuotaDeudas || 0);
          const saldoSinDeudas = ingresos - gastosSinDeudas;
          return {
            totalCuotas,
            saldoConDeudas:saldoSinDeudas - totalCuotas,
            saldoSinDeudas,
          };
        };
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
          const cuotaDeudas=calcCuotaDeudaMes(deudas, pref, base);
          const proyeccion=presupuestoProyectado(pref, cuotaDeudas);
          const liberaciones=detalleDeudas.filter(d=>d.esUltima);
          return{pref,detalleDeudas,liberaciones,...proyeccion,mejora:proyeccion.saldoSinDeudas-proyeccion.saldoConDeudas};
        });
        const ultimoIndiceConCuotas=filas.reduce((ultimo,f,index)=>f.totalCuotas>0?index:ultimo,-1);
        const debtFreeIndex=ultimoIndiceConCuotas<0?0:ultimoIndiceConCuotas<filas.length-1?ultimoIndiceConCuotas+1:-1;
        const filasVisibles=deudas.length===0?filas.slice(0,1):debtFreeIndex>=0?filas.slice(0,Math.max(1,debtFreeIndex+1)):filas;
        const saldoHoy=filas[0]?.saldoConDeudas||0;
        const saldoSinDeudasHoy=filas[0]?.saldoSinDeudas||0;
        const mejoraHoy=filas[0]?.mejora||0;
        const mesSinDeudas=debtFreeIndex>=0?filas[debtFreeIndex]?.pref:null;
        return(
          <div style={{ ...cardN(isMobile ? { padding:"14px 12px" } : undefined),order:31,background:"linear-gradient(135deg,#0f2420,#1a3d30)",border:"none" }}>
            <div style={{ fontSize:16,fontWeight:700,color:"white",marginBottom:4 }}>🔮 {t("Monthly debt-free projection")}</div>
            <div style={{ fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:16 }}>{t("Month-by-month payment release · impact on free balance")}</div>
            <div style={{ display:"grid",gridTemplateColumns:debtProjectionSummaryColumns,gap:12,marginBottom:20 }}>
              {[
                {l:t("Free balance today"),       v:fmt(saldoHoy),            sub:t("with all payments active")},
                {l:t("Free balance without debt"),v:fmt(saldoSinDeudasHoy),   sub:t("same month without debt payments")},
                {l:t("Monthly improvement"),      v:fmt(mejoraHoy),           sub:t("debt payments removed")},
                {l:t("Debt-free month"),          v:mesSinDeudas?labelMes(mesSinDeudas):`+${meses.length} ${t("months")}`, sub:t("based on current installments")},
              ].map(x=>(
                <div key={x.l} style={{ background:"rgba(255,255,255,0.08)",borderRadius:12,padding:"14px 16px",textAlign:"center",border:"1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ fontSize:10,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:"0.6px" }}>{x.l}</div>
                  <div style={{ fontSize:20,fontWeight:700,color:C.exito,fontFamily:"'Playfair Display',serif",marginTop:6 }}>{x.v}</div>
                  <div style={{ fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:3 }}>{x.sub}</div>
                </div>
              ))}
            </div>
            {deudas.length===0&&<div style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"12px 14px",color:"rgba(255,255,255,0.65)",fontSize:12,marginBottom:14 }}>{t("No debts registered")}</div>}
            <div style={{ borderRadius:12,overflowX:"auto",overflowY:"hidden",border:"1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ minWidth:isMobile?Math.max(820, 500 + deudas.length * 86):"auto" }}>
              <div style={{ display:"grid",gridTemplateColumns:debtProjectionColumns,gap:0,background:"rgba(255,255,255,0.1)",padding:"8px 14px" }}>
                <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase" }}>{t("Month")}</div>
                {deudas.map(d=><div key={d.id} style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",textAlign:"center" }}>{d.nombre}</div>)}
                <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",textAlign:"right" }}>{t("Payments")}</div>
                <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",textAlign:"right" }}>{t("With debt")}</div>
                <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",textAlign:"right" }}>{t("Without debt")}</div>
                <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",textAlign:"right" }}>{t("Improvement")}</div>
              </div>
              <div style={{ maxHeight:isMobile?340:400,overflowY:"auto" }}>
                {filasVisibles.map((f,fi)=>{
                  const esHoy=fi===0;
                  const hayLib=f.liberaciones.length>0;
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
                        <div style={{ textAlign:"right",fontSize:13,fontWeight:700,color:f.saldoConDeudas>0?C.exito:C.error,fontFamily:"'Playfair Display',serif" }}>{fmt(f.saldoConDeudas)}</div>
                        <div style={{ textAlign:"right",fontSize:13,fontWeight:700,color:f.saldoSinDeudas>0?C.exito:C.error,fontFamily:"'Playfair Display',serif" }}>{fmt(f.saldoSinDeudas)}</div>
                        <div style={{ textAlign:"right",fontSize:12,fontWeight:700,color:f.mejora>0?C.exito:"rgba(255,255,255,0.3)" }}>{f.mejora>0?`+${fmt(f.mejora)}`:"—"}</div>
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

      {modalPalanca !== null && (
        <ModalPalanca
          palanca={modalPalanca?.id ? modalPalanca : undefined}
          defaults={modalPalanca?.id ? {} : modalPalanca}
          eventos={eventos}
          bloqueos={bloqueos}
          viajes={viajes}
          onSave={guardarPalanca}
          onDelete={eliminarPalanca}
          onClose={() => setModalPalanca(null)}
        />
      )}
      {modalDeuda   !== null && <ModalDeuda   deuda={modalDeuda?.id?modalDeuda:undefined}       onSave={guardarDeuda}   onDelete={eliminarDeuda}   onClose={()=>setModalDeuda(null)}/>}
      {modalCompromiso !== null && (
        <ModalCompromisoAnual
          compromiso={modalCompromiso?.id ? modalCompromiso : undefined}
          defaults={modalCompromiso?.id ? {} : modalCompromiso}
          onSave={guardarCompromiso}
          onDelete={eliminarCompromiso}
          onClose={() => setModalCompromiso(null)}
        />
      )}
    </div>
  );
}

const nuevoCompromisoAnual = (prefVista) => ({
  nombre:"",
  tipo:"vivienda",
  importe:"",
  frecuencia:"anual",
  fechaVencimiento:`${prefVista}-01`,
  fechaPago:"",
  origenFondos:FUNDING_SOURCES.MONTH_INCOME,
  cuotasTarjeta:1,
  mesPrimerCargo:"",
  tarjetaNombre:"",
  tarjetaDiaCierre:"",
  reservaActiva:true,
  mesesReserva:12,
  avisoDiasAntes:30,
  notas:"",
});

const compromisoDateForYear = (date, year) => /^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) ? `${year}${String(date).slice(4)}` : "";
const nextCommitmentDueDate = (commitment, year) => {
  const currentDueDate = compromisoDateForYear(commitment.fechaVencimiento, year);
  if (!currentDueDate) return "";
  return currentDueDate >= todayISO ? currentDueDate : compromisoDateForYear(commitment.fechaVencimiento, year + 1);
};
const daysUntil = (date) => date ? Math.ceil((new Date(`${date}T12:00:00`).getTime() - new Date(`${todayISO}T12:00:00`).getTime()) / 86400000) : null;
const formatDate = (date) => date ? date.split("-").reverse().join("/") : "";
const commitmentTypeLabel = (type) => ANNUAL_COMMITMENT_TYPES.find(option => option.key === type)?.label || "Otro";
const paymentSourceLabel = (source) => PAYMENT_SOURCE_OPTIONS.find(option => option.key === source)?.label || "Efectivo";

function PanelSimulacionesPago({ datosMes = [], simulacion, setSimulacion, escenarios = [], año, onCreateExpense, lastCreated, onClose }) {
  const { isMobile, isTablet } = useBreakpoint();
  const monthByPref = useMemo(() => new Map(datosMes.map(month => [month.pref, month])), [datosMes]);
  const update = (key, value) => setSimulacion(current => ({ ...current, [key]:value }));
  const scenarioColumns = isMobile ? "1fr" : isTablet ? "repeat(2,minmax(0,1fr))" : "repeat(4,minmax(0,1fr))";
  const peaks = escenarios.map(scenario => Number(scenario.impactoMaximo || 0)).filter(Boolean);
  const lowestPeak = peaks.length > 0 ? Math.min(...peaks) : 0;
  const purchaseMonth = (simulacion.fecha || "").slice(0, 7);

  return (
    <section id="recursos-simulaciones" style={cardN(isMobile ? { padding:"14px 12px", scrollMarginTop:96 } : { scrollMarginTop:96 })}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:isMobile?"stretch":"flex-start", gap:12, flexDirection:isMobile?"column":"row", marginBottom:14 }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.txt }}>Simulaciones de pago</div>
          <div style={{ fontSize:12, color:C.txt2, marginTop:3 }}>Compara caja, tarjeta y cuotas antes de registrar el gasto real.</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <div style={{ background:C.brandPrimaryFixed, border:`1px solid ${C.brandPrimary}22`, borderRadius:10, padding:"8px 10px", color:C.brandPrimary, fontSize:11, fontWeight:800, whiteSpace:"nowrap" }}>
            No modifica registros
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background:C.fondo, border:`1px solid ${C.borde}`, color:C.txt2, borderRadius:10, padding:"8px 10px", fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif", display:"inline-flex", alignItems:"center", gap:6, whiteSpace:"nowrap" }}>
              <i className="bi bi-chevron-up" aria-hidden="true" /> Ocultar
            </button>
          )}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":isTablet?"repeat(2,minmax(0,1fr))":"1.2fr 0.8fr 0.8fr 0.8fr", gap:10, marginBottom:10 }}>
        <label style={{ display:"grid", gap:5, minWidth:0 }}>
          <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>Concepto</span>
          <input value={simulacion.titulo || ""} onChange={event => update("titulo", event.target.value)} style={{ ...inputS, background:C.fondo }}/>
        </label>
        <label style={{ display:"grid", gap:5, minWidth:0 }}>
          <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>Categoría</span>
          <select value={simulacion.categoria || "otro"} onChange={event => update("categoria", event.target.value)} style={{ ...inputS, background:C.fondo }}>
            {Object.entries(CATEGORIAS).filter(([key, category]) => category.tipo === "gasto" && key !== "viaje").map(([key, category]) => (
              <option key={key} value={key}>{category.emoji} {category.label}</option>
            ))}
          </select>
        </label>
        <label style={{ display:"grid", gap:5, minWidth:0 }}>
          <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>Importe</span>
          <input type="number" min="0" step="0.01" value={simulacion.importe ?? ""} onChange={event => update("importe", event.target.value)} style={{ ...inputS, background:C.fondo }}/>
        </label>
        <label style={{ display:"grid", gap:5, minWidth:0 }}>
          <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>Fecha de compra</span>
          <input type="date" value={simulacion.fecha || ""} onChange={event => update("fecha", event.target.value)} style={{ ...inputS, background:C.fondo }}/>
        </label>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":isTablet?"repeat(2,minmax(0,1fr))":"repeat(3,minmax(0,1fr))", gap:10, marginBottom:14 }}>
        <label style={{ display:"grid", gap:5, minWidth:0 }}>
          <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>Cierre tarjeta</span>
          <input type="number" min="1" max="31" step="1" value={simulacion.tarjetaDiaCierre ?? ""} onChange={event => update("tarjetaDiaCierre", event.target.value)} style={{ ...inputS, background:C.fondo }}/>
        </label>
        <label style={{ display:"grid", gap:5, minWidth:0 }}>
          <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>Tarjeta</span>
          <input value={simulacion.tarjetaNombre || ""} onChange={event => update("tarjetaNombre", event.target.value)} placeholder="Visa, Mastercard..." style={{ ...inputS, background:C.fondo }}/>
        </label>
        <label style={{ display:"grid", gap:5, minWidth:0 }}>
          <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>Cuotas a comparar</span>
          <input value={simulacion.cuotas || ""} onChange={event => update("cuotas", event.target.value)} placeholder="3,6,12" style={{ ...inputS, background:C.fondo }}/>
        </label>
      </div>

      {lastCreated && (
        <div style={{ background:C.exitoBg, border:`1px solid ${C.exito}44`, borderRadius:11, padding:"9px 11px", color:C.sageDark, fontSize:12, fontWeight:800, marginBottom:12 }}>
          Gasto creado: {lastCreated.titulo} · {lastCreated.scenario} · {labelMes(lastCreated.mes)}{lastCreated.deuda ? " · deuda vinculada" : ""}
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:scenarioColumns, gap:10 }}>
        {escenarios.map(scenario => {
          const rows = scenario.impactos.map(impact => {
            const month = monthByPref.get(impact.pref);
            const baseMargin = Number(month?.resumen_recursos?.margen_real ?? month?.saldo ?? 0);
            const assigned = Number(month?.resumen_recursos?.gasto_total_real ?? month?.total_gastos ?? 0);
            const income = Number(month?.resumen_recursos?.ingresos_confirmados ?? month?.total_ingresos ?? 0);
            return {
              ...impact,
              month,
              marginAfter:baseMargin - Number(impact.importe || 0),
              pressureAfter:income > 0 ? Math.round(((assigned + Number(impact.importe || 0)) / income) * 100) : 0,
            };
          });
          const lowest = lowestPeak > 0 && Math.abs(Number(scenario.impactoMaximo || 0) - lowestPeak) < 0.01;
          const firstImpactLabel = scenario.primerImpacto ? labelMes(scenario.primerImpacto) : "sin impacto";
          const visibleRows = rows.slice(0, 4);

          return (
            <div key={scenario.key} style={{ background:lowest?C.brandSecondaryFixed:C.fondo, border:`1px solid ${lowest?C.brandSecondaryBorder:C.borde}`, borderLeft:`4px solid ${lowest?C.brandSecondaryStrong:C.txt2}66`, borderRadius:12, padding:"12px 12px", minWidth:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", gap:8, alignItems:"flex-start", marginBottom:9 }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:900, color:C.txt, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{scenario.label}</div>
                  <div style={{ marginTop:3, fontSize:10.5, color:C.txt2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{purchaseMonth ? `${labelMes(purchaseMonth)} compra` : "Compra"} · {firstImpactLabel}</div>
                </div>
                {lowest && <span style={{ background:C.brandSecondaryStrong, color:"white", borderRadius:999, padding:"3px 7px", fontSize:9.5, fontWeight:900, whiteSpace:"nowrap" }}>menor pico</span>}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:9 }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:9.5, color:C.txt2, textTransform:"uppercase", fontWeight:850 }}>Pico mensual</div>
                  <div style={{ fontSize:20, lineHeight:1, color:lowest?C.brandSecondaryStrong:C.txt, fontWeight:900, fontFamily:"'Playfair Display',serif", marginTop:4 }}>{fmt(scenario.impactoMaximo || 0)}</div>
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:9.5, color:C.txt2, textTransform:"uppercase", fontWeight:850 }}>Total</div>
                  <div style={{ fontSize:20, lineHeight:1, color:C.txt, fontWeight:900, fontFamily:"'Playfair Display',serif", marginTop:4 }}>{fmt(scenario.impactoTotal || 0)}</div>
                </div>
              </div>

              <div style={{ display:"grid", gap:5 }}>
                {visibleRows.length === 0 && <div style={{ fontSize:11, color:C.txt2, background:C.superficie, border:`1px solid ${C.borde}`, borderRadius:8, padding:"8px 9px" }}>Sin impacto con este importe.</div>}
                {visibleRows.map(row => {
                  const afterColor = !row.month ? C.txt2 : row.marginAfter < 0 ? C.error : C.sageDark;
                  return (
                    <div key={`${scenario.key}-${row.pref}`} style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) auto", gap:8, alignItems:"center", background:C.superficie, border:`1px solid ${C.borde}`, borderRadius:8, padding:"7px 8px", minWidth:0 }}>
                      <span style={{ minWidth:0 }}>
                        <strong style={{ display:"block", fontSize:11.5, color:C.txt, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{labelMes(row.pref)}</strong>
                        <span style={{ display:"block", fontSize:10, color:C.txt2, marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{row.month ? `margen ${fmt(row.marginAfter)} · ${row.pressureAfter}%` : "fuera del año visible"}</span>
                      </span>
                      <span style={{ color:afterColor, fontSize:12, fontWeight:900, whiteSpace:"nowrap" }}>{fmt(row.importe)}</span>
                    </div>
                  );
                })}
                {rows.length > visibleRows.length && <div style={{ fontSize:10.5, color:C.txt2, padding:"2px 2px" }}>+{rows.length - visibleRows.length} meses más</div>}
              </div>

              <button onClick={() => onCreateExpense?.(scenario)} disabled={!Number(simulacion.importe || 0) || !String(simulacion.titulo || "").trim()}
                style={{ width:"100%", marginTop:10, background:lowest?C.brandSecondaryStrong:C.cyan, color:"white", border:"none", borderRadius:10, padding:"9px 10px", fontSize:12, fontWeight:900, cursor:"pointer", fontFamily:"'Lato',sans-serif", opacity:!Number(simulacion.importe || 0) || !String(simulacion.titulo || "").trim()?0.55:1 }}>
                Crear gasto real
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop:12, display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(3,minmax(0,1fr))", gap:8 }}>
        {[
          { label:"Compra", value:purchaseMonth ? labelMes(purchaseMonth) : "—", color:C.brandPrimary },
          { label:"Importe simulado", value:fmt(Number(simulacion.importe || 0)), color:C.txt },
          { label:"Año visible", value:String(año), color:C.txt2 },
        ].map(item => (
          <div key={item.label} style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"center", background:"rgba(255,255,255,0.72)", border:`1px solid ${C.borde}`, borderRadius:10, padding:"9px 11px", minWidth:0 }}>
            <span style={{ fontSize:11, color:C.txt2, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.04em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.label}</span>
            <strong style={{ fontSize:13, color:item.color, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function PanelCompromisosAnuales({ compromisos = [], prefVista, año, onNuevo, onEditar, onClose }) {
  const { isMobile, isTablet } = useBreakpoint();
  const compromisosOrdenados = [...(compromisos || [])]
    .map(commitment => {
      const dueDate = nextCommitmentDueDate(commitment, año);
      const dueYear = Number(dueDate.slice(0, 4)) || año;
      return {
        ...commitment,
        dueDate,
        dueYear,
        daysToDue:daysUntil(dueDate),
        reserveWindow:annualCommitmentReserveWindowForYear(commitment, dueYear),
        monthlyReserve:annualCommitmentMonthlyReserve(commitment),
        reserveThisMonth:calculateAnnualCommitmentReserveForMonth(commitment, prefVista),
        cashImpactThisMonth:calculateAnnualCommitmentCashImpactForMonth(commitment, prefVista),
      };
    })
    .sort((first, second) => String(first.dueDate).localeCompare(String(second.dueDate)));
  const reservaMes = compromisosOrdenados.reduce((sum, commitment) => sum + Number(commitment.reserveThisMonth || 0), 0);
  const impactoMes = compromisosOrdenados.reduce((sum, commitment) => sum + Number(commitment.cashImpactThisMonth || 0), 0);
  const proximo = compromisosOrdenados[0];
  const columns = isMobile ? "1fr" : isTablet ? "repeat(2,minmax(0,1fr))" : "repeat(4,minmax(0,1fr))";

  return (
    <section id="recursos-compromisos" style={cardN(isMobile ? { padding:"14px 12px", scrollMarginTop:96 } : { scrollMarginTop:96 })}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:isMobile?"stretch":"flex-start", gap:12, flexDirection:isMobile?"column":"row", marginBottom:14 }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.txt }}>Compromisos anuales</div>
          <div style={{ fontSize:12, color:C.txt2, marginTop:3 }}>Vencimientos previsibles, reserva mensual y avisos antes de que presionen caja.</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", justifyContent:isMobile?"stretch":"flex-end", flexWrap:"wrap" }}>
          <button onClick={onNuevo} style={{ background:C.brandSecondaryStrong, color:"white", border:"none", borderRadius:10, padding:"8px 13px", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif", whiteSpace:"nowrap" }}>+ Compromiso</button>
          <button onClick={onClose} style={{ background:C.fondo, color:C.txt2, border:`1px solid ${C.borde}`, borderRadius:10, padding:"8px 12px", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif", display:"inline-flex", alignItems:"center", gap:6, whiteSpace:"nowrap" }}>
            <i className="bi bi-chevron-up" aria-hidden="true" /> Ocultar
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:columns, gap:10, marginBottom:14 }}>
        {[
          { label:"Reserva este mes", value:fmt(reservaMes), sub:"dinero comprometido", color:C.brandSecondaryStrong, bg:C.brandSecondaryFixed },
          { label:"Pago directo", value:fmt(impactoMes), sub:"sin reserva activa", color:impactoMes > 0 ? C.warn : C.txt2, bg:impactoMes > 0 ? C.warnBg : C.fondo },
          { label:"Compromisos", value:compromisosOrdenados.length, sub:"registrados", color:C.brandPrimary, bg:C.brandPrimaryFixed },
          { label:"Próximo vencimiento", value:proximo ? formatDate(proximo.dueDate) : "—", sub:proximo ? proximo.nombre : "sin compromisos", color:C.brandTertiary, bg:C.brandTertiaryFixed },
        ].map(metric => (
          <div key={metric.label} style={{ background:metric.bg, border:`1px solid ${metric.color}33`, borderLeft:`4px solid ${metric.color}`, borderRadius:12, padding:"11px 12px", minWidth:0 }}>
            <div style={{ fontSize:10, color:metric.color, fontWeight:850, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{metric.label}</div>
            <div style={{ marginTop:6, fontSize:22, lineHeight:1, color:metric.color, fontWeight:900, fontFamily:"'Playfair Display',serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{metric.value}</div>
            <div style={{ marginTop:5, fontSize:10.5, color:C.txt2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{metric.sub}</div>
          </div>
        ))}
      </div>

      {compromisosOrdenados.length === 0 ? (
        <div style={{ background:C.fondo, border:`1px solid ${C.borde}`, borderRadius:12, padding:"14px 16px", color:C.txt2, fontSize:13 }}>Aún no hay compromisos anuales. IBI, pólizas, ITV o seguros pueden vivir aquí con reserva mensual y aviso previo.</div>
      ) : (
        <div style={{ display:"grid", gap:8 }}>
          {compromisosOrdenados.map(commitment => {
            const dueSoon = commitment.daysToDue !== null && commitment.daysToDue <= Number(commitment.avisoDiasAntes || 30);
            const reserveText = commitment.reservaActiva === false
              ? `${paymentSourceLabel(commitment.origenFondos)} · pago ${formatDate(commitment.fechaPago || commitment.fechaVencimiento)}`
              : `${fmt(commitment.monthlyReserve)}/mes · ${labelMes(commitment.reserveWindow.start)} a ${labelMes(commitment.reserveWindow.end)}`;
            return (
              <button key={commitment.id || commitment.nombre} onClick={() => onEditar(commitment)} style={{ textAlign:"left", background:dueSoon?C.warnBg:C.fondo, border:`1px solid ${dueSoon?C.warn:C.borde}`, borderRadius:12, padding:"11px 12px", cursor:"pointer", fontFamily:"'Lato',sans-serif", display:"grid", gridTemplateColumns:isMobile?"1fr":"minmax(0,1.35fr) minmax(150px,0.65fr) minmax(150px,0.65fr)", gap:10, alignItems:"center", minWidth:0 }}>
                <span style={{ minWidth:0 }}>
                  <strong style={{ display:"block", color:C.txt, fontSize:13.5, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{commitment.nombre}</strong>
                  <span style={{ display:"block", color:C.txt2, fontSize:11, marginTop:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{commitmentTypeLabel(commitment.tipo)} · {formatDate(commitment.dueDate)}</span>
                </span>
                <span style={{ color:commitment.reservaActiva === false ? C.warn : C.brandSecondaryStrong, fontSize:12, fontWeight:800, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{reserveText}</span>
                <span style={{ justifySelf:isMobile?"start":"end", color:dueSoon?C.warn:C.txt2, fontSize:11, fontWeight:800, whiteSpace:"nowrap" }}>{dueSoon ? "Aviso activo" : `${Math.max(0, commitment.daysToDue || 0)} días`}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ModalCompromisoAnual({ compromiso, defaults = {}, onSave, onDelete, onClose }) {
  const { isMobile } = useBreakpoint();
  const [form, setForm] = useState(() => ({ ...nuevoCompromisoAnual(new Date().toISOString().slice(0, 7)), ...(compromiso || defaults) }));
  const set = (key, value) => setForm(current => ({ ...current, [key]:value }));
  const origenFondos = form.origenFondos || FUNDING_SOURCES.MONTH_INCOME;
  const reservaActiva = form.reservaActiva !== false;
  const canSave = String(form.nombre || "").trim() && Number(form.importe || 0) > 0 && form.fechaVencimiento;

  return (
    <Modal onClose={onClose} maxW={620}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:18 }}>
        <div>
          <h3 style={{ fontSize:18, fontWeight:800, color:C.txt }}>{compromiso ? "Editar compromiso" : "Nuevo compromiso anual"}</h3>
          <div style={{ fontSize:12, color:C.txt2, marginTop:3 }}>Reserva mensual, vencimiento y aviso previo.</div>
        </div>
        <button onClick={onClose} aria-label="Cerrar" style={{ border:"none", background:C.fondo, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:15, color:C.txt2 }}><i className="bi bi-x-lg" aria-hidden="true" /></button>
      </div>

      <div style={{ display:"grid", gap:13 }}>
        <label style={{ display:"grid", gap:5 }}>
          <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>Nombre</span>
          <input value={form.nombre || ""} onChange={event => set("nombre", event.target.value)} placeholder="IBI, póliza de vida, ITV..." style={{ ...inputS, background:C.fondo }}/>
        </label>
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:10 }}>
          <label style={{ display:"grid", gap:5 }}>
            <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>Tipo</span>
            <select value={form.tipo || "otro"} onChange={event => set("tipo", event.target.value)} style={{ ...inputS, background:C.fondo }}>
              {ANNUAL_COMMITMENT_TYPES.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
            </select>
          </label>
          <label style={{ display:"grid", gap:5 }}>
            <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>Importe</span>
            <input type="number" min="0" step="0.01" value={form.importe ?? ""} onChange={event => set("importe", event.target.value)} style={{ ...inputS, background:C.fondo }}/>
          </label>
          <label style={{ display:"grid", gap:5 }}>
            <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>Frecuencia</span>
            <select value={form.frecuencia || "anual"} onChange={event => set("frecuencia", event.target.value)} style={{ ...inputS, background:C.fondo }}>
              {ANNUAL_FREQUENCIES.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
            </select>
          </label>
          <label style={{ display:"grid", gap:5 }}>
            <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>Vencimiento</span>
            <input type="date" value={form.fechaVencimiento || ""} onChange={event => set("fechaVencimiento", event.target.value)} style={{ ...inputS, background:C.fondo }}/>
          </label>
        </div>

        <label style={{ display:"flex", alignItems:"center", gap:8, background:C.brandSecondaryFixed, border:`1px solid ${C.brandSecondaryBorder}`, borderRadius:12, padding:"10px 12px", color:C.brandSecondaryStrong, fontSize:13, fontWeight:800 }}>
          <input type="checkbox" checked={reservaActiva} onChange={event => set("reservaActiva", event.target.checked)}/>
          Activar reserva mensual
        </label>

        {reservaActiva ? (
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:10 }}>
            <label style={{ display:"grid", gap:5 }}>
              <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>Meses de reserva</span>
              <input type="number" min="1" step="1" value={form.mesesReserva || 12} onChange={event => set("mesesReserva", event.target.value)} style={{ ...inputS, background:C.fondo }}/>
            </label>
            <label style={{ display:"grid", gap:5 }}>
              <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>Aviso previo</span>
              <input type="number" min="0" step="1" value={form.avisoDiasAntes || 30} onChange={event => set("avisoDiasAntes", event.target.value)} style={{ ...inputS, background:C.fondo }}/>
            </label>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:10 }}>
            <label style={{ display:"grid", gap:5 }}>
              <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>Fecha de pago</span>
              <input type="date" value={form.fechaPago || ""} onChange={event => set("fechaPago", event.target.value)} style={{ ...inputS, background:C.fondo }}/>
            </label>
            <label style={{ display:"grid", gap:5 }}>
              <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>Forma de pago</span>
              <select value={origenFondos} onChange={event => set("origenFondos", event.target.value)} style={{ ...inputS, background:C.fondo }}>
                {PAYMENT_SOURCE_OPTIONS.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
              </select>
            </label>
            {origenFondos !== FUNDING_SOURCES.MONTH_INCOME && <label style={{ display:"grid", gap:5 }}>
              <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>{origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? "Primer mes de débito" : "Mes de débito"}</span>
              <input type="month" value={form.mesPrimerCargo || ""} onChange={event => set("mesPrimerCargo", event.target.value)} style={{ ...inputS, background:C.fondo }}/>
            </label>}
            {origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS && <label style={{ display:"grid", gap:5 }}>
              <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>Cuotas</span>
              <input type="number" min="1" step="1" value={form.cuotasTarjeta || 1} onChange={event => set("cuotasTarjeta", event.target.value)} style={{ ...inputS, background:C.fondo }}/>
            </label>}
          </div>
        )}

        <label style={{ display:"grid", gap:5 }}>
          <span style={{ fontSize:11, fontWeight:800, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.05em" }}>Notas</span>
          <textarea value={form.notas || ""} onChange={event => set("notas", event.target.value)} placeholder="Contexto o preparación necesaria..." style={{ ...inputS, minHeight:70, resize:"vertical", background:C.fondo }}/>
        </label>

        <div style={{ background:reservaActiva?C.brandSecondaryFixed:C.warnBg, border:`1px solid ${reservaActiva?C.brandSecondaryBorder:C.warn}44`, borderRadius:12, padding:"10px 12px", fontSize:12, color:C.txt2 }}>
          {reservaActiva ? `Reserva estimada: ${fmt(Number(form.importe || 0) / Math.max(1, Number(form.mesesReserva || 12)))}/mes` : `Impacta como ${paymentSourceLabel(origenFondos)} en el mes de pago o débito.`}
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", gap:8, flexWrap:"wrap" }}>
          {compromiso && <button onClick={() => onDelete(compromiso.id)} style={{ background:C.errorBg, color:C.error, border:`1px solid ${C.error}44`, borderRadius:12, padding:"10px 14px", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>Eliminar</button>}
          <div style={{ flex:1 }}/>
          <button onClick={onClose} style={{ background:C.fondo, color:C.txt2, border:`1px solid ${C.borde}`, borderRadius:12, padding:"10px 14px", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>Cerrar</button>
          <button onClick={() => onSave(form)} disabled={!canSave} style={{ background:C.brandSecondaryStrong, color:"white", border:"none", borderRadius:12, padding:"10px 16px", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif", opacity:canSave?1:0.55 }}>Guardar</button>
        </div>
      </div>
    </Modal>
  );
}

function RecursosNav({ sections, onSelect }) {
  const { isMobile } = useBreakpoint();

  return (
    <nav aria-label="Navegación interna de Recursos" style={{ display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none", background:"rgba(255,255,255,0.82)", border:`1px solid ${C.borde}`, borderRadius:14, padding:6, boxShadow:"0 1px 6px rgba(17,20,24,0.04)", minWidth:0 }}>
      {sections.map(section => (
        <button key={section.id} onClick={() => onSelect(section.id)} style={{ flex:isMobile?"0 0 132px":"1 1 0", minWidth:isMobile?132:0, textAlign:"left", background:C.fondo, border:`1px solid ${C.borde}`, borderRadius:10, padding:"8px 10px", cursor:"pointer", fontFamily:"'Lato',sans-serif", minHeight:48 }}>
          <span style={{ display:"block", color:C.txt, fontSize:12, fontWeight:850, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{section.label}</span>
          <span style={{ display:"block", color:C.txt2, fontSize:10.5, marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{section.detail}</span>
        </button>
      ))}
    </nav>
  );
}

function RecursosResumenPanel({ resumen, mesVista, año, setMesVista }) {
  const { monthName } = useI18n();
  const { isMobile, isTablet } = useBreakpoint();
  if (!resumen) return null;

  const marginColor = resumen.margen_real >= 0 ? C.sageDark : C.error;
  const potentialColor = resumen.margen_con_potencial >= 0 ? C.brandSecondaryStrong : C.warn;
  const pressureColor = resumen.presion_financiera > 95 ? C.error : resumen.presion_financiera > 80 ? C.warn : C.sageDark;
  const columns = isMobile ? "1fr" : isTablet ? "repeat(2,minmax(0,1fr))" : "repeat(3,minmax(0,1fr))";
  const metrics = [
    { label:"Margen libre real", value:fmt(resumen.margen_real), sub:"sin palancas potenciales", color:marginColor, bg:resumen.margen_real >= 0 ? C.exitoBg : C.errorBg },
    { label:"Presión financiera", value:`${resumen.presion_financiera}%`, sub:`${fmt(resumen.gasto_total_real)} asignados`, color:pressureColor, bg:resumen.presion_financiera > 95 ? C.errorBg : resumen.presion_financiera > 80 ? C.warnBg : C.sageLight },
    { label:"Gasto comprometido", value:fmt(resumen.gasto_comprometido), sub:"fijos, deuda y suministros", color:"#64748b", bg:"#f8fafc" },
    { label:"Tarjeta y cuotas", value:fmt(resumen.presion_tarjeta), sub:"débito y cuotas del mes", color:C.warn, bg:C.warnBg },
    { label:"Palancas potenciales", value:fmt(resumen.palancas_potenciales), sub:"fuera del margen real", color:C.sageDark, bg:C.sageLight },
    { label:"Margen con potencial", value:fmt(resumen.margen_con_potencial), sub:"escenario si se activa", color:potentialColor, bg:C.brandSecondaryFixed },
  ];

  return (
    <section id="recursos-resumen" style={cardN({ padding:isMobile?"15px 13px":"20px 22px", borderColor:C.brandSecondaryBorder, background:`linear-gradient(135deg, ${C.superficie}, ${C.brandSecondaryFixed})`, scrollMarginTop:96 })}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:isMobile?"stretch":"flex-start", gap:12, flexDirection:isMobile?"column":"row", marginBottom:14 }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:11, fontWeight:850, color:C.brandSecondaryStrong, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:5 }}>Resumen de recursos</div>
          <h2 style={{ margin:0, color:C.txt, fontSize:isMobile?22:26, lineHeight:1.1, fontWeight:850 }}>Capacidad del mes</h2>
          <p style={{ margin:"6px 0 0", color:C.txt2, fontSize:13, lineHeight:1.45, maxWidth:760 }}>
            Ingresos confirmados menos dinero ya asignado. Las palancas quedan visibles como potencial, pero no inflan el margen real.
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0, justifyContent:isMobile?"space-between":"flex-start" }}>
          <button onClick={() => setMesVista(i => Math.max(0, i-1))}
            style={{ background:C.superficie, border:`1px solid ${C.borde}`, borderRadius:9, width:32, height:32, cursor:"pointer", fontSize:15, color:C.txt2, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Lato',sans-serif" }}>‹</button>
          <span style={{ fontSize:13, fontWeight:850, color:C.txt, minWidth:112, textAlign:"center" }}>{monthName(mesVista)} {año}</span>
          <button onClick={() => setMesVista(i => Math.min(11, i+1))}
            style={{ background:C.superficie, border:`1px solid ${C.borde}`, borderRadius:9, width:32, height:32, cursor:"pointer", fontSize:15, color:C.txt2, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Lato',sans-serif" }}>›</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:columns, gap:10 }}>
        {metrics.map(metric => (
          <div key={metric.label} style={{ minWidth:0, background:metric.bg, border:`1px solid ${metric.color}33`, borderLeft:`4px solid ${metric.color}`, borderRadius:12, padding:"12px 13px" }}>
            <div style={{ fontSize:10, fontWeight:850, color:metric.color, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{metric.label}</div>
            <div style={{ marginTop:6, fontSize:24, lineHeight:1, fontWeight:900, color:metric.color, fontFamily:"'Playfair Display',serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{metric.value}</div>
            <div style={{ marginTop:5, fontSize:11, color:C.txt2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{metric.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:12, display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(3,minmax(0,1fr))", gap:8 }}>
        {[
          { label:"Ingresos confirmados", value:fmt(resumen.ingresos_confirmados), color:C.brandSecondaryStrong },
          { label:"Dinero asignado", value:fmt(resumen.gasto_total_real), color:pressureColor },
          { label:"Disponible real", value:fmt(resumen.margen_real), color:marginColor },
        ].map(item => (
          <div key={item.label} style={{ display:"flex", justifyContent:"space-between", gap:10, alignItems:"center", minWidth:0, background:"rgba(255,255,255,0.72)", border:`1px solid ${C.borde}`, borderRadius:10, padding:"9px 11px" }}>
            <span style={{ fontSize:11, color:C.txt2, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.04em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.label}</span>
            <strong style={{ fontSize:13, color:item.color, flexShrink:0 }}>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
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
