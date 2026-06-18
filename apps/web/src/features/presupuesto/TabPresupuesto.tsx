import { useMemo, useState } from "react";
import { CATEGORIAS, SUBCAT_VAR, COLOR_VIAJE, BG_VIAJE } from "../../constants/categorias.ts";
import { C, cardN } from "../../constants/colores.ts";
import { MESES, MESES_CORTO } from "../../constants/meses.ts";
import { fmt, fmtd, labelMes } from "../../utils/format.ts";
import { todayISO, addMeses, daysBetween } from "../../utils/dates.ts";
import { calcDeuda } from "../../utils/calcDeuda.ts";
import { useDatosMes, calcCuotaDeudaMes } from "../../hooks/useDatosMes.ts";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useI18n } from "../../i18n.tsx";
import { BASE } from "../../data/demo.ts";
import PanelDeudas from "./PanelDeudas.tsx";
import SeccionGastosVariables from "./SeccionGastosVariables.tsx";
import ModalPalanca from "./modals/ModalPalanca.tsx";
import ModalDeuda from "./modals/ModalDeuda.tsx";

export default function TabPresupuesto({ eventos, viajes, palancas, setPalancas, deudas, setDeudas, suministros, setSuministros }) {
  const { t, monthName } = useI18n();
  const año       = new Date().getFullYear();
  const mesActual = new Date().getMonth();
  const { isMobile, isTablet } = useBreakpoint();

  const [mesDetalle,  setMesDetalle]  = useState(null);
  const [hoveredMes,  setHoveredMes]  = useState(null);
  const [modalPalanca,setModalPalanca]= useState(null);
  const [modalDeuda,  setModalDeuda]  = useState(null);
  const [showDeudas,  setShowDeudas]  = useState(false);

  // ── Handlers palancas ──
  const guardarPalanca  = (p) => { setPalancas(prev => p.id && prev.find(x=>x.id===p.id) ? prev.map(x=>x.id===p.id?p:x) : [...prev,p]); setModalPalanca(null); };
  const eliminarPalanca = (id) => { setPalancas(prev=>prev.filter(x=>x.id!==id)); setModalPalanca(null); };
  const togglePalanca   = (id) => setPalancas(prev=>prev.map(p=>p.id===id?{...p,activa:!p.activa}:p));

  // ── Handlers deudas ──
  const guardarDeuda    = (d) => { setDeudas(prev => d.id && prev.find(x=>x.id===d.id) ? prev.map(x=>x.id===d.id?d:x) : [...prev,d]); setModalDeuda(null); };
  const eliminarDeuda   = (id) => { setDeudas(prev=>prev.filter(x=>x.id!==id)); setModalDeuda(null); };

  // ── Datos calculados ──
  const { datosMes, totales } = useDatosMes({ eventos, viajes, palancas, deudas, suministros, año, mesActual });
  const detalle = mesDetalle !== null ? datosMes[mesDetalle] : null;

  // KPIs deudas
  const prefActual      = `${año}-${String(mesActual+1).padStart(2,"0")}`;
  const totalPendiente  = useMemo(() => deudas.reduce((a,d)=>{ const c=calcDeuda(d); return a+c.pendiente_capital+c.intereses_pendientes; },0), [deudas]);
  const cuotaMesActual  = useMemo(() => calcCuotaDeudaMes(deudas, prefActual), [deudas, prefActual]);
  const proxVencimiento = useMemo(() => deudas
    .map(d=>({ ...d, fin:addMeses(d.mes_inicio, d.cuotas_totales-1) }))
    .filter(d=>d.fin>=todayISO.slice(0,7))
    .sort((a,b)=>a.fin.localeCompare(b.fin))[0], [deudas]);

  // Gastos por categoría anual
  const gastosCatAnual = useMemo(() => Object.entries(CATEGORIAS)
    .filter(([,v])=>v.tipo==="gasto")
    .map(([k,v])=>({ ...v, key:k, sum:eventos.filter(e=>e.categoria===k&&e.fecha.startsWith(`${año}`)).reduce((a,e)=>a+e.importe,0) }))
    .filter(c=>c.sum>0).sort((a,b)=>b.sum-a.sum), [eventos, año]);

  const kpiColumns = isMobile ? "1fr" : isTablet ? "repeat(2,minmax(0,1fr))" : "repeat(3,minmax(0,1fr))";
  const threeColumns = isMobile ? "1fr" : isTablet ? "repeat(2,minmax(0,1fr))" : "repeat(3,minmax(0,1fr))";
  const debtProjectionColumns = `92px ${deudas.map(() => "minmax(86px,1fr)").join(" ")} 96px 104px`;

  return (
    <div style={{ display:"grid", gap:20, minWidth:0 }}>

      {/* ── KPIs ── */}
      <div style={{ display:"grid", gridTemplateColumns:kpiColumns, gap:isMobile?10:12 }}>
        <div style={{ ...cardN(), borderTop:`3px solid ${C.cyan}` }}>
          <div style={{ fontSize:10,fontWeight:700,color:C.cyan,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6 }}>💶 {t("Fixed income")}</div>
          <div style={{ fontSize:26,fontWeight:700,color:C.txt,fontFamily:"'Playfair Display',serif" }}>{fmt(BASE.ingresos_fijos)}</div>
          <div style={{ fontSize:11,color:C.txt2,marginTop:3 }}>{t("guaranteed monthly")}</div>
        </div>
        <div style={{ ...cardN(), borderTop:`3px solid ${C.lavender}` }}>
          <div style={{ fontSize:10,fontWeight:700,color:C.lavender,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6 }}>📈 {t("Variable income")}</div>
          <div style={{ fontSize:26,fontWeight:700,color:C.txt,fontFamily:"'Playfair Display',serif" }}>{fmt(totales.varAnual)}</div>
          <div style={{ fontSize:11,color:C.txt2,marginTop:3 }}>{t("year to date")} {año}</div>
        </div>
        <div style={{ ...cardN(), borderTop:`3px solid ${C.sage}`, background:`linear-gradient(135deg,${C.superficie},${C.sageLight})` }}>
          <div style={{ fontSize:10,fontWeight:700,color:C.sageDark,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6 }}>✨ {t("Inactive potential")}</div>
          <div style={{ fontSize:26,fontWeight:700,color:C.sageDark,fontFamily:"'Playfair Display',serif" }}>{fmt(totales.potencial)}</div>
          <div style={{ fontSize:11,color:C.sageDark,opacity:0.7,marginTop:3 }}>{palancas.filter(p=>!p.activa).length} {t("Levers")}</div>
        </div>
        <div style={{ ...cardN(), borderTop:`3px solid ${C.warn}` }}>
          <div style={{ fontSize:10,fontWeight:700,color:"#b45309",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6 }}>📌 {t("Fixed expenses")}</div>
          <div style={{ fontSize:26,fontWeight:700,color:C.txt,fontFamily:"'Playfair Display',serif" }}>{fmt(BASE.gastos_fijos+BASE.deudas+BASE.previsiones)}</div>
          <div style={{ fontSize:11,color:C.txt2,marginTop:3 }}>{t("monthly structure")}</div>
        </div>
        <div style={{ ...cardN(), borderTop:`3px solid ${totales.presionActual>85?C.error:totales.presionActual>70?C.warn:C.exito}` }}>
          <div style={{ fontSize:10,fontWeight:700,color:C.txt2,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6 }}>⚡ {t("Financial pressure")}</div>
          <div style={{ fontSize:26,fontWeight:700,color:totales.presionActual>85?C.error:totales.presionActual>70?C.warn:C.sageDark,fontFamily:"'Playfair Display',serif" }}>{totales.presionActual}%</div>
          <div style={{ fontSize:11,color:C.txt2,marginTop:3 }}>{t("of committed income")}</div>
          <div style={{ marginTop:8,height:4,background:C.borde,borderRadius:4,overflow:"hidden" }}>
            <div style={{ width:`${totales.presionActual}%`,height:"100%",borderRadius:4,background:totales.presionActual>85?C.error:totales.presionActual>70?C.warn:C.exito,transition:"width 0.5s" }}/>
          </div>
        </div>
        <div style={{ ...cardN(), background:"linear-gradient(135deg,#1e1a2e,#2d1f3d)", border:"none", cursor:"pointer" }} onClick={()=>setShowDeudas(true)}>
          <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6 }}>💳 {t("Outstanding debt")}</div>
          <div style={{ fontSize:26,fontWeight:700,color:C.warn,fontFamily:"'Playfair Display',serif" }}>{fmt(totalPendiente)}</div>
          <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:3 }}>{fmt(cuotaMesActual)}{t("/month")} · {deudas.length} {t("debts")}</div>
          {proxVencimiento && (
            <div style={{ marginTop:8,fontSize:10,color:"rgba(255,255,255,0.3)" }}>
              {t("Next payoff")}: {proxVencimiento.nombre} · {labelMes(addMeses(proxVencimiento.mes_inicio, proxVencimiento.cuotas_totales-1))}
            </div>
          )}
        </div>
      </div>

      {/* ── ESTRUCTURA DE INGRESOS ── */}
      <div style={cardN(isMobile ? { padding:"14px 12px" } : undefined)}>
        <div style={{ fontSize:16,fontWeight:700,color:C.txt,marginBottom:4 }}>{t("Income structure")}</div>
        <div style={{ fontSize:12,color:C.txt2,marginBottom:16 }}>{t("Guaranteed fixed · Recorded variable · Activatable potential")}</div>
        <div style={{ display:"grid", gridTemplateColumns:threeColumns, gap:isMobile?12:16 }}>

          {/* Fijos */}
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"8px 12px",background:C.cyanLight,borderRadius:10,border:`1px solid ${C.cyan}33` }}>
              <div style={{ width:10,height:10,borderRadius:"50%",background:C.cyan,flexShrink:0 }}/>
              <span style={{ fontSize:12,fontWeight:700,color:C.cyan,textTransform:"uppercase",letterSpacing:"0.6px" }}>{t("Fixed income")}</span>
            </div>
            <div style={{ display:"grid", gap:5 }}>
              {BASE.detalle_ingresos.map(d => (
                <div key={d.nombre} style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"8px 12px",background:C.fondo,borderRadius:9,border:`1px solid ${C.borde}` }}>
                  <span style={{ color:C.txt2 }}>{d.nombre}</span>
                  <span style={{ fontWeight:700,color:C.txt }}>{fmt(d.importe)}</span>
                </div>
              ))}
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"9px 12px",background:C.cyan,borderRadius:9,color:"white",marginTop:2 }}>
                <span style={{ fontWeight:700 }}>{t("Monthly total")}</span><span style={{ fontWeight:700 }}>{fmt(BASE.ingresos_fijos)}</span>
              </div>
            </div>
          </div>

          {/* Variables */}
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"8px 12px",background:C.lavLight,borderRadius:10,border:`1px solid ${C.lavender}33` }}>
              <div style={{ width:10,height:10,borderRadius:"50%",background:C.lavender,flexShrink:0 }}/>
              <span style={{ fontSize:12,fontWeight:700,color:C.lavender,textTransform:"uppercase",letterSpacing:"0.6px" }}>{t("Variable income")} ({monthName(mesActual)})</span>
            </div>
            <div style={{ display:"grid", gap:5 }}>
              {Object.entries(SUBCAT_VAR).map(([k,v]) => {
                const dm  = datosMes[mesActual];
                const val = k==="habitacion"?dm.ing_habitacion:k==="coche"?dm.ing_coche:k==="ventas"?dm.ing_ventas:dm.ing_otros;
                return (
                  <div key={k} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,padding:"8px 12px",background:val>0?v.bg:C.fondo,borderRadius:9,border:`1px solid ${val>0?v.color+"33":C.borde}` }}>
                    <span style={{ color:val>0?v.color:C.txt2 }}>{v.emoji} {t(v.label)}</span>
                    <span style={{ fontWeight:700,color:val>0?v.color:C.txt2 }}>{val>0?fmt(val):"—"}</span>
                  </div>
                );
              })}
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"9px 12px",background:C.lavender,borderRadius:9,color:"white",marginTop:2 }}>
                <span style={{ fontWeight:700 }}>{t("This month total")}</span><span style={{ fontWeight:700 }}>{fmt(datosMes[mesActual]?.ingresos_var_total||0)}</span>
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
              <button onClick={()=>setModalPalanca({})} style={{ background:C.sage,color:"white",border:"none",borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Lato',sans-serif" }}>+ {t("New")}</button>
            </div>
            <div style={{ display:"grid", gap:6 }}>
              {palancas.length === 0 && <div style={{ textAlign:"center",padding:"20px 0",fontSize:12,color:C.txt2 }}>{t("No levers yet")}</div>}
              {palancas.map(p => {
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
      <SeccionGastosVariables eventos={eventos} viajes={viajes} año={año} mesActual={mesActual} suministros={suministros} setSuministros={setSuministros}/>

      {/* ── GRÁFICO MENSUAL APILADO ── */}
      <div style={cardN(isMobile ? { padding:"14px 12px" } : undefined)}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4,flexDirection:isMobile?"column":"row",gap:isMobile?8:12 }}>
          <div>
            <div style={{ fontSize:16,fontWeight:700,color:C.txt }}>{t("Layered expenses")} - {año}</div>
            <div style={{ fontSize:12,color:C.txt2,marginTop:2 }}>{t("Hover each bar · future months are gray estimates")}</div>
          </div>
          <div style={{ display:"flex",gap:12,alignItems:"center",flexWrap:"wrap" }}>
            {[{color:"#64748b",label:`1 ${t("Structural")}`},{color:"#d97706",label:`2 ${t("Utilities")}`},{color:C.lavender,label:`3 ${t("Discretionary")}`}].map(l=>(
              <div key={l.label} style={{ display:"flex",alignItems:"center",gap:4 }}>
                <div style={{ width:10,height:10,borderRadius:2,background:l.color,flexShrink:0 }}/>
                <span style={{ fontSize:10,color:C.txt2,fontWeight:600 }}>{l.label}</span>
              </div>
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
            const h3       = m.total_gastos>0?(m.gasto_discrecional/m.total_gastos)*totalH:0;
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
                      {l:`3 ${t("Discretionary")}`, v:fmt(m.gasto_discrecional), c:C.lavender},
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
            <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":threeColumns,gap:8,marginBottom:12 }}>
              {[
                {l:`1 ${t("Structural")}`,  v:fmt(detalle.gasto_estructural),  c:"#64748b", bg:"#f8fafc", sub:`${t("Fixed expenses")} ${fmt(BASE.gastos_fijos)} + ${t("Debt")} ${fmt(detalle.gasto_deudas)}`},
                {l:`2 ${t("Utilities")}`,  v:fmt(detalle.gasto_suministros),  c:"#d97706", bg:"#fef3c7", sub:"Power, gas, water, internet..."},
                {l:`3 ${t("Discretionary")}`, v:fmt(detalle.gasto_discrecional), c:C.lavender,bg:C.lavLight,sub:`${t("Calendar")} ${fmt(detalle.gastos_var)} + ${t("Trips")} ${fmt(detalle.gastos_viaje)}`},
              ].map(x=>(
                <div key={x.l} style={{ background:x.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${x.c}33` }}>
                  <div style={{ fontSize:10,color:x.c,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4 }}>{x.l}</div>
                  <div style={{ fontSize:18,fontWeight:700,color:x.c,fontFamily:"'Playfair Display',serif" }}>{x.v}</div>
                  <div style={{ fontSize:10,color:x.c,opacity:0.7,marginTop:3 }}>{x.sub}</div>
                </div>
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

      {/* ── GASTOS POR CATEGORÍA ── */}
      {gastosCatAnual.length > 0 && (
        <div style={cardN(isMobile ? { padding:"14px 12px" } : undefined)}>
          <div style={{ fontSize:16,fontWeight:700,color:C.txt,marginBottom:14 }}>{t("Variable expenses by category")} - {año}</div>
          <div style={{ display:"grid", gap:10 }}>
            {gastosCatAnual.map(c=>(
              <div key={c.key}>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5 }}>
                  <span style={{ color:c.color,fontWeight:600 }}>{c.emoji} {t(c.label)}</span>
                  <span style={{ fontWeight:700,color:C.txt }}>{fmtd(c.sum)}</span>
                </div>
                <div style={{ height:6,background:C.borde,borderRadius:6,overflow:"hidden" }}>
                  <div style={{ width:`${(c.sum/gastosCatAnual[0].sum)*100}%`,height:"100%",background:c.color,borderRadius:6,transition:"width 0.5s" }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VIAJES ── */}
      {viajes.length > 0 && (
        <div style={cardN(isMobile ? { padding:"14px 12px" } : undefined)}>
          <div style={{ fontSize:16,fontWeight:700,color:C.txt,marginBottom:14 }}>✈️ {t("Trips")} {año}</div>
          <div style={{ display:"grid", gap:8 }}>
            {viajes.map(v=>{
              const total=Object.values(v.gastos||{}).reduce<number>((a,b)=>a+Number(b || 0),0);
              const pct=v.presupuesto>0?Math.min(100,(total/v.presupuesto)*100):0;
              return(
                <div key={v.id} style={{ padding:"12px 14px",background:C.fondo,borderRadius:12,border:`1px solid ${C.borde}` }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                    <div>
                      <span style={{ fontSize:20,marginRight:8 }}>{v.emoji}</span>
                      <span style={{ fontWeight:700,color:v.color||C.lavender,fontSize:15 }}>{v.nombre}</span>
                      {v.inicio&&<div style={{ fontSize:11,color:C.txt2,marginTop:2 }}>{v.inicio.split("-").reverse().join("/")} → {v.fin?.split("-").reverse().join("/")} · {daysBetween(v.inicio,v.fin)}n</div>}
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:18,fontWeight:700,color:C.txt }}>{fmt(total)}</div>
                      {v.presupuesto>0&&<div style={{ fontSize:11,color:C.txt2 }}>{t("of")} {fmt(v.presupuesto)}</div>}
                    </div>
                  </div>
                  {v.presupuesto>0&&<div style={{ height:4,background:C.borde,borderRadius:4,overflow:"hidden" }}><div style={{ width:`${pct}%`,height:"100%",background:v.color||C.lavender,borderRadius:4 }}/></div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PANEL DEUDAS ── */}
      {showDeudas && (
        <PanelDeudas deudas={deudas} totalPendiente={totalPendiente} cuotaMesActual={cuotaMesActual} onNueva={()=>setModalDeuda({})} onEditar={(d)=>setModalDeuda(d)} onCerrar={()=>setShowDeudas(false)}/>
      )}

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

      {modalPalanca !== null && <ModalPalanca palanca={modalPalanca?.id?modalPalanca:undefined} onSave={guardarPalanca} onDelete={eliminarPalanca} onClose={()=>setModalPalanca(null)}/>}
      {modalDeuda   !== null && <ModalDeuda   deuda={modalDeuda?.id?modalDeuda:undefined}       onSave={guardarDeuda}   onDelete={eliminarDeuda}   onClose={()=>setModalDeuda(null)}/>}
    </div>
  );
}
