import { useState } from "react";
import Modal from "../../../components/Modal.tsx";
import { CATEGORIAS, PERSONAS } from "../../../constants/categorias.ts";
import { C, inputS, labelS } from "../../../constants/colores.ts";
import { FUNDING_SOURCES } from "@sofi-marqui/domain";
import { fmtd } from "../../../utils/format.ts";
import { labelMes } from "../../../utils/format.ts";
import { addMeses, todayISO } from "../../../utils/dates.ts";
import { useI18n } from "../../../i18n.tsx";

export default function ModalEvento({ fechaInicial, evento, defaults = {}, onSave, onDelete, onClose }) {
  const { t } = useI18n();
  const [form, setForm] = useState(evento ? { ...evento } : {
    fecha: fechaInicial || todayISO,
    titulo: "",
    hora: "",
    categoria: "ocio",
    importe: "",
    origenFondos: FUNDING_SOURCES.MONTH_INCOME,
    cuotasTarjeta: 1,
    mesPrimerCargo: "",
    notas: "",
    huespedes: "",
    noches: 1,
    precioPorNoche: 35,
    diasAlquiler: 1,
    ...defaults,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Trips and room/car income are handled by their dedicated calendar actions.
  const CATS_EVENTO = Object.fromEntries(Object.entries(CATEGORIAS).filter(([k]) => !["viaje", "habitacion", "coche"].includes(k)));
  const esIngreso   = CATEGORIAS[form.categoria]?.tipo === "ingreso";
  const esGasto     = CATEGORIAS[form.categoria]?.tipo === "gasto";
  const origenFondos = form.origenFondos || FUNDING_SOURCES.MONTH_INCOME;
  const mesCompra = (form.fecha || todayISO).slice(0, 7);
  const mesCargo = form.mesPrimerCargo || addMeses(mesCompra, 1);
  const cuotasTarjeta = Math.max(1, Number(form.cuotasTarjeta || 1));
  const cuotaTarjeta = Number(form.importe || 0) / cuotasTarjeta;
  const opcionesFondos = [
    { key:FUNDING_SOURCES.MONTH_INCOME, label:t("Monthly income") },
    { key:FUNDING_SOURCES.CREDIT_NEXT_MONTH, label:t("Credit card next month") },
    { key:FUNDING_SOURCES.CREDIT_INSTALLMENTS, label:t("Credit card installments") },
  ];

  const setOrigenFondos = (value) => setForm(f => ({
    ...f,
    origenFondos:value,
    cuotasTarjeta:value === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? Math.max(2, Number(f.cuotasTarjeta || 2)) : 1,
    mesPrimerCargo:value === FUNDING_SOURCES.MONTH_INCOME ? "" : (f.mesPrimerCargo || addMeses((f.fecha || todayISO).slice(0, 7), 1)),
  }));

  const guardarEvento = () => {
    const fuente = esGasto ? origenFondos : FUNDING_SOURCES.MONTH_INCOME;
    onSave({
      ...form,
      id:evento?.id || Date.now(),
      importe:+form.importe || 0,
      origenFondos:fuente,
      cuotasTarjeta:fuente === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? cuotasTarjeta : 1,
      mesPrimerCargo:fuente === FUNDING_SOURCES.MONTH_INCOME ? "" : mesCargo,
    });
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ fontSize:18, fontWeight:700, color:C.txt }}>{evento ? t("Edit event") : t("New event")}</h3>
        <button onClick={onClose} style={{ border:"none", background:C.fondo, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:15, color:C.txt2 }}>✕</button>
      </div>

      <div style={{ display:"grid", gap:14 }}>
        {/* Category type */}
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Type")}</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {Object.entries(CATS_EVENTO).map(([k, v]) => (
              <button key={k} onClick={() => set("categoria", k)}
                style={{ padding:"5px 11px", borderRadius:20, fontSize:12, border:"none", cursor:"pointer", fontFamily:"'Lato',sans-serif", transition:"all 0.15s", background:form.categoria===k?v.color:v.bg, color:form.categoria===k?"white":v.color, fontWeight:form.categoria===k?700:400 }}>
                {v.emoji} {t(v.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Person */}
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Who is it for?")}</label>
          <div style={{ display:"flex", gap:6 }}>
            {Object.entries(PERSONAS).map(([k, v]) => (
              <button key={k} onClick={() => set("persona", k)}
                style={{ flex:1, padding:"7px", borderRadius:10, fontSize:12, border:"none", cursor:"pointer", fontFamily:"'Lato',sans-serif", transition:"all 0.15s", background:form.persona===k?v.color:v.bg, color:form.persona===k?"white":v.color, fontWeight:form.persona===k?700:500 }}>
                {t(v.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Description")}</label>
          <input value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder={t("What is it?")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        {/* Date + time */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Date")}</label>
            <input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Time")}</label>
            <input type="time" value={form.hora || ""} onChange={e => set("hora", e.target.value)} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
        </div>

        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Amount (€)")}</label>
          <input type="number" step="0.01" value={form.importe || ""} onChange={e => set("importe", +e.target.value)} placeholder="0.00" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        {esGasto && (
          <div style={{ display:"grid", gap:10 }}>
            <div>
              <label style={{ ...labelS, color:C.txt2 }}>{t("Funding source")}</label>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:6 }}>
                {opcionesFondos.map(option => (
                  <button key={option.key} onClick={() => setOrigenFondos(option.key)}
                    style={{ minHeight:38, padding:"6px 8px", borderRadius:10, border:`1px solid ${origenFondos === option.key ? C.cyan : C.borde}`, background:origenFondos === option.key ? C.cyanLight : C.fondo, color:origenFondos === option.key ? C.cyan : C.txt2, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif", lineHeight:1.15 }}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {origenFondos !== FUNDING_SOURCES.MONTH_INCOME && (
              <div style={{ display:"grid", gridTemplateColumns:origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? "1fr 1fr" : "1fr", gap:10 }}>
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
          </div>
        )}

        {/* Notes */}
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Notes")}</label>
          <input value={form.notas || ""} onChange={e => set("notas", e.target.value)} placeholder={t("Details...")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        {/* Summary */}
        <div style={{ background:esIngreso?C.exitoBg:C.lavLight, borderRadius:10, padding:"10px 14px", fontSize:12, color:esIngreso?C.sageDark:C.lavender, border:`1px solid ${esIngreso?C.exito+"44":C.lavender+"44"}` }}>
          {esIngreso ? `✅ ${t("Extra income")}` : `✅ ${t("Variable expense")}`} {'->'} {labelMes((form.fecha || todayISO).slice(0, 7))}
          {form.importe > 0 && <strong> · {fmtd(+form.importe)}</strong>}
          {esGasto && origenFondos !== FUNDING_SOURCES.MONTH_INCOME && <div style={{ marginTop:4, color:C.txt2 }}>{t(origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? "Credit card installments" : "Credit card next month")} · {labelMes(mesCargo)}{origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? ` · ${cuotasTarjeta} ${t("Installments").toLowerCase()} · ${fmtd(cuotaTarjeta)}/${t("month")}` : ""}</div>}
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:8 }}>
          <button
            onClick={guardarEvento}
            style={{ flex:1, background:C.cyan, color:"white", border:"none", borderRadius:12, padding:11, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
            {evento ? t("Save changes") : t("Save event")}
          </button>
          {evento && (
            <button onClick={() => { if (window.confirm(t("Delete this event?"))) onDelete(evento.id); }}
              style={{ background:C.errorBg, color:C.error, border:`1px solid ${C.error}44`, borderRadius:12, padding:"11px 16px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              🗑️ {t("Delete")}
            </button>
          )}
        </div>

        {!evento && (
          <div style={{ fontSize:11, color:C.txt2, textAlign:"center", padding:"4px 0", borderTop:`1px solid ${C.borde}`, marginTop:-4 }}>
            {t("Want to add a trip? Use the Add trip button in the main menu.")}
          </div>
        )}
      </div>
    </Modal>
  );
}
