import { useState } from "react";
import Modal from "../../components/Modal.tsx";
import { GASTOS_VIAJE, COLORES_VIAJE, COLOR_VIAJE, BG_VIAJE } from "../../constants/categorias.ts";
import { C, inputS, labelS } from "../../constants/colores.ts";
import { FUNDING_SOURCES, estimateCreditCardFirstChargeMonth } from "@sofi-marqui/domain";
import { fmt, fmtd, labelMes } from "../../utils/format.ts";
import { addMeses, daysBetween, todayISO } from "../../utils/dates.ts";
import { PAYMENT_METHOD_OPTIONS, paymentMethodLabelKey } from "../../utils/paymentMethods.ts";
import { useI18n } from "../../i18n.tsx";

export default function ModalViaje({ viaje, fechaInicial = "", onSave, onDelete, onClose }) {
  const { t } = useI18n();
  const fechaBase = fechaInicial;
  const [form, setForm] = useState(viaje ? { ...viaje, gastos:{ ...viaje.gastos }, gastosPago:{ ...(viaje.gastosPago || {}) } } : {
    nombre: "", inicio: fechaBase, fin: fechaBase, presupuesto: "",
    color: COLORES_VIAJE[0], emoji: "✈️", notas: "",
    gastos: { vuelo:0, hotel:0, transporte:0, restaurante:0, actividades:0, otro:0 },
    gastosPago: {},
  });

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setG = (k, v) => setForm(f => ({ ...f, gastos:{ ...f.gastos, [k]: +v || 0 } }));

  const fechaCompra = form.inicio || form.fin || todayISO;
  const mesCompra = fechaCompra.slice(0, 7);
  const opcionesFondos = PAYMENT_METHOD_OPTIONS.map(option => ({ ...option, label:t(option.labelKey), detail:t(option.detailKey) }));
  const pagoConcepto = (key) => form.gastosPago?.[key] || {};
  const mesCargoConcepto = (key) => {
    const pago = pagoConcepto(key);
    return pago.mesPrimerCargo || estimateCreditCardFirstChargeMonth({ ...pago, fecha:fechaCompra, mes:mesCompra }) || addMeses(mesCompra, 1);
  };
  const setPagoConcepto = (key, patch) => setForm(f => ({
    ...f,
    gastosPago:{ ...f.gastosPago, [key]:{ ...(f.gastosPago?.[key] || {}), ...patch } },
  }));
  const setFechaViaje = (key, value) => setForm(f => {
    const next = { ...f, [key]:value };
    const fecha = next.inicio || next.fin || todayISO;
    const mes = fecha.slice(0, 7);
    const gastosPago = Object.fromEntries(Object.entries(next.gastosPago || {}).map(([conceptKey, pago]) => {
      const payment = pago as any;
      if ((payment.origenFondos || FUNDING_SOURCES.MONTH_INCOME) === FUNDING_SOURCES.MONTH_INCOME) return [conceptKey, payment];
      return [conceptKey, { ...payment, mesPrimerCargo:estimateCreditCardFirstChargeMonth({ ...payment, fecha, mes }) || payment.mesPrimerCargo }];
    }));
    return { ...next, gastosPago };
  });
  const setOrigenConcepto = (key, value) => setForm(f => {
    const previo = f.gastosPago?.[key] || {};
    const fecha = f.inicio || f.fin || todayISO;
    const mes = fecha.slice(0, 7);
    return {
      ...f,
      gastosPago:{
        ...f.gastosPago,
        [key]:{
          ...previo,
          origenFondos:value,
          cuotasTarjeta:value === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? Math.max(2, Number(previo.cuotasTarjeta || 2)) : 1,
          mesPrimerCargo:value === FUNDING_SOURCES.MONTH_INCOME ? "" : (previo.mesPrimerCargo || estimateCreditCardFirstChargeMonth({ ...previo, fecha, mes }) || addMeses(mes, 1)),
        },
      },
    };
  });

  const guardarViaje = () => {
    const gastos = Object.fromEntries(GASTOS_VIAJE.map(g => [g.key, Number(form.gastos?.[g.key] || 0)]));
    const gastosPagoEntries: [string, any][] = GASTOS_VIAJE.flatMap(g => {
        const pago = pagoConcepto(g.key);
        const origenFondos = pago.origenFondos || FUNDING_SOURCES.MONTH_INCOME;
        const item = {
          origenFondos,
          cuotasTarjeta:origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? Math.max(1, Number(pago.cuotasTarjeta || 1)) : 1,
          mesPrimerCargo:origenFondos === FUNDING_SOURCES.MONTH_INCOME ? "" : (pago.mesPrimerCargo || estimateCreditCardFirstChargeMonth({ ...pago, fecha:fechaCompra, mes:mesCompra }) || addMeses(mesCompra, 1)),
          tarjetaNombre:origenFondos === FUNDING_SOURCES.MONTH_INCOME ? "" : (pago.tarjetaNombre || ""),
          tarjetaDiaCierre:origenFondos === FUNDING_SOURCES.MONTH_INCOME || !pago.tarjetaDiaCierre ? undefined : Number(pago.tarjetaDiaCierre),
          deudaTarjetaId:pago.deudaTarjetaId || "",
        };
        return Number(gastos[g.key] || 0) > 0 || item.origenFondos !== FUNDING_SOURCES.MONTH_INCOME ? [[g.key, item]] : [];
      });
    const gastosPago = Object.fromEntries(gastosPagoEntries);

    onSave({ ...form, id:viaje?.id || Date.now(), presupuesto:+form.presupuesto || 0, gastos, gastosPago });
  };

  const total     = Object.values(form.gastos).reduce<number>((a, b) => a + Number(b || 0), 0);
  const noches    = form.inicio && form.fin ? daysBetween(form.inicio, form.fin) : 0;
  const restante  = (+form.presupuesto || 0) - total;

  return (
    <Modal onClose={onClose} maxW={560}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"#1a1a2e" }}>
          {viaje ? t("Edit trip") : `✈️ ${t("New trip")}`}
        </h3>
        <button onClick={onClose} style={{ border:"none", background:C.fondo, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:15, color:C.txt2 }}>✕</button>
      </div>

      <div style={{ display:"grid", gap:14 }}>
        {/* Emoji + Nombre */}
        <div style={{ display:"grid", gridTemplateColumns:"48px 1fr", gap:8 }}>
          <div>
            <label style={labelS}>🏳️</label>
            <input value={form.emoji} onChange={e => set("emoji", e.target.value)} style={{ ...inputS, textAlign:"center", fontSize:22, padding:"6px 4px" }}/>
          </div>
          <div>
            <label style={labelS}>{t("Name")}</label>
            <input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder={t("Rome, Paris...")} style={inputS}/>
          </div>
        </div>

        {/* Fechas */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <label style={labelS}>{t("Departure")}</label>
            <input type="date" value={form.inicio} onChange={e => setFechaViaje("inicio", e.target.value)} style={inputS}/>
          </div>
          <div>
            <label style={labelS}>{t("Return")}</label>
            <input type="date" value={form.fin} onChange={e => setFechaViaje("fin", e.target.value)} style={inputS}/>
          </div>
        </div>
        {noches > 0 && (
          <div style={{ fontSize:12, color:COLOR_VIAJE, marginTop:-8 }}>📅 {noches} {t(noches !== 1 ? "nights" : "night")}</div>
        )}

        {/* Presupuesto */}
        <div>
          <label style={labelS}>{t("Total budget (€)")}</label>
          <input type="number" value={form.presupuesto} onChange={e => set("presupuesto", e.target.value)} placeholder="1000" style={inputS}/>
        </div>

        {/* Color */}
        <div>
          <label style={labelS}>{t("Color")}</label>
          <div style={{ display:"flex", gap:8 }}>
            {COLORES_VIAJE.map(c => (
              <div key={c} onClick={() => set("color", c)}
                style={{ width:28, height:28, borderRadius:"50%", background:c, cursor:"pointer", border:form.color===c?`3px solid ${COLOR_VIAJE}`:"3px solid transparent", transition:"border 0.15s" }}/>
            ))}
          </div>
        </div>

        {/* Desglose gastos */}
        <div style={{ background:BG_VIAJE, borderRadius:14, padding:14, border:`1px solid ${COLOR_VIAJE}33` }}>
          <div style={{ fontSize:12, fontWeight:700, color:COLOR_VIAJE, marginBottom:12, textTransform:"uppercase", letterSpacing:"0.6px" }}>💸 {t("Expense breakdown")}</div>
          <div style={{ display:"grid", gap:10 }}>
            {GASTOS_VIAJE.map(g => {
              const pago = pagoConcepto(g.key);
              const origenFondos = pago.origenFondos || FUNDING_SOURCES.MONTH_INCOME;
              const mesCargo = mesCargoConcepto(g.key);
              const cuotasTarjeta = Math.max(1, Number(pago.cuotasTarjeta || 1));
              const cuota = Number(form.gastos[g.key] || 0) / cuotasTarjeta;
              return (
              <div key={g.key} style={{ background:"white", borderRadius:10, padding:10, border:`1px solid ${COLOR_VIAJE}22`, display:"grid", gap:8, minWidth:0 }}>
                <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) 110px", gap:8, alignItems:"end" }}>
                  <div style={{ minWidth:0 }}>
                    <label style={{ ...labelS, fontSize:10 }}>{g.emoji} {t(g.label)}</label>
                    <div style={{ fontSize:10, color:C.txt2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t(paymentMethodLabelKey(origenFondos))}{origenFondos !== FUNDING_SOURCES.MONTH_INCOME ? ` · ${labelMes(mesCargo)}` : ""}</div>
                  </div>
                  <input type="number" min="0" step="0.01" value={form.gastos[g.key] || ""} onChange={e => setG(g.key, e.target.value)} placeholder="0" style={{ ...inputS, minHeight:34 }}/>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:5 }}>
                  {opcionesFondos.map(option => (
                    <button key={option.key} onClick={() => setOrigenConcepto(g.key, option.key)}
                      style={{ minHeight:36, padding:"5px 6px", borderRadius:9, border:`1px solid ${origenFondos === option.key ? COLOR_VIAJE : C.borde}`, background:origenFondos === option.key ? BG_VIAJE : C.fondo, color:origenFondos === option.key ? COLOR_VIAJE : C.txt2, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif", lineHeight:1.1, minWidth:0 }}>
                      <span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", display:"block" }}>{option.icon} {option.label}</span>
                    </button>
                  ))}
                </div>
                {origenFondos !== FUNDING_SOURCES.MONTH_INCOME && (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:6 }}>
                    <input value={pago.tarjetaNombre || ""} onChange={e => setPagoConcepto(g.key, { tarjetaNombre:e.target.value })} placeholder={t("Card name")} style={{ ...inputS, minHeight:32, fontSize:11 }}/>
                    <input type="number" min="1" max="31" step="1" value={pago.tarjetaDiaCierre || ""} onChange={e => setPagoConcepto(g.key, { tarjetaDiaCierre:e.target.value, mesPrimerCargo:estimateCreditCardFirstChargeMonth({ ...pago, fecha:fechaCompra, mes:mesCompra, tarjetaDiaCierre:e.target.value }) || pago.mesPrimerCargo })} placeholder="25" style={{ ...inputS, minHeight:32, fontSize:11 }}/>
                    <input type="month" value={mesCargo} onChange={e => setPagoConcepto(g.key, { mesPrimerCargo:e.target.value })} style={{ ...inputS, minHeight:32, fontSize:11 }}/>
                    {origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS && (
                      <input type="number" min="1" step="1" value={cuotasTarjeta} onChange={e => setPagoConcepto(g.key, { cuotasTarjeta:+e.target.value })} style={{ ...inputS, minHeight:32, fontSize:11 }}/>
                    )}
                  </div>
                )}
                {origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS && Number(form.gastos[g.key] || 0) > 0 && <div style={{ fontSize:10, color:COLOR_VIAJE }}>{cuotasTarjeta} {t("Installments").toLowerCase()} · {fmtd(cuota)}/{t("month")}</div>}
              </div>
              );
            })}
          </div>

          {/* Totales */}
          <div style={{ marginTop:12, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <div style={{ background:"white", borderRadius:8, padding:"8px 12px", textAlign:"center" }}>
              <div style={{ fontSize:10, color:COLOR_VIAJE, textTransform:"uppercase" }}>{t("Total")}</div>
              <div style={{ fontSize:18, fontWeight:700, color:COLOR_VIAJE, fontFamily:"'Playfair Display',serif" }}>{fmt(total)}</div>
            </div>
            <div style={{ background:restante>=0?"#f0fdf4":"#fff1f2", borderRadius:8, padding:"8px 12px", textAlign:"center" }}>
              <div style={{ fontSize:10, color:restante>=0?"#059669":"#be123c", textTransform:"uppercase" }}>{restante>=0?t("Remaining"):t("Exceeded")}</div>
              <div style={{ fontSize:18, fontWeight:700, color:restante>=0?"#065f46":"#9f1239", fontFamily:"'Playfair Display',serif" }}>{fmt(Math.abs(restante))}</div>
            </div>
          </div>

          {/* Barra progreso */}
          {form.presupuesto > 0 && (
            <div style={{ marginTop:10 }}>
              <div style={{ height:6, background:C.borde, borderRadius:6, overflow:"hidden" }}>
                <div style={{ width:`${Math.min(100, (total / (+form.presupuesto)) * 100)}%`, height:"100%", background:restante>=0?COLOR_VIAJE:"#be123c", borderRadius:6, transition:"width 0.4s" }}/>
              </div>
              <div style={{ fontSize:10, color:"#94a3b8", marginTop:4 }}>{((total / (+form.presupuesto || 1)) * 100).toFixed(0)}% {t("of budget")}</div>
            </div>
          )}
        </div>

        {/* Notas */}
        <div>
          <label style={labelS}>{t("Notes")}</label>
          <input value={form.notas || ""} onChange={e => set("notas", e.target.value)} placeholder={t("Details...")} style={inputS}/>
        </div>

        {/* Acciones */}
        <div style={{ display:"flex", gap:8 }}>
          <button
            onClick={guardarViaje}
            style={{ flex:1, background:COLOR_VIAJE, color:"white", border:"none", borderRadius:12, padding:11, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
            {t("Save trip")}
          </button>
          {viaje && (
            <button onClick={() => onDelete(viaje.id)}
              style={{ background:C.errorBg, color:C.error, border:`1px solid ${C.error}44`, borderRadius:12, padding:"11px 16px", fontSize:13, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              {t("Delete")}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
