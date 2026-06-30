import { useState } from "react";
import Modal from "../../components/Modal.tsx";
import { C, inputS, labelS } from "../../constants/colores.ts";
import { fmt } from "../../utils/format.ts";
import { useI18n } from "../../i18n.tsx";
import ActionIconButton from "./ActionIconButton.tsx";

const GENERAL_FIELDS = [
  { key:"ingresos_fijos", label:"Fixed income" },
  { key:"gastos_fijos", label:"Fixed expenses" },
  { key:"deudas", label:"Debt" },
  { key:"previsiones", label:"Forecasts" },
  { key:"presupuesto_variable", label:"Variable budget" },
  { key:"coste_coche", label:"Car target cost" },
];

const OVERRIDE_FIELDS = [
  { key:"fixedIncome", label:"Fixed income" },
  { key:"fixedExpenses", label:"Fixed expenses" },
  { key:"debtExpenses", label:"Debt" },
];

const toNumber = (value) => Number(value || 0);

const toDayOfMonth = (value) => {
  const day = Math.trunc(Number(value || 1));
  return Number.isFinite(day) && day > 0 ? Math.min(31, day) : 1;
};

const toIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? String(value) : "";

const dayFromIsoDate = (value) => {
  const date = toIsoDate(value);
  return date ? Number(date.slice(8, 10)) : null;
};

const cleanLines = (lines = []) => lines
  .filter((line) => String(line.nombre || "").trim())
  .map((line) => ({
    ...line,
    id: line.id || Date.now() + Math.random(),
    nombre: String(line.nombre || "").trim(),
    importe: toNumber(line.importe),
    notas: line.notas || "",
  }));

const cleanOverrides = (overrides = {}) => Object.fromEntries(
  Object.entries(overrides)
    .map(([month, values]) => {
      const clean = Object.fromEntries(
        OVERRIDE_FIELDS
          .map(({ key }) => [key, values?.[key]])
          .filter(([, value]) => value !== "" && value !== null && value !== undefined)
          .map(([key, value]) => [key, toNumber(value)]),
      );
      return [month, clean];
    })
    .filter(([, values]) => Object.keys(values).length > 0),
);

