import { useState } from "react";
import { calculateLeverCalendarFit, leverCalendarUnit } from "@sofi-marqui/domain";
import Modal from "../../../components/Modal.tsx";
import { SUBCAT_VAR } from "../../../constants/categorias.ts";
import { C, inputS, labelS } from "../../../constants/colores.ts";
import { fmt, labelMes } from "../../../utils/format.ts";
import { useI18n } from "../../../i18n.tsx";

const CALENDAR_LEVER_TYPES = new Set(["habitacion", "coche"]);

export default function ModalPalanca({ palanca, defaults = {}, eventos = [], bloqueos = [], viajes = [], onSave, onDelete, onClose }) {
  const { t } = useI18n();
  const año = new Date().getFullYear();
  const [form, setForm] = useState(palanca ? { ...palanca } : {
    nombre: "", subcategoria: "habitacion", importe: "",
    mes: `${año}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    activa: false, calendarioVinculado: false, fechaInicio: "", fechaFin: "", precioUnidad: "", unidadCalendario: "", notas: "",
    ...defaults,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setSubcategoria = (key) => setForm(f => ({
    ...f,
    subcategoria:key,
    calendarioVinculado:CALENDAR_LEVER_TYPES.has(key) ? f.calendarioVinculado : false,
    unidadCalendario:CALENDAR_LEVER_TYPES.has(key) ? "dia" : "",
  }));
  const sub = SUBCAT_VAR[form.subcategoria];
  const calendarCapable = CALENDAR_LEVER_TYPES.has(form.subcategoria);
  const calendarLinked = Boolean(form.calendarioVinculado && calendarCapable);
  const calendarDraft = {
    ...form,
    calendarioVinculado:calendarLinked,
    fechaFin:form.fechaFin || form.fechaInicio,
    unidadCalendario:form.unidadCalendario || leverCalendarUnit(form),
  };
  const calendarFit = calculateLeverCalendarFit(calendarDraft, { events:eventos, blocks:bloqueos, trips:viajes });
  const shownAmount = calendarLinked && calendarFit.importeEstimado > 0 ? calendarFit.importeEstimado : (+form.importe || 0);
  const unitLabel = "día";
  const saveLever = () => {
    const linked = Boolean(form.calendarioVinculado && CALENDAR_LEVER_TYPES.has(form.subcategoria));
    const fit = calculateLeverCalendarFit({ ...form, calendarioVinculado:linked, fechaFin:form.fechaFin || form.fechaInicio }, { events:eventos, blocks:bloqueos, trips:viajes });
    const estimatedAmount = linked && fit.importeEstimado > 0 ? fit.importeEstimado : 0;

    onSave({
      ...form,
      id:palanca?.id || Date.now(),
      calendarioVinculado:linked,
      fechaInicio:linked ? form.fechaInicio || "" : "",
      fechaFin:linked ? form.fechaFin || form.fechaInicio || "" : "",
      precioUnidad:linked ? +form.precioUnidad || 0 : 0,
      unidadCalendario:linked ? leverCalendarUnit(form) : "",
      mes:linked && form.fechaInicio ? form.fechaInicio.slice(0, 7) : form.mes,
      importe:estimatedAmount || +form.importe || 0,
    });
  };

  return (
    <Modal onClose={onClose} maxW={420}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ fontSize:18, fontWeight:700, color:C.txt }}>
          {palanca ? t("Edit lever") : `✨ ${t("New lever")}`}
        </h3>
        <button onClick={onClose} style={{ border:"none", background:C.fondo, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:15, color:C.txt2 }}>✕</button>
      </div>

      <div style={{ display:"grid", gap:14 }}>
        {/* Subcategoría */}
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Subcategory")}</label>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {Object.entries(SUBCAT_VAR).map(([k, v]) => (
              <button key={k} onClick={() => setSubcategoria(k)}
                style={{ padding:"6px 14px", borderRadius:20, fontSize:12, border:"none", cursor:"pointer", fontFamily:"'Lato',sans-serif", fontWeight:600, transition:"all 0.15s", background:form.subcategoria===k?v.color:v.bg, color:form.subcategoria===k?"white":v.color }}>
                {v.emoji} {t(v.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Name")}</label>
          <input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder={t("Example lever")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        {/* Importe + Mes */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Estimated amount (€)")}</label>
            <input type="number" min="0" value={shownAmount || ""} onChange={e => set("importe", +e.target.value)} placeholder="0" disabled={calendarLinked && calendarFit.importeEstimado > 0} style={{ ...inputS, background:calendarLinked && calendarFit.importeEstimado > 0 ? C.superficie : C.fondo, border:`1px solid ${C.borde}`, opacity:calendarLinked && calendarFit.importeEstimado > 0 ? 0.82 : 1 }}/>
          </div>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Month")}</label>
            <input type="month" value={form.mes} onChange={e => set("mes", e.target.value)} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
        </div>

        {calendarCapable && (
          <div style={{ display:"grid", gap:10, padding:12, borderRadius:12, background:calendarLinked ? C.sageLight : C.fondo, border:`1px solid ${calendarLinked ? C.sage + "55" : C.borde}` }}>
            <button onClick={() => set("calendarioVinculado", !calendarLinked)}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, width:"100%", border:"none", background:"transparent", padding:0, cursor:"pointer", fontFamily:"'Lato',sans-serif", color:C.txt }}>
              <span style={{ display:"grid", gap:2, textAlign:"left", minWidth:0 }}>
                <span style={{ fontSize:12, fontWeight:800, color:C.sageDark }}>Vincular con calendario</span>
                <span style={{ fontSize:11, color:C.txt2 }}>Disponibilidad, bloqueos y viajes ajustan el potencial.</span>
              </span>
              <span style={{ width:34, height:20, borderRadius:999, background:calendarLinked ? C.sage : C.borde, padding:2, boxSizing:"border-box", flexShrink:0 }}>
                <span style={{ display:"block", width:16, height:16, borderRadius:"50%", background:"white", transform:calendarLinked ? "translateX(14px)" : "translateX(0)", transition:"transform 0.15s" }}/>
              </span>
            </button>

            {calendarLinked && (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <div>
                    <label style={{ ...labelS, color:C.txt2 }}>{t("From")}</label>
                    <input type="date" value={form.fechaInicio || ""} onChange={e => setForm(f => ({ ...f, fechaInicio:e.target.value, mes:e.target.value ? e.target.value.slice(0, 7) : f.mes }))} style={{ ...inputS, background:C.superficie, border:`1px solid ${C.borde}` }}/>
                  </div>
                  <div>
                    <label style={{ ...labelS, color:C.txt2 }}>{t("To")}</label>
                    <input type="date" value={form.fechaFin || form.fechaInicio || ""} onChange={e => set("fechaFin", e.target.value)} style={{ ...inputS, background:C.superficie, border:`1px solid ${C.borde}` }}/>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <div>
                    <label style={{ ...labelS, color:C.txt2 }}>Precio por {unitLabel}</label>
                    <input type="number" min="0" value={form.precioUnidad || ""} onChange={e => set("precioUnidad", +e.target.value)} placeholder="0" style={{ ...inputS, background:C.superficie, border:`1px solid ${C.borde}` }}/>
                  </div>
                  <div>
                    <label style={{ ...labelS, color:C.txt2 }}>{t("Days")}</label>
                    <input value={calendarFit.unidades || ""} disabled style={{ ...inputS, background:C.superficie, border:`1px solid ${C.borde}`, opacity:0.82 }}/>
                  </div>
                </div>
                <div style={{ display:"grid", gap:6, background:calendarFit.disponible ? C.exitoBg : C.warnBg, borderRadius:10, border:`1px solid ${calendarFit.disponible ? C.exito + "44" : C.warn + "44"}`, padding:"9px 11px", color:calendarFit.disponible ? C.sageDark : C.warn, fontSize:12, fontWeight:700 }}>
                  <span>
                    {!form.fechaInicio
                      ? "Definir fechas para validar disponibilidad"
                      : calendarFit.conflictos.length > 0
                        ? `${calendarFit.conflictos.length} conflicto${calendarFit.conflictos.length === 1 ? "" : "s"} en calendario`
                        : `Ventana libre · ${calendarFit.unidades} ${unitLabel}${calendarFit.unidades === 1 ? "" : "s"} · ${fmt(calendarFit.importeEstimado || 0)}`}
                  </span>
                  {calendarFit.conflictos.slice(0, 3).map((conflict, index) => (
                    <span key={`${conflict.tipo}-${index}`} style={{ color:C.txt2, fontWeight:600, lineHeight:1.25 }}>
                      {conflict.tipo}: {conflict.titulo} · {conflict.inicio}{conflict.fin && conflict.fin !== conflict.inicio ? ` a ${conflict.fin}` : ""}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Notas */}
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Notes")}</label>
          <input value={form.notas || ""} onChange={e => set("notas", e.target.value)} placeholder={t("Context or conditions...")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        {/* Info */}
        <div style={{ background:C.sageLight, borderRadius:10, padding:"10px 14px", fontSize:12, color:C.sageDark, border:`1px solid ${C.sage}44` }}>
          💡 {t("When this lever is active, {amount} is added to variable income for {month}", { amount: fmt(shownAmount || 0), month: labelMes(calendarLinked && form.fechaInicio ? form.fechaInicio.slice(0, 7) : form.mes) })}
          {calendarLinked && calendarFit.conflictos.length > 0 && <div style={{ marginTop:4, color:C.warn }}>No suma al potencial hasta resolver la disponibilidad.</div>}
        </div>

        {/* Acciones */}
        <div style={{ display:"flex", gap:8 }}>
          <button
            onClick={saveLever}
            style={{ flex:1, background:C.cyan, color:"white", border:"none", borderRadius:12, padding:11, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
            {t("Save lever")}
          </button>
          {palanca && (
            <button onClick={() => onDelete(palanca.id)}
              style={{ background:C.errorBg, color:C.error, border:`1px solid ${C.error}44`, borderRadius:12, padding:"11px 16px", fontSize:13, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              {t("Delete")}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
