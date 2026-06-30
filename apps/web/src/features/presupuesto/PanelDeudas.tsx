import { useState } from "react";
import { isLinkedCardInstallmentDebt } from "@sofi-marqui/domain";
import { C } from "../../constants/colores.ts";
import { fmt, labelMes } from "../../utils/format.ts";
import { addMeses } from "../../utils/dates.ts";
import { calcDeuda } from "../../utils/calcDeuda.ts";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useI18n } from "../../i18n.tsx";

const DEUDA_COLORS = [C.brandPrimary, "#7A708D", "#8A7D99", "#6F7890"];
const CARD_DEBT_COLOR = C.brandPrimary;
const EXTERNAL_DEBT_COLOR = C.brandTertiary;
const PANEL_BORDER = C.brandPrimaryDim;
const SOFT_LAVENDER = "rgba(110,99,133,0.08)";
const SOFT_LAVENDER_BORDER = "rgba(110,99,133,0.18)";

type DebtRecord = Record<string, any>;

type PanelDeudasProps = {
  deudas: DebtRecord[];
  prefVista?: string;
  totalPendiente: number;
  cuotaMesActual: number;
  onNueva: () => void;
  onEditar: (deuda: DebtRecord) => void;
  onCerrar?: (() => void) | null;
};

export default function PanelDeudas({ deudas, prefVista, totalPendiente, cuotaMesActual, onNueva, onEditar, onCerrar = null }: PanelDeudasProps) {
  const { t } = useI18n();
  const [expandida, setExpandida] = useState(null);
  const { isMobile, isTablet } = useBreakpoint();
  const hoy       = new Date();
  const todayPref = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  const referencePref = prefVista || todayPref;
  const [referenceYear, referenceMonth] = referencePref.split("-").map(Number);

  const calcCountdown = (mesFin) => {
    if (!mesFin) return null;
    const [fy, fm] = mesFin.split("-").map(Number);
    const diff = (fy - referenceYear) * 12 + (fm - referenceMonth);
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
      return { i, mesPref, pagado: i < d.cuota_actual, esActual: mesPref === referencePref };
    });

  const totalActivas        = deudas.filter(d => calcDeuda(d).pendientes > 0).length;
  const totalCapitalPagado  = deudas.reduce((a, d) => a + d.cuota_actual * d.cuota, 0);
  const totalCapital        = deudas.reduce((a, d) => a + d.cuotas_totales * d.cuota, 0);
  const pctGlobal           = totalCapital > 0 ? Math.round((totalCapitalPagado / totalCapital) * 100) : 0;
  const deudasTarjeta       = deudas.filter(isLinkedCardInstallmentDebt);
  const deudasExternas      = deudas.filter(d => !isLinkedCardInstallmentDebt(d));

  return (
    <div style={{ background:`linear-gradient(160deg,${C.brandPrimaryFixed} 0%,#FAF8FB 100%)`, borderRadius:16, border:`1px solid ${PANEL_BORDER}`, boxShadow:"0 1px 6px rgba(17,20,24,0.06)", padding:isMobile?"16px 12px":"22px 24px" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:isMobile?"stretch":"center", marginBottom:20, flexDirection:isMobile?"column":"row", gap:isMobile?12:0 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:C.txt, fontFamily:"'Playfair Display',serif", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            💳 {t("Debt")}
            <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:SOFT_LAVENDER, color:C.brandPrimary, border:`1px solid ${SOFT_LAVENDER_BORDER}` }}>
              {totalActivas} {t("Active")}
            </span>
            <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:20, background:SOFT_LAVENDER, color:CARD_DEBT_COLOR, border:`1px solid ${SOFT_LAVENDER_BORDER}` }}>
              <i className="bi bi-credit-card-2-front" aria-hidden="true" /> {deudasTarjeta.length}
            </span>
            <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:20, background:C.brandTertiaryFixed, color:EXTERNAL_DEBT_COLOR, border:`1px solid ${C.brandTertiaryDim}` }}>
              <i className="bi bi-bank" aria-hidden="true" /> {deudasExternas.length}
            </span>
          </div>
          <div style={{ fontSize:12, color:C.txt2, marginTop:3 }}>{t("Credit card installments")} · {t("External debt")}</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onNueva} style={{ background:C.brandPrimary, color:"white", border:"none", borderRadius:9, padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>+ {t("New")}</button>
          {onCerrar && <button onClick={onCerrar} style={{ background:C.superficie, color:C.txt2, border:`1px solid ${C.borde}`, borderRadius:9, padding:"8px 12px", fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif", display:"inline-flex", alignItems:"center", gap:6, whiteSpace:"nowrap" }}><i className="bi bi-chevron-up" aria-hidden="true" /> Ocultar</button>}
        </div>
      </div>

      {/* KPIs globales */}
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":isTablet?"repeat(2,minmax(0,1fr))":"repeat(4,minmax(0,1fr))", gap:10, marginBottom:22 }}>
        {[
          { l:t("Outstanding debt"),  v:fmt(totalPendiente),     sub:t("capital + interest"),    accent:C.brandPrimary },
          { l:t("This month's payment"),   v:fmt(cuotaMesActual),     sub:t("balance impact"),        accent:C.warn     },
          { l:t("Paid principal"),   v:fmt(totalCapitalPagado), sub:`${pctGlobal}% ${t("of")}`, accent:C.sage     },
          { l:t("Active debts"),   v:totalActivas,            sub:`${deudasTarjeta.length} ${t("Credit card installments")} · ${deudasExternas.length} ${t("External debt")}`, accent:C.brandPrimary },
        ].map(k => (
          <div key={k.l} style={{ background:C.superficie, borderRadius:12, padding:"13px 15px", border:`1px solid ${k.accent}33`, boxShadow:"0 1px 4px rgba(17,20,24,0.04)" }}>
            <div style={{ fontSize:10, fontWeight:700, color:k.accent, textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:5 }}>{k.l}</div>
            <div style={{ fontSize:22, fontWeight:700, color:C.txt, fontFamily:"'Playfair Display',serif" }}>{k.v}</div>
            <div style={{ fontSize:10, color:C.txt2, marginTop:3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Barra global */}
      <div style={{ marginBottom:22 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.txt2, marginBottom:6 }}>
          <span>{t("Global repayment progress")}</span>
          <span style={{ fontWeight:700, color:C.brandPrimary }}>{pctGlobal}%</span>
        </div>
        <div style={{ height:8, background:C.brandPrimaryDim, borderRadius:8, overflow:"hidden" }}>
          <div style={{ width:`${pctGlobal}%`, height:"100%", background:`linear-gradient(90deg,${C.brandPrimary},#8A7D99)`, borderRadius:8, transition:"width 0.6s ease" }}/>
        </div>
      </div>

      {deudas.length === 0 && (
        <div style={{ textAlign:"center", padding:"32px 0", fontSize:14, color:C.txt2 }}>{t("No debts registered")} 🎉</div>
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
          const isCardDebt = isLinkedCardInstallmentDebt(d);
          const sourceColor = isCardDebt ? CARD_DEBT_COLOR : EXTERNAL_DEBT_COLOR;
          const sourceLabel = isCardDebt ? t("Credit card installments") : t("External debt");
          const sourceIcon = isCardDebt ? "bi-credit-card-2-front" : "bi-bank";
          const sourceDetails = isCardDebt
            ? [d.tarjetaNombre || "", d.tarjetaDiaCierre ? `${t("Card closing day")} ${d.tarjetaDiaCierre}` : "", d.compraMes ? `${t("Purchase month")} ${labelMes(d.compraMes)}` : "", d.notas || ""].filter(Boolean)
            : [d.notas || ""].filter(Boolean);
          const capitalPagadoD = d.cuota_actual * d.cuota;
          const capitalTotalD  = d.cuotas_totales * d.cuota;
          const pctCapital     = capitalTotalD > 0 ? Math.round((capitalPagadoD / capitalTotalD) * 100) : 100;

          return (
            <div key={d.id} style={{ background:activa?C.superficie:C.exitoBg, borderRadius:16, border:`1px solid ${activa?color+"33":C.exito+"44"}`, overflow:"hidden", transition:"all 0.2s", boxShadow:"0 1px 4px rgba(17,20,24,0.04)" }}>

              {/* Cabecera */}
              <div onClick={() => setExpandida(isOpen ? null : d.id)}
                style={{ padding:isMobile?"14px 12px":"16px 18px", cursor:"pointer", display:"flex", alignItems:isMobile?"stretch":"center", gap:isMobile?10:14, flexDirection:isMobile?"column":"row" }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:activa?color:C.exito, flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <span style={{ fontSize:14, fontWeight:700, color:C.txt }}>{d.nombre}</span>
                    <span style={{ fontSize:9, padding:"2px 7px", borderRadius:10, background:`${sourceColor}16`, color:sourceColor, fontWeight:800, border:`1px solid ${sourceColor}33`, textTransform:"uppercase", letterSpacing:"0.04em" }}>
                      <i className={`bi ${sourceIcon}`} aria-hidden="true" /> {sourceLabel}
                    </span>
                    {!activa && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:"rgba(117,223,144,0.15)", color:C.exito, fontWeight:700, border:`1px solid ${C.exito}44` }}>✓ {t("Paid off")}</span>}
                  </div>
                  {sourceDetails.length > 0 && <div style={{ fontSize:11, color:C.txt2, marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{sourceDetails.join(" · ")}</div>}
                </div>

                {/* Barra progreso compacta */}
                <div style={{ width:isMobile?"100%":120, flexShrink:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:C.txt2, marginBottom:4 }}>
                    <span>{c.pagadas}/{d.cuotas_totales}</span>
                    <span style={{ color:activa?color:C.exito, fontWeight:700 }}>{c.pct}%</span>
                  </div>
                  <div style={{ height:5, background:C.brandPrimaryFixed, borderRadius:5, overflow:"hidden" }}>
                    <div style={{ width:`${c.pct}%`, height:"100%", background:activa?`linear-gradient(90deg,${color},${color}99)`:`linear-gradient(90deg,${C.sage},${C.exito})`, borderRadius:5, transition:"width 0.5s" }}/>
                  </div>
                </div>

                <div style={{ textAlign:isMobile?"left":"right", flexShrink:0 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:activa?color:C.exito, fontFamily:"'Playfair Display',serif" }}>{fmt(d.cuota + d.interes_mensual)}</div>
                  <div style={{ fontSize:10, color:C.txt2 }}>{t("/month")}</div>
                </div>

                <div style={{ textAlign:isMobile?"left":"center", flexShrink:0, width:isMobile?"auto":72 }}>
                  {activa ? (
                    <>
                      <div style={{ fontSize:13, fontWeight:700, color:cd?.meses<=3?C.sageDark:cd?.meses<=12?C.warn:C.txt }}>{cd?.label}</div>
                      <div style={{ fontSize:9, color:C.txt2 }}>{t("to free")}</div>
                    </>
                  ) : <div style={{ fontSize:18 }}>🎉</div>}
                </div>

                <div style={{ fontSize:12, color:C.txt2, flexShrink:0, transition:"transform 0.2s", transform:isOpen?"rotate(180deg)":"rotate(0deg)" }}>▼</div>
              </div>

              {/* Panel expandido */}
              {isOpen && (
                <div style={{ padding:"0 18px 18px", borderTop:`1px solid ${C.borde}`, paddingTop:16, display:"grid", gap:16 }}>
                  <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:14 }}>

                    {/* Donut capital */}
                    <div style={{ background:C.superficie, borderRadius:12, padding:"14px 16px", border:`1px solid ${C.borde}`, display:"flex", alignItems:"center", gap:16, overflowX:"auto" }}>
                      {(() => {
                        const r = 36, cx = 44, cy = 44, stroke = 7;
                        const circ       = 2 * Math.PI * r;
                        const paid       = circ * (pctCapital / 100);
                        const interestPaid = d.cuota_actual * d.interes_mensual;
                        const interestTotal = d.cuotas_totales * d.interes_mensual;
                        return (
                          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                            <svg width={88} height={88} viewBox="0 0 88 88">
                              <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.brandPrimaryDim} strokeWidth={stroke}/>
                              <circle cx={cx} cy={cy} r={r} fill="none" stroke={activa?color:C.exito} strokeWidth={stroke} strokeDasharray={`${paid} ${circ-paid}`} strokeDashoffset={circ*0.25} strokeLinecap="round" style={{ transition:"stroke-dasharray 0.6s ease" }}/>
                              <circle cx={cx} cy={cy} r={r} fill="none" stroke={color+"33"} strokeWidth={stroke} strokeDasharray={`${circ-paid} ${paid}`} strokeDashoffset={circ*0.25-paid}/>
                              <text x={cx} y={cy-5}  textAnchor="middle" fontSize={13} fontWeight={700} fill={C.txt} fontFamily="'Playfair Display',serif">{pctCapital}%</text>
                              <text x={cx} y={cy+10} textAnchor="middle" fontSize={8}  fill={C.txt2} fontFamily="'Lato',sans-serif">pagado</text>
                            </svg>
                            <div style={{ display:"grid", gap:6 }}>
                              <div>
                                <div style={{ fontSize:10, color:C.txt2, marginBottom:2 }}>{t("Paid principal")}</div>
                                <div style={{ fontSize:13, fontWeight:700, color:activa?color:C.exito }}>{fmt(capitalPagadoD)}</div>
                              </div>
                              <div>
                                <div style={{ fontSize:10, color:C.txt2, marginBottom:2 }}>{t("Outstanding principal")}</div>
                                <div style={{ fontSize:13, fontWeight:700, color:C.txt }}>{fmt(c.pendiente_capital)}</div>
                              </div>
                              {d.interes_mensual > 0 && (
                                <div>
                                  <div style={{ fontSize:10, color:C.txt2, marginBottom:2 }}>{t("Paid interest")}</div>
                                  <div style={{ fontSize:13, fontWeight:700, color:C.warn }}>{fmt(interestPaid)} <span style={{ fontSize:10, fontWeight:400, color:C.txt2 }}>{t("of")} {fmt(interestTotal)}</span></div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Datos clave */}
                    <div style={{ background:C.superficie, borderRadius:12, padding:"14px 16px", border:`1px solid ${C.borde}`, display:"grid", gap:10 }}>
                      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:8 }}>
                        {[
                          { l:t("Monthly payment (€)"),  v:fmt(d.cuota),                      c:C.txt },
                          { l:t("Monthly interest / fee (€)"),    v:d.interes_mensual>0?fmt(d.interes_mensual):"—", c:d.interes_mensual>0?C.warn:C.txt2 },
                          { l:t("Total impact"),  v:fmt(d.cuota+d.interes_mensual),    c:color   },
                          { l:t("Paid payments"), v:`${c.pagadas} / ${d.cuotas_totales}`, c:C.txt },
                          { l:t("Debt source"), v:sourceLabel, c:sourceColor },
                        ].map(x => (
                          <div key={x.l} style={{ background:C.fondo, borderRadius:9, padding:"8px 10px", border:`1px solid ${C.borde}` }}>
                            <div style={{ fontSize:9, color:C.txt2, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.5px" }}>{x.l}</div>
                            <div style={{ fontSize:13, fontWeight:700, color:x.c }}>{x.v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background:activa?`${color}18`:"rgba(117,223,144,0.1)", borderRadius:10, padding:"10px 12px", border:`1px solid ${activa?color+"33":C.exito+"33"}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <div style={{ fontSize:10, color:C.txt2, marginBottom:2 }}>{t("final payment")}</div>
                          <div style={{ fontSize:14, fontWeight:700, color:activa?color:C.exito }}>{labelMes(c.mes_fin_real)}</div>
                        </div>
                        {activa && cd && (
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontSize:18, fontWeight:700, color:cd.meses<=3?C.sageDark:cd.meses<=12?C.warn:C.txt, fontFamily:"'Playfair Display',serif" }}>{cd.label}</div>
                            <div style={{ fontSize:9, color:C.txt2 }}>{t("to free")}</div>
                          </div>
                        )}
                        {!activa && <div style={{ fontSize:22 }}>🎉</div>}
                      </div>
                      <button onClick={() => onEditar(d)}
                        style={{ background:C.fondo, color:C.brandPrimary, border:`1px solid ${C.brandPrimaryDim}`, borderRadius:9, padding:"7px 0", fontSize:12, cursor:"pointer", fontFamily:"'Lato',sans-serif", fontWeight:700 }}>
                        <i className="bi bi-pencil" aria-hidden="true" /> {t("Edit debt")}
                      </button>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div style={{ background:C.superficie, borderRadius:12, padding:"14px 16px", border:`1px solid ${C.borde}` }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:10 }}>
                      Timeline · {d.cuotas_totales} {t("Payments")} {t("From").toLowerCase()} {labelMes(d.mes_inicio)}
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                      {timeline.map(item => (
                        <div key={item.i}
                          title={`${labelMes(item.mesPref)} · ${item.pagado?t("Paid"):item.esActual?t("This month!"):t("Pending")}`}
                          style={{ width:20, height:20, borderRadius:5, background:item.pagado?(activa?color:C.exito):item.esActual?C.warn:C.brandPrimaryFixed, border:item.esActual?`2px solid ${C.warn}`:`2px solid ${C.brandPrimaryDim}`, flexShrink:0, position:"relative", cursor:"default" }}>
                          {item.esActual && (
                            <div style={{ position:"absolute", top:-1, right:-1, width:6, height:6, borderRadius:"50%", background:C.warn, border:`1px solid ${C.superficie}` }}/>
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:14, marginTop:10, fontSize:10, color:C.txt2 }}>
                      {[
                        { bg:activa?color:C.exito, label:t("Paid") },
                        { bg:C.warn,               label:t("This month!") },
                        { bg:C.brandPrimaryFixed, label:t("Pending"), border:`1px solid ${C.brandPrimaryDim}` },
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
