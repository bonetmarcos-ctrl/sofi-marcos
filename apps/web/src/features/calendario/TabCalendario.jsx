import { useMemo, useState } from "react";
import { CATEGORIAS } from "../../constants/categorias.js";
import { C, cardN, inputS, labelS } from "../../constants/colores.js";
import { MESES } from "../../constants/meses.js";
import { fmt, fmtd, labelMes } from "../../utils/format.js";
import { todayISO, toISO, daysBetween } from "../../utils/dates.js";
import { BASE } from "../../data/demo.js";
import { useBreakpoint } from "../../hooks/useBreakpoint.js";
import CalMensual from "./CalMensual.jsx";
import CalSemanal from "./CalSemanal.jsx";

export default function TabCalendario({ eventos, viajes, bloqueos, setBloqueos, setModal }) {
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
  const labelSem   = `${inicio.getDate()} ${MESES[inicio.getMonth()].slice(0,3)} — ${finSemana.getDate()} ${MESES[finSemana.getMonth()].slice(0,3)} ${finSemana.getFullYear()}`;

  // ── Panel lateral: métricas del mes ──
  const pref         = `${año}-${String(mes + 1).padStart(2, "0")}`;
  const del_mes      = useMemo(() => eventos.filter(e => e.fecha.startsWith(pref)), [eventos, pref]);
  const ingresos_extra = useMemo(() => del_mes.filter(e => CATEGORIAS[e.categoria]?.tipo === "ingreso").reduce((a, e) => a + e.importe, 0), [del_mes]);
  const gastos_var     = useMemo(() => del_mes.filter(e => CATEGORIAS[e.categoria]?.tipo === "gasto").reduce((a, e) => a + e.importe, 0), [del_mes]);
  const viajes_mes     = useMemo(() => viajes.filter(v => v.inicio?.startsWith(pref) || v.fin?.startsWith(pref)), [viajes, pref]);
  const gastos_viaje   = useMemo(() => viajes_mes.reduce((a, v) => a + Object.values(v.gastos || {}).reduce((x, y) => x + y, 0), 0), [viajes_mes]);
  const saldo          = (BASE.ingresos_fijos + ingresos_extra) - (BASE.gastos_fijos + BASE.deudas + BASE.previsiones + gastos_var + gastos_viaje);

  const totalCocheAcum = useMemo(() => eventos.filter(e => e.categoria === "coche").reduce((a, e) => a + e.importe, 0), [eventos]);

  const porCat = useMemo(() => Object.entries(CATEGORIAS)
    .filter(([, v]) => v.tipo === "gasto")
    .map(([k, v]) => ({ ...v, key:k, sum:del_mes.filter(e => e.categoria === k).reduce((a, e) => a + e.importe, 0) }))
    .filter(c => c.sum > 0)
    .sort((a, b) => b.sum - a.sum), [del_mes]);
  const maxCat = Math.max(porCat[0]?.sum || 1, gastos_viaje || 1);
  const layoutColumns = isMobile || isTablet ? "1fr" : "minmax(0,1fr) 290px";

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
                {v === "mensual" ? "📅 Mes" : "📋 Semana"}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, width:isMobile?"100%":"auto", justifyContent:isMobile?"space-between":"flex-start" }}>
            <button onClick={() => vista === "mensual" ? navMes(-1) : navSemana(-1)}
              style={{ background:C.superficie, border:`1px solid ${C.borde}`, borderRadius:9, width:32, height:32, cursor:"pointer", fontSize:16, color:C.cyan, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
            <span style={{ fontSize:isMobile?13:15, fontWeight:700, color:C.txt, minWidth:isMobile?150:190, textAlign:"center" }}>
              {vista === "mensual" ? `${MESES[mes]} ${año}` : labelSem}
            </span>
            <button onClick={() => vista === "mensual" ? navMes(1) : navSemana(1)}
              style={{ background:C.superficie, border:`1px solid ${C.borde}`, borderRadius:9, width:32, height:32, cursor:"pointer", fontSize:16, color:C.cyan, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
          </div>
          <button onClick={() => setModal({ type:"evento", fecha:todayISO })}
            style={{ background:C.cyan, color:"white", border:"none", borderRadius:10, padding:"8px 16px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
            + Evento
          </button>
        </div>

        {/* Leyenda + bloqueos */}
        <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
          <button onClick={() => setModalBloqueo({ tipo:"habitacion" })}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:9, background:C.sageLight, border:`1px solid ${C.sage}`, fontSize:11, fontWeight:700, color:C.sageDark, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
            🛏️ Bloquear habitación
          </button>
          <button onClick={() => setModalBloqueo({ tipo:"coche" })}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:9, background:"#fef3c7", border:"1px solid #fcd34d", fontSize:11, fontWeight:700, color:"#b45309", cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
            🚗 Bloquear coche
          </button>
          <div style={{ marginLeft:isMobile?0:"auto", display:"flex", gap:10, fontSize:11, color:C.txt2, flexWrap:"wrap" }}>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, borderRadius:"50%", background:C.lavender, display:"inline-block" }}/> Sofi</span>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, borderRadius:"50%", background:C.cyan, display:"inline-block" }}/> Marqui</span>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, background:C.cyanMid, display:"inline-block", borderRadius:2 }}/> Viaje</span>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, background:"repeating-linear-gradient(45deg,#ecfdf5,#ecfdf5 3px,#d1fae5 3px,#d1fae5 6px)", display:"inline-block", border:`1px solid ${C.sage}`, borderRadius:2 }}/> Ocupada</span>
          </div>
        </div>

        {/* Calendario */}
        <div style={{ ...cardN(isMobile ? { padding:"12px 10px", overflowX:"auto" } : undefined) }}>
          {vista === "mensual"
            ? <CalMensual año={año} mes={mes} eventos={eventos} viajes={viajes} bloqueos={bloqueos} onDia={f => setModal({ type:"evento", fecha:f })} onEvento={ev => setModal({ type:"evento", item:ev })} onViaje={v => setModal({ type:"viaje", item:v })}/>
            : <CalSemanal inicio={inicio} eventos={eventos} viajes={viajes} bloqueos={bloqueos} onDia={f => setModal({ type:"evento", fecha:f })} onEvento={ev => setModal({ type:"evento", item:ev })} onViaje={v => setModal({ type:"viaje", item:v })}/>
          }
        </div>

        {/* Modal bloqueo */}
        {modalBloqueo && (
          <div onClick={e => e.target === e.currentTarget && setModalBloqueo(null)}
            style={{ position:"fixed", inset:0, background:"rgba(17,20,24,0.55)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
            <div style={{ background:C.superficie, borderRadius:20, padding:24, width:"100%", maxWidth:360, boxShadow:"0 24px 60px rgba(0,0,0,0.2)", border:`1px solid ${C.borde}` }}>
              <div style={{ fontSize:17, fontWeight:700, color:C.txt, marginBottom:16 }}>
                {modalBloqueo.tipo === "habitacion" ? "🛏️ Bloquear habitación" : "🚗 Bloquear coche"}
              </div>
              <div style={{ display:"grid", gap:10 }}>
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>Desde</label>
                  <input type="date" value={modalBloqueo.inicio || ""} onChange={e => setModalBloqueo(m => ({ ...m, inicio:e.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                </div>
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>Hasta</label>
                  <input type="date" value={modalBloqueo.fin || ""} onChange={e => setModalBloqueo(m => ({ ...m, fin:e.target.value }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                </div>
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>Nota</label>
                  <input value={modalBloqueo.nota || ""} onChange={e => setModalBloqueo(m => ({ ...m, nota:e.target.value }))} placeholder="Huéspedes, motivo..." style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                </div>
                {modalBloqueo.inicio && modalBloqueo.fin && (
                  <div style={{ background:C.sageLight, borderRadius:9, padding:"9px 12px", fontSize:12, color:C.sageDark, fontWeight:600, border:`1px solid ${C.sage}44` }}>
                    📅 {daysBetween(modalBloqueo.inicio, modalBloqueo.fin)} noche{daysBetween(modalBloqueo.inicio, modalBloqueo.fin) !== 1 ? "s" : ""}
                  </div>
                )}
                <button
                  onClick={() => { setBloqueos(prev => [...prev, { ...modalBloqueo, id:Date.now() }]); setModalBloqueo(null); }}
                  style={{ background:C.cyan, color:"white", border:"none", borderRadius:11, padding:11, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
                  Guardar bloqueo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── PANEL LATERAL ── */}
      <div style={{ display:"grid", gap:10, position:isMobile || isTablet ? "static":"sticky", top:70 }}>

        {/* Saldo del mes */}
        <div style={{ background:saldo>=0?"linear-gradient(135deg,#0f2d1a,#1a4728)":"linear-gradient(135deg,#2d0f0f,#471a1a)", borderRadius:16, padding:"16px 18px", color:"white" }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:"0.8px" }}>{labelMes(pref)}</div>
          <div style={{ fontSize:28, fontWeight:700, color:saldo>=0?C.exito:"#f87171", marginTop:4, fontFamily:"'Playfair Display',serif" }}>{fmt(saldo)}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:3 }}>saldo libre del mes</div>
        </div>

        {/* Extras + Variable */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <div style={{ background:C.exitoBg, border:`1px solid ${C.exito}55`, borderRadius:12, padding:"12px 13px" }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.sageDark, textTransform:"uppercase", letterSpacing:"0.6px" }}>Extras</div>
            <div style={{ fontSize:19, fontWeight:700, color:C.sageDark, marginTop:4 }}>{fmt(ingresos_extra)}</div>
          </div>
          <div style={{ background:C.lavLight, border:`1px solid ${C.lavender}44`, borderRadius:12, padding:"12px 13px" }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.lavender, textTransform:"uppercase", letterSpacing:"0.6px" }}>Variable</div>
            <div style={{ fontSize:19, fontWeight:700, color:C.lavender, marginTop:4 }}>{fmt(gastos_var + gastos_viaje)}</div>
          </div>
        </div>

        {/* Por categoría */}
        {(porCat.length > 0 || gastos_viaje > 0) && (
          <div style={cardN()}>
            <div style={{ fontSize:11, fontWeight:700, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:10 }}>Por categoría</div>
            {gastos_viaje > 0 && (
              <div style={{ marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                  <span style={{ color:C.cyanMid, fontWeight:600 }}>✈️ Viajes</span>
                  <span style={{ fontWeight:700, color:C.txt }}>{fmtd(gastos_viaje)}</span>
                </div>
                <div style={{ height:4, background:C.borde, borderRadius:4, overflow:"hidden" }}>
                  <div style={{ width:`${(gastos_viaje / maxCat) * 100}%`, height:"100%", background:C.cyanMid, borderRadius:4 }}/>
                </div>
              </div>
            )}
            {porCat.map(c => (
              <div key={c.key} style={{ marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                  <span style={{ color:c.color, fontWeight:600 }}>{c.emoji} {c.label}</span>
                  <span style={{ fontWeight:700, color:C.txt }}>{fmtd(c.sum)}</span>
                </div>
                <div style={{ height:4, background:C.borde, borderRadius:4, overflow:"hidden" }}>
                  <div style={{ width:`${(c.sum / maxCat) * 100}%`, height:"100%", background:c.color, borderRadius:4 }}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ROI Coche */}
        <div style={cardN()}>
          <div style={{ fontSize:11, fontWeight:700, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:8 }}>ROI Coche 🚗</div>
          <div style={{ height:6, background:C.borde, borderRadius:6, overflow:"hidden", marginBottom:6 }}>
            <div style={{ width:`${Math.min(100, (totalCocheAcum / BASE.coste_coche) * 100)}%`, height:"100%", background:`linear-gradient(90deg,${C.cyan},${C.cyanMid})`, borderRadius:6 }}/>
          </div>
          <div style={{ fontSize:11, color:C.txt2 }}>
            {fmt(totalCocheAcum)} <span style={{ color:C.txt2 }}>de</span> {fmt(BASE.coste_coche)} · <strong style={{ color:C.cyan }}>{((totalCocheAcum / BASE.coste_coche) * 100).toFixed(1)}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
