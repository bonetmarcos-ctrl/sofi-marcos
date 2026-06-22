import { useState } from "react";
import { C } from "../../constants/colores.ts";
import { fmt, labelMes } from "../../utils/format.ts";
import { addMeses } from "../../utils/dates.ts";
import { calcDeuda } from "../../utils/calcDeuda.ts";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useI18n } from "../../i18n.tsx";

const DEUDA_COLORS = [C.lavender, C.cyan, C.warn, C.sage, C.error, C.cyanMid];

export default function PanelDeudas({ deudas, totalPendiente, cuotaMesActual, onNueva, onEditar, onCerrar = null }) {
  const { t } = useI18n();
  const [expandida, setExpandida] = useState(null);
  const { isMobile, isTablet } = useBreakpoint();
  const hoy       = new Date();
  const todayPref = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  const calcCountdown = (mesFin) => {
    if (!mesFin) return null;
    const [fy, fm] = mesFin.split("-").map(Number);
    const diff = (fy - hoy.getFullYear()) * 12 + (fm - (hoy.getMonth() + 1));
    if (diff < 0)  return { meses:0, label:t("Paid off") };
    if (diff === 0) return { meses:0, label:t("This month!") };
    if (diff < 12)  return { meses:diff, label:`${diff} ${t(diff !== 1 ? "months" : "month")}` };
    const años  = Math.floor(diff / 12);
    const resto = diff % 12;
    return { meses:diff, label:`${años}a ${resto > 0 ? resto + "m" : ""}`.trim() };
  };

  const calcTimeline = (d) =>
    Array.from({ length: d.cuotas_totales }, (_, i) => {
      const mesPref = addMeses(d.mes_inicio, i);
      return { i, mesPref, pagado: i < d.cuota_actual, esActual: mesPref === todayPref };
    });

  const totalActivas        = deudas.filter(d => calcDeuda(d).pendientes > 0).length;
  const totalCapitalPagado  = deudas.reduce((a, d) => a + d.cuota_actual * d.cuota, 0);
  const totalCapital        = deudas.reduce((a, d) => a + d.cuotas_totales * d.cuota, 0);
  const pctGlobal           = totalCapital > 0 ? Math.round((totalCapitalPagado / totalCapital) * 100) : 0;

  return (
    <div style={{ background:"linear-gradient(160deg,#0f1520 0%,#1a1f2e 100%)", borderRadius:16, border:"none", padding:isMobile?"16px 12px":"22px 24px" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:isMobile?"stretch":"center", marginBottom:20, flexDirection:isMobile?"column":"row", gap:isMobile?12:0 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:"white", fontFamily:"'Playfair Display',serif", display:"flex", alignItems:"center", gap:10 }}>
            💳 {t("Debt")}
            <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20, background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.5)" }}>
              {totalActivas} {t("Active")}
            </span>
          </div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:3 }}>{t("Paid principal")} · Timeline · Countdown</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onNueva} style={{ background:C.lavender, color:"white", border:"none", borderRadius:9, padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>+ {t("New")}</button>
          {onCerrar && <button onClick={onCerrar} style={{ background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.45)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, padding:"8px 12px", fontSize:12, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>{t("Close")}</button>}
        </div>
      </div>

      {/* KPIs globales */}
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":isTablet?"repeat(2,minmax(0,1fr))":"repeat(4,minmax(0,1fr))", gap:10, marginBottom:22 }}>
        {[
          { l:t("Outstanding debt"),  v:fmt(totalPendiente),     sub:t("capital + interest"),    accent:C.error    },
          { l:t("This month's payment"),   v:fmt(cuotaMesActual),     sub:t("balance impact"),        accent:C.warn     },
          { l:t("Paid principal"),   v:fmt(totalCapitalPagado), sub:`${pctGlobal}% ${t("of")}`, accent:C.sage     },
          { l:t("Active debts"),   v:totalActivas,            sub:`${t("of")} ${deudas.length} ${t("Total")}`, accent:C.lavender },
        ].map(k => (
          <div key={k.l} style={{ background:"rgba(255,255,255,0.05)", borderRadius:12, padding:"13px 15px", border:`1px solid ${k.accent}33` }}>
            <div style={{ fontSize:10, fontWeight:700, color:k.accent, textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:5 }}>{k.l}</div>
            <div style={{ fontSize:22, fontWeight:700, color:"white", fontFamily:"'Playfair Display',serif" }}>{k.v}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Barra global */}
      <div style={{ marginBottom:22 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:6 }}>
          <span>{t("Global repayment progress")}</span>
          <span style={{ fontWeight:700, color:C.exito }}>{pctGlobal}%</span>
        </div>
        <div style={{ height:8, background:"rgba(255,255,255,0.08)", borderRadius:8, overflow:"hidden" }}>
          <div style={{ width:`${pctGlobal}%`, height:"100%", background:`linear-gradient(90deg,${C.lavender},${C.cyan})`, borderRadius:8, transition:"width 0.6s ease" }}/>
        </div>
      </div>

      {deudas.length === 0 && (
        <div style={{ textAlign:"center", padding:"32px 0", fontSize:14, color:"rgba(255,255,255,0.3)" }}>{t("No debts registered")} 🎉</div>
      )}

      {/* Fichas */}
      <div style={{ display:"grid", gap:12 }}>
        {deudas.map((d, di) => {
          const c        = calcDeuda(d);
          const activa   = c.pendientes > 0;
          const cd       = calcCountdown(c.mes_fin_real);
          const timeline = calcTimeline(d);
          const color    = DEUDA_COLORS[di % DEUDA_COLORS.length];
          const isOpen   = expandida === d.id;
          const capitalPagadoD = d.cuota_actual * d.cuota;
          const capitalTotalD  = d.cuotas_totales * d.cuota;
          const pctCapital     = capitalTotalD > 0 ? Math.round((capitalPagadoD / capitalTotalD) * 100) : 100;

          return (
            <div key={d.id} style={{ background:activa?"rgba(255,255,255,0.04)":"rgba(117,223,144,0.07)", borderRadius:16, border:`1px solid ${activa?color+"44":C.exito+"44"}`, overflow:"hidden", transition:"all 0.2s" }}>

              {/* Cabecera */}
              <div onClick={() => setExpandida(isOpen ? null : d.id)}
                style={{ padding:isMobile?"14px 12px":"16px 18px", cursor:"pointer", display:"flex", alignItems:isMobile?"stretch":"center", gap:isMobile?10:14, flexDirection:isMobile?"column":"row" }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:activa?color:C.exito, flexShrink:0, boxShadow:`0 0 8px ${activa?color:C.exito}88` }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:"white" }}>{d.nombre}</span>
                    {!activa && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:"rgba(117,223,144,0.15)", color:C.exito, fontWeight:700, border:`1px solid ${C.exito}44` }}>✓ {t("Paid off")}</span>}
                  </div>
                  {d.notas && <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.notas}</div>}
                </div>

                {/* Barra progreso compacta */}
                <div style={{ width:isMobile?"100%":120, flexShrink:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>
                    <span>{c.pagadas}/{d.cuotas_totales}</span>
                    <span style={{ color:activa?color:C.exito, fontWeight:700 }}>{c.pct}%</span>
                  </div>
                  <div style={{ height:5, background:"rgba(255,255,255,0.08)", borderRadius:5, overflow:"hidden" }}>
                    <div style={{ width:`${c.pct}%`, height:"100%", background:activa?`linear-gradient(90deg,${color},${color}99)`:`linear-gradient(90deg,${C.sage},${C.exito})`, borderRadius:5, transition:"width 0.5s" }}/>
                  </div>
                </div>

                <div style={{ textAlign:isMobile?"left":"right", flexShrink:0 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:activa?color:C.exito, fontFamily:"'Playfair Display',serif" }}>{fmt(d.cuota + d.interes_mensual)}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>{t("/month")}</div>
                </div>

                <div style={{ textAlign:isMobile?"left":"center", flexShrink:0, width:isMobile?"auto":72 }}>
                  {activa ? (
                    <>
                      <div style={{ fontSize:13, fontWeight:700, color:cd?.meses<=3?C.exito:cd?.meses<=12?C.warn:"rgba(255,255,255,0.7)" }}>{cd?.label}</div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>{t("to free")}</div>
                    </>
                  ) : <div style={{ fontSize:18 }}>🎉</div>}
                </div>

                <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", flexShrink:0, transition:"transform 0.2s", transform:isOpen?"rotate(180deg)":"rotate(0deg)" }}>▼</div>
              </div>

              {/* Panel expandido */}
              {isOpen && (
                <div style={{ padding:"0 18px 18px", borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:16, display:"grid", gap:16 }}>
                  <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:14 }}>

                    {/* Donut capital */}
                    <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:12, padding:"14px 16px", border:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:16, overflowX:"auto" }}>
                      {(() => {
                        const r = 36, cx = 44, cy = 44, stroke = 7;
                        const circ       = 2 * Math.PI * r;
                        const paid       = circ * (pctCapital / 100);
                        const interestPaid = d.cuota_actual * d.interes_mensual;
                        const interestTotal = d.cuotas_totales * d.interes_mensual;
                        return (
                          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                            <svg width={88} height={88} viewBox="0 0 88 88">
                              <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke}/>
                              <circle cx={cx} cy={cy} r={r} fill="none" stroke={activa?color:C.exito} strokeWidth={stroke} strokeDasharray={`${paid} ${circ-paid}`} strokeDashoffset={circ*0.25} strokeLinecap="round" style={{ transition:"stroke-dasharray 0.6s ease" }}/>
                              <circle cx={cx} cy={cy} r={r} fill="none" stroke={color+"33"} strokeWidth={stroke} strokeDasharray={`${circ-paid} ${paid}`} strokeDashoffset={circ*0.25-paid}/>
                              <text x={cx} y={cy-5}  textAnchor="middle" fontSize={13} fontWeight={700} fill="white" fontFamily="'Playfair Display',serif">{pctCapital}%</text>
                              <text x={cx} y={cy+10} textAnchor="middle" fontSize={8}  fill="rgba(255,255,255,0.35)" fontFamily="'Lato',sans-serif">pagado</text>
                            </svg>
                            <div style={{ display:"grid", gap:6 }}>
                              <div>
                                <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginBottom:2 }}>{t("Paid principal")}</div>
                                <div style={{ fontSize:13, fontWeight:700, color:activa?color:C.exito }}>{fmt(capitalPagadoD)}</div>
                              </div>
                              <div>
                                <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginBottom:2 }}>{t("Outstanding principal")}</div>
                                <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.6)" }}>{fmt(c.pendiente_capital)}</div>
                              </div>
                              {d.interes_mensual > 0 && (
                                <div>
                                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginBottom:2 }}>{t("Paid interest")}</div>
                                  <div style={{ fontSize:13, fontWeight:700, color:C.warn }}>{fmt(interestPaid)} <span style={{ fontSize:10, fontWeight:400, color:"rgba(255,255,255,0.3)" }}>{t("of")} {fmt(interestTotal)}</span></div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Datos clave */}
                    <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:12, padding:"14px 16px", border:"1px solid rgba(255,255,255,0.06)", display:"grid", gap:10 }}>
                      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:8 }}>
                        {[
                          { l:t("Monthly payment (€)"),  v:fmt(d.cuota),                      c:"white" },
                          { l:t("Monthly interest / fee (€)"),    v:d.interes_mensual>0?fmt(d.interes_mensual):"—", c:d.interes_mensual>0?C.warn:"rgba(255,255,255,0.3)" },
                          { l:t("Total impact"),  v:fmt(d.cuota+d.interes_mensual),    c:color   },
                          { l:t("Paid payments"), v:`${c.pagadas} / ${d.cuotas_totales}`, c:"rgba(255,255,255,0.7)" },
                        ].map(x => (
                          <div key={x.l} style={{ background:"rgba(255,255,255,0.04)", borderRadius:9, padding:"8px 10px" }}>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:3, textTransform:"uppercase", letterSpacing:"0.5px" }}>{x.l}</div>
                            <div style={{ fontSize:13, fontWeight:700, color:x.c }}>{x.v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background:activa?`${color}18`:"rgba(117,223,144,0.1)", borderRadius:10, padding:"10px 12px", border:`1px solid ${activa?color+"33":C.exito+"33"}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginBottom:2 }}>{t("final payment")}</div>
                          <div style={{ fontSize:14, fontWeight:700, color:activa?color:C.exito }}>{labelMes(c.mes_fin_real)}</div>
                        </div>
                        {activa && cd && (
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontSize:18, fontWeight:700, color:cd.meses<=3?C.exito:cd.meses<=12?C.warn:"white", fontFamily:"'Playfair Display',serif" }}>{cd.label}</div>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>{t("to free")}</div>
                          </div>
                        )}
                        {!activa && <div style={{ fontSize:22 }}>🎉</div>}
                      </div>
                      <button onClick={() => onEditar(d)}
                        style={{ background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.5)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, padding:"7px 0", fontSize:12, cursor:"pointer", fontFamily:"'Lato',sans-serif", fontWeight:600 }}>
                        ✏️ {t("Edit debt")}
                      </button>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:12, padding:"14px 16px", border:"1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:10 }}>
                      Timeline · {d.cuotas_totales} {t("Payments")} {t("From").toLowerCase()} {labelMes(d.mes_inicio)}
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                      {timeline.map(item => (
                        <div key={item.i}
                          title={`${labelMes(item.mesPref)} · ${item.pagado?t("Paid"):item.esActual?t("This month!"):t("Pending")}`}
                          style={{ width:20, height:20, borderRadius:5, background:item.pagado?(activa?color:C.exito):item.esActual?C.warn:"rgba(255,255,255,0.07)", border:item.esActual?`2px solid ${C.warn}`:"2px solid transparent", flexShrink:0, position:"relative", cursor:"default" }}>
                          {item.esActual && <div style={{ position:"absolute", top:-1, right:-1, width:6, height:6, borderRadius:"50%", background:C.warn, border:"1px solid #1a1f2e" }}/>} 
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:14, marginTop:10, fontSize:10, color:"rgba(255,255,255,0.35)" }}>
                      {[
                        { bg:activa?color:C.exito, label:t("Paid") },
                        { bg:C.warn,               label:t("This month!") },
                        { bg:"rgba(255,255,255,0.07)", label:t("Pending"), border:"1px solid rgba(255,255,255,0.15)" },
                      ].map(x => (
                        <span key={x.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
                          <span style={{ width:10, height:10, borderRadius:3, background:x.bg, display:"inline-block", border:x.border }}/>
                          {x.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
