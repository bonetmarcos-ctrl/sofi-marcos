import { useState } from "react";
import Modal from "../../components/Modal.tsx";
import { ESTADOS, PRIORIDADES, PROYECTO_CATEGORIAS, projectCategoryId, projectCategoryMeta } from "../../constants/habitaciones.ts";
import { C, inputS, labelS } from "../../constants/colores.ts";
import { FUNDING_SOURCES, estimateCreditCardFirstChargeMonth } from "@sofi-marqui/domain";
import { fmt, fmtd, labelMes } from "../../utils/format.ts";
import { addMeses, todayISO } from "../../utils/dates.ts";
import { PAYMENT_METHOD_OPTIONS, paymentMethodLabelKey } from "../../utils/paymentMethods.ts";
import { useI18n } from "../../i18n.tsx";

const defaultProjectForm = {
  habitacion:"general",
  categoria:"general",
  titulo:"",
  descripcion:"",
  objetivo:"",
  siguientePaso:"",
  decisionPendiente:"",
  prioridad:"media",
  estado:"pendiente",
  inicio:todayISO,
  fin:todayISO,
  presupuesto:"",
  gasto:"",
  origenFondos:FUNDING_SOURCES.MONTH_INCOME,
  cuotasTarjeta:1,
  mesPrimerCargo:"",
  tarjetaNombre:"",
  tarjetaDiaCierre:"",
  notas:"",
};

const createProjectForm = (proyecto) => {
  if (!proyecto) return defaultProjectForm;
  const categoria = projectCategoryId(proyecto);
  return {
    ...defaultProjectForm,
    ...proyecto,
    categoria,
    habitacion:categoria,
    objetivo:proyecto.objetivo || "",
    siguientePaso:proyecto.siguientePaso || "",
    decisionPendiente:proyecto.decisionPendiente || "",
  };
};

