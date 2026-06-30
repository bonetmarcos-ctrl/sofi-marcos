import { useState } from "react";
import { FUNDING_SOURCES } from "@sofi-marqui/domain";
import Modal from "../../../components/Modal.tsx";
import { C, inputS, labelS } from "../../../constants/colores.ts";
import { fmt } from "../../../utils/format.ts";
import { labelMes, } from "../../../utils/format.ts";
import { todayISO } from "../../../utils/dates.ts";
import { calcDeuda } from "../../../utils/calcDeuda.ts";
import { useI18n } from "../../../i18n.tsx";

const EXTERNAL_DEBT_SOURCE = "deuda_externa";

export default function ModalDeuda({ deuda, onSave, onDelete, onClose }) {
  const { t } = useI18n();
  const initialSource = deuda?.origen === FUNDING_SOURCES.CREDIT_INSTALLMENTS || deuda?.tipo === FUNDING_SOURCES.CREDIT_INSTALLMENTS || deuda?.origenColeccion
    ? FUNDING_SOURCES.CREDIT_INSTALLMENTS
    : EXTERNAL_DEBT_SOURCE;
  const [form, setForm] = useState(deuda ? { ...deuda, origen:initialSource } : {
    nombre: "", tipo: "cuotas", cuota: "", interes_mensual: 0,
    cuotas_totales: "", cuota_actual: 0, mes_inicio: todayISO.slice(0, 7), notas: "", origen:EXTERNAL_DEBT_SOURCE,
  });
  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const source = form.origen === FUNDING_SOURCES.CREDIT_INSTALLMENTS || form.tipo === FUNDING_SOURCES.CREDIT_INSTALLMENTS || form.origenColeccion
    ? FUNDING_SOURCES.CREDIT_INSTALLMENTS
    : EXTERNAL_DEBT_SOURCE;
  const isCardDebt = source === FUNDING_SOURCES.CREDIT_INSTALLMENTS;
  const setSource = (nextSource) => setForm(f => nextSource === FUNDING_SOURCES.CREDIT_INSTALLMENTS
    ? { ...f, origen:FUNDING_SOURCES.CREDIT_INSTALLMENTS, tipo:FUNDING_SOURCES.CREDIT_INSTALLMENTS }
    : { ...f, origen:EXTERNAL_DEBT_SOURCE, tipo:"cuotas", tarjetaNombre:"", tarjetaDiaCierre:"", compraMes:"", origenColeccion:"", origenId:"" });
  const calc = form.cuota && form.cuotas_totales
    ? calcDeuda({ ...form, cuota:+form.cuota, interes_mensual:+form.interes_mensual||0, cuotas_totales:+form.cuotas_totales, cuota_actual:+form.cuota_actual||0 })
    : null;
  const saveDebt = () => onSave({
    ...form,
    id:deuda?.id||Date.now(),
    tipo:isCardDebt ? FUNDING_SOURCES.CREDIT_INSTALLMENTS : "cuotas",
    origen:isCardDebt ? FUNDING_SOURCES.CREDIT_INSTALLMENTS : EXTERNAL_DEBT_SOURCE,
    cuota:+form.cuota||0,
    interes_mensual:+form.interes_mensual||0,
    cuotas_totales:+form.cuotas_totales||0,
    cuota_actual:+form.cuota_actual||0,
    tarjetaNombre:isCardDebt ? form.tarjetaNombre || "" : "",
    tarjetaDiaCierre:isCardDebt && form.tarjetaDiaCierre ? +form.tarjetaDiaCierre : undefined,
    compraMes:isCardDebt ? form.compraMes || "" : "",
    origenColeccion:isCardDebt ? form.origenColeccion || "" : "",
    origenId:isCardDebt ? form.origenId || "" : "",
  });

  return (
    <Modal onClose={onClose} maxW={540}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ fontSize:18, fontWeight:700, color:C.txt }}>{deuda ? t("Edit debt") : t("New debt")}</h3>
        <button onClick={onClose} aria-label="Cerrar" style={{ border:"none", background:C.fondo, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:15, color:C.txt2 }}><i className="bi bi-x-lg" aria-hidden="true" /></button>
      </div>

      <div style={{ display:"grid", gap:13 }}>
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Debt source")}</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              { key:EXTERNAL_DEBT_SOURCE, label:t("External debt"), icon:"bi-bank" },
              { key:FUNDING_SOURCES.CREDIT_INSTALLMENTS, label:t("Credit card installments"), icon:"bi-credit-card-2-front" },
            ].map(option => {
              const active = source === option.key;
              return (
                <button key={option.key} type="button" onClick={() => setSource(option.key)}
                  style={{ background:active?C.brandPrimaryFixed:C.fondo, border:`1px solid ${active?C.brandPrimaryDim:C.borde}`, borderRadius:11, padding:"9px 10px", color:active?C.brandPrimary:C.txt2, fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                  <i className={`bi ${option.icon}`} aria-hidden="true" /> {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Name / Creditor")}</label>
          <input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="E.g. Marti / Tere" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        {isCardDebt && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 0.8fr 1fr", gap:10 }}>
            <div>
              <label style={{ ...labelS, color:C.txt2 }}>{t("Card name")}</label>
              <input value={form.tarjetaNombre || ""} onChange={e => set("tarjetaNombre", e.target.value)} placeholder="Visa, Mastercard..." style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
            </div>
            <div>
              <label style={{ ...labelS, color:C.txt2 }}>{t("Card closing day")}</label>
              <input type="number" min="1" max="31" value={form.tarjetaDiaCierre || ""} onChange={e => set("tarjetaDiaCierre", e.target.value)} placeholder="20" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
            </div>
            <div>
              <label style={{ ...labelS, color:C.txt2 }}>{t("Purchase month")}</label>
              <input type="month" value={form.compraMes || ""} onChange={e => set("compraMes", e.target.value)} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
            </div>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Monthly payment (€)")}</label>
            <input type="number" min="0" value={form.cuota || ""} onChange={e => set("cuota", e.target.value)} placeholder="1000" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Monthly interest / fee (€)")}</label>
            <input type="number" min="0" value={form.interes_mensual || ""} onChange={e => set("interes_mensual", e.target.value)} placeholder="50" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Total payments")}</label>
            <input type="number" min="1" value={form.cuotas_totales || ""} onChange={e => set("cuotas_totales", e.target.value)} placeholder="24" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>{t("Paid payments")}</label>
            <input type="number" min="0" value={form.cuota_actual || 0} onChange={e => set("cuota_actual", +e.target.value)} placeholder="6" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
        </div>

        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("First payment month")}</label>
          <input type="month" value={form.mes_inicio} onChange={e => set("mes_inicio", e.target.value)} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        <div>
          <label style={{ ...labelS, color:C.txt2 }}>{t("Notes")}</label>
          <input value={form.notas || ""} onChange={e => set("notas", e.target.value)} placeholder={t("Context or conditions...")} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        {/* Resumen calculado */}
        {calc && (
          <div style={{ background:C.fondo, borderRadius:12, padding:14, border:`1px solid ${C.borde}`, display:"grid", gap:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:4 }}>{t("Calculated summary")}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { l:t("Outstanding principal"),  v:fmt(calc.pendiente_capital),                    c:C.error },
                { l:t("Interest cost"),    v:fmt(calc.coste_total_intereses),                c:C.warn  },
                { l:t("Monthly impact"),    v:fmt(calc.impacto_mensual) + t("/month"),             c:C.txt   },
                { l:t("Estimated finish date"), v:labelMes(calc.mes_fin_real),                    c:C.cyan  },
              ].map(x => (
                <div key={x.l} style={{ background:C.superficie, borderRadius:9, padding:"8px 12px", border:`1px solid ${C.borde}` }}>
                  <div style={{ fontSize:10, color:C.txt2 }}>{x.l}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:x.c, marginTop:2 }}>{x.v}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.txt2, marginBottom:4 }}>
                <span>{t("Progress")}</span>
                <span style={{ fontWeight:700, color:C.txt }}>{calc.pagadas} {t("of")} {form.cuotas_totales} {t("Payments")}</span>
              </div>
              <div style={{ height:6, background:C.borde, borderRadius:6, overflow:"hidden" }}>
                <div style={{ width:`${calc.pct}%`, height:"100%", background:`linear-gradient(90deg,${C.sage},${C.cyan})`, borderRadius:6, transition:"width 0.4s" }}/>
              </div>
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:8 }}>
          <button
            onClick={saveDebt}
            style={{ flex:1, background:C.cyan, color:"white", border:"none", borderRadius:12, padding:11, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
            {t("Save debt")}
          </button>
          {deuda && (
            <button onClick={() => onDelete(deuda.id)}
              style={{ background:C.errorBg, color:C.error, border:`1px solid ${C.error}44`, borderRadius:12, padding:"11px 16px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              {t("Delete")}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