export default function PanelConfiguracionPresupuesto({ base, prefVista, onSave, onClose }) {
  const { t } = useI18n();
  const [form, setForm] = useState(() => structuredClone(base));
  const override = form.monthlyOverrides?.[prefVista] || {};

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const setPrestamo = (key, value) => setForm((current) => ({
    ...current,
    prestamo_coche: { ...(current.prestamo_coche || {}), [key]: value },
  }));
  const setOverride = (key, value) => setForm((current) => ({
    ...current,
    monthlyOverrides: {
      ...(current.monthlyOverrides || {}),
      [prefVista]: { ...(current.monthlyOverrides?.[prefVista] || {}), [key]: value },
    },
  }));
  const setLine = (collection, index, patch) => setForm((current) => ({
    ...current,
    [collection]: (current[collection] || []).map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line),
  }));
  const addLine = (collection) => setForm((current) => ({
    ...current,
    [collection]: [...(current[collection] || []), { id: Date.now() + Math.random(), nombre:"", importe:0, notas:"" }],
  }));
  const removeLine = (collection, index) => setForm((current) => ({
    ...current,
    [collection]: (current[collection] || []).filter((_, lineIndex) => lineIndex !== index),
  }));

  const save = () => {
    onSave({
      ...form,
      id: form.id || "base",
      ingresos_fijos: toNumber(form.ingresos_fijos),
      gastos_fijos: toNumber(form.gastos_fijos),
      deudas: toNumber(form.deudas),
      previsiones: toNumber(form.previsiones),
      presupuesto_variable: toNumber(form.presupuesto_variable),
      coste_coche: toNumber(form.coste_coche),
      detalle_fijos: cleanLines(form.detalle_fijos),
      detalle_ingresos: cleanLines(form.detalle_ingresos).map((line) => {
        const fechaAcreditacion = toIsoDate(line.fechaAcreditacion ?? line.fechaCobro ?? line.fechaPago);
        return {
          ...line,
          recurrente: Boolean(line.recurrente),
          desde: line.desde || "",
          hasta: line.hasta || "",
          fechaAcreditacion,
          diaAcreditacion: toDayOfMonth(dayFromIsoDate(fechaAcreditacion) ?? line.diaAcreditacion ?? line.diaCobro ?? line.diaPago),
        };
      }),
      detalle_deudas: cleanLines(form.detalle_deudas),
      ingresos_puntuales_mayo: cleanLines(form.ingresos_puntuales_mayo),
      prestamo_coche: {
        importe: toNumber(form.prestamo_coche?.importe),
        vence: form.prestamo_coche?.vence || "",
      },
      monthlyOverrides: cleanOverrides(form.monthlyOverrides),
    });
  };

  const renderLineEditor = (collection, label, options = { income:false }) => (
    <div style={{ display:"grid", gap:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}>
        <div style={{ fontSize:12, fontWeight:800, color:C.txt, textTransform:"uppercase", letterSpacing:"0.5px" }}>{t(label)}</div>
        <button onClick={() => addLine(collection)} style={{ background:C.fondo, color:C.cyan, border:`1px solid ${C.borde}`, borderRadius:9, padding:"5px 10px", fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>+ {t("New")}</button>
      </div>
      {(form[collection] || []).length === 0 && <div style={{ fontSize:12, color:C.txt2, background:C.fondo, border:`1px solid ${C.borde}`, borderRadius:10, padding:12 }}>{t("No records")}</div>}
      {(form[collection] || []).map((line, index) => (
        <div key={line.id || index} style={{ display:"grid", gridTemplateColumns:"minmax(120px,1.35fr) minmax(82px,0.65fr) 34px", gap:8, alignItems:"center" }}>
          <input value={line.nombre || ""} onChange={(event) => setLine(collection, index, { nombre:event.target.value })} placeholder={t("Name")} style={{ ...inputS, background:C.fondo }}/>
          <input type="number" step="0.01" value={line.importe ?? ""} onChange={(event) => setLine(collection, index, { importe:event.target.value })} placeholder="0.00" style={{ ...inputS, background:C.fondo }}/>
          <ActionIconButton label={t("Delete")} icon="🗑️" tone="delete" size={34} onClick={() => removeLine(collection, index)} />
          {options.income && (
            <div style={{ gridColumn:"1 / -1", display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:8 }}>
              <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:C.txt2 }}>
                <input type="checkbox" checked={Boolean(line.recurrente)} onChange={(event) => setLine(collection, index, { recurrente:event.target.checked })}/>
                {t("Recurring")}
              </label>
              <input value={line.desde || ""} onChange={(event) => setLine(collection, index, { desde:event.target.value })} placeholder={t("From")} style={{ ...inputS, background:C.fondo }}/>
              <input type="date" value={line.fechaAcreditacion || ""} onChange={(event) => setLine(collection, index, { fechaAcreditacion:event.target.value })} aria-label={t("Credit date")} style={{ ...inputS, background:C.fondo }}/>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Modal onClose={onClose} maxW={760}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:18 }}>
        <div>
          <h3 style={{ fontSize:18, fontWeight:800, color:C.txt }}>{t("Editable base data")}</h3>
          <div style={{ fontSize:12, color:C.txt2, marginTop:3 }}>{t("Fixed tables and monthly overrides")}</div>
        </div>
        <button onClick={onClose} style={{ border:"none", background:C.fondo, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:15, color:C.txt2 }}>✕</button>
      </div>

      <div style={{ display:"grid", gap:16, maxHeight:"72vh", overflowY:"auto", paddingRight:2 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:10 }}>
          {GENERAL_FIELDS.map((field) => (
            <label key={field.key} style={{ display:"grid", gap:5 }}>
              <span style={labelS}>{t(field.label)}</span>
              <input type="number" step="0.01" value={form[field.key] ?? ""} onChange={(event) => setField(field.key, event.target.value)} style={{ ...inputS, background:C.fondo }}/>
            </label>
          ))}
        </div>

        <div style={{ background:C.cyanLight, border:`1px solid ${C.cyan}33`, borderRadius:12, padding:14, display:"grid", gap:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:800, color:C.cyan, textTransform:"uppercase", letterSpacing:"0.5px" }}>{t("Monthly override")}</div>
              <div style={{ fontSize:12, color:C.txt2 }}>{prefVista}</div>
            </div>
            <div style={{ fontSize:12, fontWeight:800, color:C.cyan }}>{fmt((override.fixedIncome ?? form.ingresos_fijos) - (override.fixedExpenses ?? form.gastos_fijos) - (override.debtExpenses ?? form.deudas))}</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:10 }}>
            {OVERRIDE_FIELDS.map((field) => (
              <label key={field.key} style={{ display:"grid", gap:5 }}>
                <span style={labelS}>{t(field.label)}</span>
                <input type="number" step="0.01" value={override[field.key] ?? ""} onChange={(event) => setOverride(field.key, event.target.value)} placeholder={String(field.key === "fixedIncome" ? form.ingresos_fijos : field.key === "fixedExpenses" ? form.gastos_fijos : form.deudas)} style={{ ...inputS, background:"white" }}/>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:16 }}>
          {renderLineEditor("detalle_ingresos", "Income lines", { income:true })}
          {renderLineEditor("detalle_fijos", "Fixed cost lines")}
          {renderLineEditor("detalle_deudas", "Debt summary lines")}
          {renderLineEditor("ingresos_puntuales_mayo", "One-off income lines")}
        </div>

        <div style={{ background:C.fondo, border:`1px solid ${C.borde}`, borderRadius:12, padding:14, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <label style={{ display:"grid", gap:5 }}>
            <span style={labelS}>{t("Car loan amount")}</span>
            <input type="number" step="0.01" value={form.prestamo_coche?.importe ?? ""} onChange={(event) => setPrestamo("importe", event.target.value)} style={{ ...inputS, background:"white" }}/>
          </label>
          <label style={{ display:"grid", gap:5 }}>
            <span style={labelS}>{t("Due month")}</span>
            <input type="month" value={form.prestamo_coche?.vence || ""} onChange={(event) => setPrestamo("vence", event.target.value)} style={{ ...inputS, background:"white" }}/>
          </label>
        </div>

        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", position:"sticky", bottom:0, background:"white", paddingTop:8 }}>
          <button onClick={onClose} style={{ background:C.fondo, color:C.txt2, border:`1px solid ${C.borde}`, borderRadius:12, padding:"10px 14px", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>{t("Close")}</button>
          <button onClick={save} style={{ background:C.cyan, color:"white", border:"none", borderRadius:12, padding:"10px 16px", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>{t("Save changes")}</button>
        </div>
      </div>
    </Modal>
  );
}