export default function ModalProyecto({ proyecto, onSave, onDelete, onClose }) {
  const { t } = useI18n();
  const [form, setForm] = useState(() => createProjectForm(proyecto));
  const set = (key, value) => setForm(current => ({ ...current, [key]:value }));

  const categoria = projectCategoryMeta(form);
  const categoriaId = projectCategoryId(form);
  const est = ESTADOS[form.estado] || ESTADOS.pendiente;
  const pct = Number(form.presupuesto || 0) > 0 ? Math.min(100, ((Number(form.gasto) || 0) / Number(form.presupuesto || 0)) * 100) : 0;
  const origenFondos = form.origenFondos || FUNDING_SOURCES.MONTH_INCOME;
  const fechaCompra = form.fin || form.inicio || todayISO;
  const mesCompra = fechaCompra.slice(0, 7);
  const mesCargo = form.mesPrimerCargo || estimateCreditCardFirstChargeMonth({ ...form, fecha:fechaCompra, mes:mesCompra }) || addMeses(mesCompra, 1);
  const cuotasTarjeta = Math.max(1, Number(form.cuotasTarjeta || 1));
  const cuotaTarjeta = Number(form.gasto || 0) / cuotasTarjeta;
  const opcionesFondos = PAYMENT_METHOD_OPTIONS.map(option => ({ ...option, label:t(option.labelKey), detail:t(option.detailKey) }));

  const setCategoria = (value) => setForm(current => ({ ...current, categoria:value, habitacion:value }));

  const setOrigenFondos = (value) => setForm(current => ({
    ...current,
    origenFondos:value,
    cuotasTarjeta:value === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? Math.max(2, Number(current.cuotasTarjeta || 2)) : 1,
    mesPrimerCargo:value === FUNDING_SOURCES.MONTH_INCOME ? "" : (current.mesPrimerCargo || estimateCreditCardFirstChargeMonth({ ...current, fecha:current.fin || current.inicio || todayISO, mes:(current.fin || current.inicio || todayISO).slice(0, 7) }) || addMeses((current.fin || current.inicio || todayISO).slice(0, 7), 1)),
  }));

  const guardarProyecto = () => {
    onSave({
      ...form,
      id:proyecto?.id || Date.now(),
      categoria:categoriaId,
      habitacion:categoriaId,
      presupuesto:Number(form.presupuesto) || 0,
      gasto:Number(form.gasto) || 0,
      objetivo:form.objetivo || "",
      siguientePaso:form.siguientePaso || "",
      decisionPendiente:form.decisionPendiente || "",
      origenFondos,
      cuotasTarjeta:origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? cuotasTarjeta : 1,
      mesPrimerCargo:origenFondos === FUNDING_SOURCES.MONTH_INCOME ? "" : mesCargo,
      tarjetaNombre:origenFondos === FUNDING_SOURCES.MONTH_INCOME ? "" : (form.tarjetaNombre || ""),
      tarjetaDiaCierre:origenFondos === FUNDING_SOURCES.MONTH_INCOME || !form.tarjetaDiaCierre ? undefined : Number(form.tarjetaDiaCierre),
    });
  };

  return (
    <Modal onClose={onClose} maxW={620}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
          <span style={{ width:34, height:34, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", background:categoria.bg, color:categoria.color, border:`1px solid ${categoria.color}33`, flexShrink:0 }}>{categoria.emoji}</span>
          <h3 style={{ fontSize:18, fontWeight:800, color:C.txt, margin:0 }}>{proyecto ? t("Edit project") : t("New project")}</h3>
        </div>
        <button onClick={onClose} style={{ border:"none", background:C.fondo, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:15, color:C.txt2 }}>x</button>
      </div>

      <div style={{ display:"grid", gap:14 }}>
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Project type")}</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {PROYECTO_CATEGORIAS.map(option => (
              <button key={option.id} onClick={() => setCategoria(option.id)}
                style={{ padding:"6px 11px", borderRadius:999, fontSize:12, border:`1px solid ${categoriaId === option.id ? option.color : C.borde}`, cursor:"pointer", fontFamily:"'Lato',sans-serif", fontWeight:800, transition:"all 0.15s", background:categoriaId === option.id ? option.bg : C.fondo, color:categoriaId === option.id ? option.color : C.txt2 }}>
                {option.emoji} {t(option.label)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Title")}</label>
          <input value={form.titulo} onChange={event => set("titulo", event.target.value)} placeholder={t("Example project")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Description")}</label>
          <input value={form.descripcion || ""} onChange={event => set("descripcion", event.target.value)} placeholder={t("Details...")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        <section style={{ display:"grid", gap:10, background:C.fondo, border:`1px solid ${C.borde}`, borderRadius:12, padding:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, color:C.txt, fontSize:13, fontWeight:900 }}>
            <i className="bi bi-question-circle" style={{ color:categoria.color }} aria-hidden="true"/> {t("Planning questions")}
          </div>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("What outcome should this project create?")}</label>
            <textarea value={form.objetivo || ""} onChange={event => set("objetivo", event.target.value)} placeholder={t("Desired outcome...")} rows={2} style={{ ...inputS, minHeight:58, resize:"vertical" }}/>
          </div>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("What is the next concrete step?")}</label>
            <textarea value={form.siguientePaso || ""} onChange={event => set("siguientePaso", event.target.value)} placeholder={t("Next concrete step...")} rows={2} style={{ ...inputS, minHeight:58, resize:"vertical" }}/>
          </div>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("What decision or risk needs attention?")}</label>
            <textarea value={form.decisionPendiente || ""} onChange={event => set("decisionPendiente", event.target.value)} placeholder={t("Decision, risk, limit...")} rows={2} style={{ ...inputS, minHeight:58, resize:"vertical" }}/>
          </div>
        </section>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Priority")}</label>
            <div style={{ display:"flex", gap:5 }}>
              {Object.entries(PRIORIDADES).map(([key, value]) => (
                <button key={key} onClick={() => set("prioridad", key)}
                  style={{ flex:1, padding:"7px 4px", borderRadius:9, fontSize:11, border:"none", cursor:"pointer", fontFamily:"'Lato',sans-serif", fontWeight:800, background:form.prioridad === key ? value.color : value.bg, color:form.prioridad === key ? "white" : value.color, transition:"all 0.15s" }}>
                  {t(value.label)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Status")}</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {Object.entries(ESTADOS).map(([key, value]) => (
                <button key={key} onClick={() => set("estado", key)}
                  style={{ flex:1, padding:"7px 4px", borderRadius:9, fontSize:10, border:"none", cursor:"pointer", fontFamily:"'Lato',sans-serif", fontWeight:800, background:form.estado === key ? value.color : value.bg, color:form.estado === key ? "white" : value.color, transition:"all 0.15s" }}>
                  {t(value.label)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Start")}</label>
            <input type="date" value={form.inicio || ""} onChange={event => set("inicio", event.target.value)} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("End")}</label>
            <input type="date" value={form.fin || ""} onChange={event => setForm(current => ({ ...current, fin:event.target.value, mesPrimerCargo:(current.origenFondos || FUNDING_SOURCES.MONTH_INCOME) === FUNDING_SOURCES.MONTH_INCOME ? "" : (estimateCreditCardFirstChargeMonth({ ...current, fecha:event.target.value, mes:event.target.value.slice(0, 7) }) || current.mesPrimerCargo) }))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Total budget (€)")}</label>
            <input type="number" min="0" value={form.presupuesto || ""} onChange={event => set("presupuesto", Number(event.target.value))} placeholder="0" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Spent (€)")}</label>
            <input type="number" min="0" value={form.gasto || ""} onChange={event => set("gasto", Number(event.target.value))} placeholder="0" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
        </div>

        {Number(form.presupuesto || 0) > 0 && (
          <div style={{ background:C.fondo, borderRadius:10, padding:"10px 14px", border:`1px solid ${C.borde}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.txt2, marginBottom:6 }}>
              <span>{fmt(Number(form.gasto) || 0)} {t("spent")}</span>
              <span style={{ fontWeight:800, color:(Number(form.gasto) || 0) > Number(form.presupuesto || 0) ? C.error : categoria.color }}>{pct.toFixed(0)}%</span>
            </div>
            <div style={{ height:5, background:C.borde, borderRadius:5, overflow:"hidden" }}>
              <div style={{ width:`${pct}%`, height:"100%", background:(Number(form.gasto) || 0) > Number(form.presupuesto || 0) ? C.error : categoria.color, borderRadius:5, transition:"width 0.4s" }}/>
            </div>
          </div>
        )}

        <div style={{ display:"grid", gap:10 }}>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Payment method")}</label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:6 }}>
              {opcionesFondos.map(option => (
                <button key={option.key} onClick={() => setOrigenFondos(option.key)}
                  style={{ minHeight:48, padding:"6px 7px", borderRadius:10, border:`1px solid ${origenFondos === option.key ? categoria.color : C.borde}`, background:origenFondos === option.key ? `${categoria.color}18` : C.fondo, color:origenFondos === option.key ? categoria.color : C.txt2, fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif", lineHeight:1.15, display:"grid", gap:2, alignContent:"center", minWidth:0 }}>
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
                <input value={form.tarjetaNombre || ""} onChange={event => set("tarjetaNombre", event.target.value)} placeholder={t("Card name")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
              </div>
              <div>
                <label style={{ ...labelS, color:C.txt2 }}>{t("Card closing day")}</label>
                <input type="number" min="1" max="31" step="1" value={form.tarjetaDiaCierre || ""} onChange={event => setForm(current => ({ ...current, tarjetaDiaCierre:event.target.value, mesPrimerCargo:estimateCreditCardFirstChargeMonth({ ...current, fecha:current.fin || current.inicio || todayISO, mes:(current.fin || current.inicio || todayISO).slice(0, 7), tarjetaDiaCierre:event.target.value }) || current.mesPrimerCargo }))} placeholder="25" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
              </div>
              <div>
                <label style={{ ...labelS, color:C.txt2 }}>{origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? t("First debit month") : t("Debit month")}</label>
                <input type="month" value={mesCargo} onChange={event => set("mesPrimerCargo", event.target.value)} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
              </div>
              {origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS && (
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>{t("Installments")}</label>
                  <input type="number" min="1" step="1" value={cuotasTarjeta} onChange={event => set("cuotasTarjeta", Number(event.target.value))} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
                </div>
              )}
            </div>
          )}
          <div style={{ background:C.fondo, borderRadius:10, padding:"9px 12px", border:`1px solid ${C.borde}`, fontSize:12, color:C.txt2 }}>
            {t(paymentMethodLabelKey(origenFondos))} · {origenFondos === FUNDING_SOURCES.MONTH_INCOME ? labelMes(mesCompra) : labelMes(mesCargo)}
            {origenFondos === FUNDING_SOURCES.CREDIT_INSTALLMENTS ? ` · ${cuotasTarjeta} ${t("Installments").toLowerCase()} · ${fmtd(cuotaTarjeta)}/${t("month")}` : ""}
          </div>
        </div>

        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Notes")}</label>
          <input value={form.notas || ""} onChange={event => set("notas", event.target.value)} placeholder={t("Observations...")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        <div style={{ display:"flex", gap:8 }}>
          <button onClick={guardarProyecto}
            style={{ flex:1, background:categoria.color, color:"white", border:"none", borderRadius:12, padding:11, fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
            {proyecto ? t("Save changes") : t("Create project")}
          </button>
          {proyecto && (
            <button onClick={() => { if (window.confirm(t("Delete this project?"))) onDelete(proyecto.id); }}
              style={{ background:C.errorBg, color:C.error, border:`1px solid ${C.error}44`, borderRadius:12, padding:"11px 16px", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              <i className="bi bi-trash" aria-hidden="true"/>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}