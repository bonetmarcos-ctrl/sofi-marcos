import { useMemo, useState } from "react";
import { CATEGORIAS, SUMINISTROS_TIPOS, COLOR_VIAJE, BG_VIAJE, categoriaEvento, categoriaEventoKey } from "../../constants/categorias.ts";
import { C, cardN } from "../../constants/colores.ts";
import { MESES } from "../../constants/meses.ts";
import { fmt, fmtd } from "../../utils/format.ts";
import { BASE } from "../../data/demo.ts";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useI18n } from "../../i18n.tsx";

export default function SeccionGastosVariables({ eventos, viajes, año, mesActual, suministros, setSuministros }) {
  const { t, monthName } = useI18n();
  const [mesIdx,   setMesIdx]   = useState(mesActual);
  const [editando, setEditando] = useState(null);
  const { isMobile, isTablet } = useBreakpoint();

  const pref        = `${año}-${String(mesIdx + 1).padStart(2, "0")}`;
  const prefAnterior = mesIdx > 0 ? `${año}-${String(mesIdx).padStart(2, "0")}` : `${año - 1}-12`;
  const fixedCostForMonth = BASE.monthlyOverrides?.[pref]?.fixedExpenses ?? BASE.gastos_fijos;

  // Suministros del mes
  const suministrosPorClave = useMemo(() => {
    const index = new Map();
    suministros.forEach(s => index.set(`${s.mes}:${s.tipo}`, s));
    return index;
  }, [suministros]);

  const suministrosMes = SUMINISTROS_TIPOS.map(t => {
    const reg = suministrosPorClave.get(`${pref}:${t.key}`);
    return { ...t, importe: reg?.importe ?? 0, notas: reg?.notas ?? "" };
  });
  const totalSuministros = suministrosMes.reduce((a, s) => a + (+s.importe || 0), 0);

  const suministrosAnt = SUMINISTROS_TIPOS.map(t => {
    const reg = suministrosPorClave.get(`${prefAnterior}:${t.key}`);
    return { ...t, importe: reg?.importe ?? null };
  });

  const handleSuministro = (tipo, campo, valor) => {
    setSuministros(prev => {
      const exist = prev.find(s => s.mes === pref && s.tipo === tipo);
      if (exist) return prev.map(s => s.mes===pref && s.tipo===tipo ? { ...s, [campo]: campo==="importe" ? +valor||0 : valor } : s);
      return [...prev, { id:Date.now()+Math.random(), mes:pref, tipo, importe:campo==="importe"?+valor||0:0, notas:campo==="notas"?valor:"" }];
    });
  };

  // Gastos calendario del mes
  const evMes       = useMemo(() => eventos.filter(e => e.fecha.startsWith(pref) && categoriaEvento(e)?.tipo === "gasto"), [eventos, pref]);
  const viajesMes   = useMemo(() => viajes.filter(v => v.inicio?.startsWith(pref) || v.fin?.startsWith(pref)), [viajes, pref]);
  const gastoViajeMes = viajesMes.reduce((a, v) => a + Object.values(v.gastos || {}).reduce<number>((x, y) => x + Number(y || 0), 0), 0);

  const catsCal = Object.entries(CATEGORIAS)
    .filter(([, v]) => v.tipo === "gasto")
    .map(([k, v]) => ({ key:k, ...v, sum:evMes.filter(e => categoriaEventoKey(e)===k).reduce((a, e) => a+e.importe, 0) }))
    .filter(c => c.sum > 0)
    .sort((a, b) => b.sum - a.sum);
  const totalCalendario = catsCal.reduce((a, c) => a + c.sum, 0);
  const totalMes        = totalSuministros + totalCalendario + gastoViajeMes;
  const sectionColumns = isMobile ? "1fr" : isTablet ? "repeat(2,minmax(0,1fr))" : "repeat(4,minmax(0,1fr))";

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
            {(BASE.detalle_fijos || [])
              .filter(d => ["Hipoteca","Seguro de vida","Seguro de hogar","Seguro de coche","Seguro auto"].includes(d.nombre))
              .map(d => rowItem(d.nombre, fmt(d.importe), C.fondo, C.txt2, "#64748b"))
            }
            {(() => {
              const com = (BASE.detalle_fijos || []).find(d => d.nombre === "Comunidad");
              const der = (BASE.detalle_fijos || []).find(d => d.nombre === "Derramas");
              const sum = (com?.importe||0) + (der?.importe||0);
              return sum > 0 ? rowItem("Comunidad + Derramas", fmt(sum), C.fondo, C.txt2, "#64748b") : null;
            })()}
            {rowTotal(t("Monthly total"), fixedCostForMonth, "#64748b", "white")}
          </div>
        </div>

        {/* COL 1: Suministros */}
        <div>
          {colHeader("#d97706","#fef3c7","#d9770633","#d97706",`💡 ${t("Utilities")} (${monthName(mesIdx)})`)}
          <div style={{ display:"grid", gap:5 }}>
            {suministrosMes.map((s, i) => {
              const ant    = suministrosAnt[i];
              const diff   = ant.importe !== null && s.importe > 0 ? s.importe - ant.importe : null;
              const isEdit = editando === `${pref}-${s.key}`;
              return (
                <div key={s.key}
                  style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13, padding:"8px 12px", background:s.importe>0?"#fef3c7":C.fondo, borderRadius:9, border:`1px solid ${s.importe>0?"#d9770633":C.borde}`, cursor:"pointer", transition:"all 0.15s" }}
                  onClick={() => setEditando(isEdit ? null : `${pref}-${s.key}`)}>
                  <div>
                    <span style={{ color:s.importe>0?"#d97706":C.txt2 }}>{s.emoji} {t(s.label)}</span>
                    {diff !== null && (
                      <span style={{ fontSize:9, marginLeft:6, fontWeight:700, color:diff>0?C.error:C.sageDark }}>
                        {diff > 0 ? `▲+${fmt(diff)}` : diff < 0 ? `▼${fmt(diff)}` : ""}
                      </span>
                    )}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    {isEdit ? (
                      <input autoFocus type="number" min="0" step="0.01" value={s.importe || ""} placeholder="0"
                        onClick={e => e.stopPropagation()}
                        onChange={e => handleSuministro(s.key, "importe", e.target.value)}
                        style={{ width:72, padding:"3px 6px", borderRadius:7, border:`1px solid #d97706`, fontSize:13, fontWeight:700, textAlign:"right", fontFamily:"'Lato',sans-serif", outline:"none", color:"#d97706" }}/>
                    ) : (
                      <span style={{ fontWeight:700, color:s.importe>0?"#d97706":C.txt2 }}>{s.importe>0?fmt(s.importe):"—"}</span>
                    )}
                    <span style={{ fontSize:10, color:C.txt2 }}>{isEdit?"✓":"✏️"}</span>
                  </div>
                </div>
              );
            })}
            {rowTotal(`${t("Total")} ${monthName(mesIdx)}`, totalSuministros, "#d97706", "white")}
          </div>
        </div>

        {/* COL 2: Discrecional */}
        <div>
          {colHeader(C.lavender, C.lavLight, `${C.lavender}33`, C.lavender, `🗓️ ${t("Discretionary")} (${monthName(mesIdx)})`)}
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
          </div>
        </div>

        {/* COL 3: Viajes */}
        <div>
          {colHeader(COLOR_VIAJE, BG_VIAJE, `${COLOR_VIAJE}33`, COLOR_VIAJE, `✈️ ${t("Trips")} (${monthName(mesIdx)})`)}
          <div style={{ display:"grid", gap:5 }}>
            {viajesMes.length === 0
              ? <div style={{ textAlign:"center", padding:"20px 0", fontSize:12, color:C.txt2 }}>{t("No trips this month")}</div>
              : viajesMes.map(v => {
                const total = Object.values(v.gastos || {}).reduce<number>((x, y) => x + Number(y || 0), 0);
                return (
                  <div key={v.id} style={{ fontSize:13, padding:"8px 12px", background:BG_VIAJE, borderRadius:9, border:`1px solid ${COLOR_VIAJE}33` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ color:COLOR_VIAJE, fontWeight:600 }}>{v.emoji||"✈️"} {v.nombre}</span>
                      <span style={{ fontWeight:700, color:COLOR_VIAJE }}>{fmt(total)}</span>
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
    </div>
  );
}
