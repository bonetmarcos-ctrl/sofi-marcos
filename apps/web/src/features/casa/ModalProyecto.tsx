import { useState } from "react";
import Modal from "../../components/Modal.tsx";
import { HABITACIONES, PRIORIDADES, ESTADOS } from "../../constants/habitaciones.ts";
import { C, inputS, labelS, cardN } from "../../constants/colores.ts";
import { FUNDING_SOURCES, estimateCreditCardFirstChargeMonth } from "@sofi-marqui/domain";
import { fmt, fmtd, labelMes } from "../../utils/format.ts";
import { addMeses, todayISO } from "../../utils/dates.ts";
import { PAYMENT_METHOD_OPTIONS, paymentMethodLabelKey } from "../../utils/paymentMethods.ts";
import { useI18n } from "../../i18n.tsx";

export default function ModalProyecto({ proyecto, onSave, onDelete, onClose }) {
  const { t } = useI18n();
  const [form, setForm] = useState(proyecto ? { ...proyecto } : {
    habitacion: "salon",
    titulo: "",
    descripcion: "",
    prioridad: "media",
    estado: "pendiente",
    inicio: todayISO,
    fin: todayISO,
    presupuesto: "",
    gasto: "",
    origenFondos: FUNDING_SOURCES.MONTH_INCOME,
    cuotasTarjeta: 1,
    mesPrimerCargo: "",
    tarjetaNombre: "",
    tarjetaDiaCierre: "",
    notas: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const hab = HABITACIONES.find(h => h.id === form.habitacion) || HABITACIONES[0];
  const est = ESTADOS[form.estado];
  const pri = PRIORIDADES[form.prioridad];
  const pct = form.presupuesto > 0 ? Math.min(100, ((+form.gasto || 0) / +form.presupuesto) * 100) : 0;
  const origenFondos = form.origenFondos || FUNDING_SOURCES.MONTH_INCOME;
  const fechaCompra = form.fin || form.inicio || todayISO;
  const mesCompra = fechaCompra.slice(0, 7);
  const mesCargo = form.mesPrimerCargo || estimateCreditCardFirstChargeMonth({ ...form, fecha:fechaCompra, mes:mesCompra }) || addMeses(mesCompra, 1);
  const cuotasTarjeta = Math.max(1, Number(form.cuotasTarjeta || 1));
  const cuotaTarjeta = Number(form.gasto || 0) / cuotasTarjeta;
  const opcionesFondos = PAYMENT_METHOD_OPTIONS.map(option => ({ ...option, label:t(option.labelKey), detail:t(option.detailKey) }));

  const setOrigenFondos = (value) => setForm(f => ({
    ...f,
    origenFondos:value,
    cuotasTarjeta:value === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? Math.max(2, Number(f.cuotasTarjeta || 2)) : 1,
    mesPrimerCargo:value === FUNDING_SOURCES.MONTH_INCOME ? "" : (f.mesPrimerCargo || estimateCreditCardFirstChargeMonth({ ...f, fecha:f.fin || f.inicio || todayISO, mes:(f.fin || f.inicio || todayISO).slice(0, 7) }) || addMeses((f.fin || f.inicio || todayISO).slice(0, 7), 1)),
  }));

  const guardarProyecto = () => {
    onSave({
      ...form,
      id:proyecto?.id || Date.now(),
      presupuesto:+form.presupuesto||0,
      gasto:+form.gasto||0,
      origenFondos,
      cuotasTarjeta:origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? cuotasTarjeta : 1,
      mesPrimerCargo:origenFondos === FUNDING_SOURCES.MONTH_INCOME ? "" : mesCargo,
      tarjetaNombre:origenFondos === FUNDING_SOURCES.MONTH_INCOME ? "" : (form.tarjetaNombre || ""),
      tarjetaDiaCierre:origenFondos === FUNDING_SOURCES.MONTH_INCOME || !form.tarjetaDiaCierre ? undefined : Number(form.tarjetaDiaCierre),
    });
  };

  return (
    <Modal onClose={onClose} maxW={520}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ fontSize:18, fontWeight:700, color:C.txt }}>
          {proyecto ? t("Edit task") : t("New task")}
        </h3>
        <button onClick={onClose} style={{ border:"none", background:C.fondo, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:15, color:C.txt2 }}>✕</button>
      </div>

      <div style={{ display:"grid", gap:14 }}>
        {/* Habitación */}
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Room")}</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {HABITACIONES.map(h => (
              <button key={h.id} onClick={() => set("habitacion", h.id)}
                style={{ padding:"5px 11px", borderRadius:20, fontSize:12, border:"none", cursor:"pointer", fontFamily:"'Lato',sans-serif", fontWeight:600, transition:"all 0.15s", background:form.habitacion===h.id?h.color:"#f1f0f7", color:form.habitacion===h.id?"white":"#475569" }}>
                {h.emoji} {t(h.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Título */}
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Title")}</label>
          <input value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder={t("Example task")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        {/* Descripción */}
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Description")}</label>
          <input value={form.descripcion || ""} onChange={e => set("descripcion", e.target.value)} placeholder={t("Details...")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        {/* Prioridad + Estado */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Priority")}</label>
            <div style={{ display:"flex", gap:5 }}>
              {Object.entries(PRIORIDADES).map(([k, v]) => (
                <button key={k} onClick={() => set("prioridad", k)}
                  style={{ flex:1, padding:"6px 4px", borderRadius:9, fontSize:11, border:"none", cursor:"pointer", fontFamily:"'Lato',sans-serif", fontWeight:700, background:form.prioridad===k?v.color:v.bg, color:form.prioridad===k?"white":v.color, transition:"all 0.15s" }}>
                  {t(v.label)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Status")}</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {Object.entries(ESTADOS).map(([k, v]) => (
                <button key={k} onClick={() => set("estado", k)}
                  style={{ flex:1, padding:"6px 4px", borderRadius:9, fontSize:10, border:"none", cursor:"pointer", fontFamily:"'Lato',sans-serif", fontWeight:700, background:form.estado===k?v.color:v.bg, color:form.estado===k?"white":v.color, transition:"all 0.15s" }}>
                  {t(v.label)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fechas */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Start")}</label>
            <input type="date" value={form.inicio || ""} onChange={e => set("inicio", e.target.value)} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("End")}</label>
            <input type="date" value={form.fin || ""} onChange={e => setForm(f => ({ ...f, fin:e.target.value, mesPrimerCargo:(f.origenFondos || FUNDING_SOURCES.MONTH_INCOME) === FUNDING_SOURCES.MONTH_INCOME ? "" : (estimateCreditCardFirstChargeMonth({ ...f, fecha:e.target.value, mes:e.target.value.slice(0, 7) }) || f.mesPrimerCargo) }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
        </div>

        {/* Presupuesto + Gasto */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Total budget (€)")}</label>
            <input type="number" min="0" value={form.presupuesto || ""} onChange={e => set("presupuesto", +e.target.value)} placeholder="0" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Spent (€)")}</label>
            <input type="number" min="0" value={form.gasto || ""} onChange={e => set("gasto", +e.target.value)} placeholder="0" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
        </div>

        {/* Barra presupuesto */}
        {form.presupuesto > 0 && (
          <div style={{ background:C.fondo, borderRadius:10, padding:"10px 14px", border:`1px solid ${C.borde}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.txt2, marginBottom:6 }}>
              <span>{fmt(+form.gasto || 0)} {t("spent")}</span>
              <span style={{ fontWeight:700, color:(+form.gasto||0) > +form.presupuesto ? C.error : hab.color }}>{pct.toFixed(0)}%</span>
            </div>
            <div style={{ height:5, background:C.borde, borderRadius:5, overflow:"hidden" }}>
              <div style={{ width:`${pct}%`, height:"100%", background:(+form.gasto||0) > +form.presupuesto ? C.error : hab.color, borderRadius:5, transition:"width 0.4s" }}/>
            </div>
          </div>
        )}

        <div style={{ display:"grid", gap:10 }}>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Payment method")}</label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:6 }}>
              {opcionesFondos.map(option => (
                <button key={option.key} onClick={() => setOrigenFondos(option.key)}
                  style={{ minHeight:48, padding:"6px 7px", borderRadius:10, border:`1px solid ${origenFondos === option.key ? hab.color : C.borde}`, background:origenFondos === option.key ? hab.color + "18" : C.fondo, color:origenFondos === option.key ? hab.color : C.txt2, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif", lineHeight:1.15, display:"grid", gap:2, alignContent:"center", minWidth:0 }}>
                  <span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{option.icon} {option.label}</span>
                  <span style={{ fontSize:9, fontWeight:600, opacity:0.75, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{option.detail}</span>
                </button>
              ))}
            </div>
          </div>
          {origenFondos !== FUNDING_SOURCES.MONTH_INCOME && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={{ ...labelS, color:C.txt2 }}>{t("Card")}</label>
                <input value={form.tarjetaNombre || ""} onChange={e => set("tarjetaNombre", e.target.value)} placeholder={t("Card name")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
              </div>
              <div>
                <label style={{ ...labelS, color:C.txt2 }}>{t("Card closing day")}</label>
                <input type="number" min="1" max="31" step="1" value={form.tarjetaDiaCierre || ""} onChange={e => setForm(f => ({ ...f, tarjetaDiaCierre:e.target.value, mesPrimerCargo:estimateCreditCardFirstChargeMonth({ ...f, fecha:f.fin || f.inicio || todayISO, mes:(f.fin || f.inicio || todayISO).slice(0, 7), tarjetaDiaCierre:e.target.value }) || f.mesPrimerCargo }))} placeholder="25" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
              </div>
              <div>
                <label style={{ ...labelS, color:C.txt2 }}>{origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? t("First debit month") : t("Debit month")}</label>
                <input type="month" value={mesCargo} onChange={e => set("mesPrimerCargo", e.target.value)} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
              </div>
              {origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS && (
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>{t("Installments")}</label>
                  <input type="number" min="1" step="1" value={cuotasTarjeta} onChange={e => set("cuotasTarjeta", +e.target.value)} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                </div>
              )}
            </div>
          )}
          <div style={{ background:C.fondo, borderRadius:10, padding:"9px 12px", border:`1px solid ${C.borde}`, fontSize:12, color:C.txt2 }}>
            {t(paymentMethodLabelKey(origenFondos))} · {origenFondos === FUNDING_SOURCES.MONTH_INCOME ? labelMes(mesCompra) : labelMes(mesCargo)}
            {origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? ` · ${cuotasTarjeta} ${t("Installments").toLowerCase()} · ${fmtd(cuotaTarjeta)}/${t("month")}` : ""}
          </div>
        </div>

        {/* Notas */}
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Notes")}</label>
          <input value={form.notas || ""} onChange={e => set("notas", e.target.value)} placeholder={t("Observations...")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        {/* Acciones */}
        <div style={{ display:"flex", gap:8 }}>
          <button
            onClick={guardarProyecto}
            style={{ flex:1, background:hab.color, color:"white", border:"none", borderRadius:12, padding:11, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
            {proyecto ? t("Save changes") : t("Create task")}
          </button>
          {proyecto && (
            <button onClick={() => { if (window.confirm(t("Delete this task?"))) onDelete(proyecto.id); }}
              style={{ background:C.errorBg, color:C.error, border:`1px solid ${C.error}44`, borderRadius:12, padding:"11px 16px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              🗑️
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
