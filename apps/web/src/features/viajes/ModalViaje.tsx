import { useState } from "react";
import Modal from "../../components/Modal.tsx";
import { GASTOS_VIAJE, COLORES_VIAJE } from "../../constants/categorias.ts";
import { C, inputS, labelS } from "../../constants/colores.ts";
import { fmt, fmtd } from "../../utils/format.ts";
import { daysBetween } from "../../utils/dates.ts";
import { useI18n } from "../../i18n.tsx";

export default function ModalViaje({ viaje, onSave, onDelete, onClose }) {
  const { t } = useI18n();
  const [form, setForm] = useState(viaje ? { ...viaje, gastos:{ ...viaje.gastos } } : {
    nombre: "", inicio: "", fin: "", presupuesto: "",
    color: COLORES_VIAJE[0], emoji: "✈️", notas: "",
    gastos: { vuelo:0, hotel:0, transporte:0, restaurante:0, actividades:0, otro:0 },
  });

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setG = (k, v) => setForm(f => ({ ...f, gastos:{ ...f.gastos, [k]: +v || 0 } }));

  const total     = Object.values(form.gastos).reduce<number>((a, b) => a + Number(b || 0), 0);
  const noches    = form.inicio && form.fin ? daysBetween(form.inicio, form.fin) : 0;
  const restante  = (+form.presupuesto || 0) - total;

  return (
    <Modal onClose={onClose} maxW={500}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"#1a1a2e" }}>
          {viaje ? t("Edit trip") : `✈️ ${t("New trip")}`}
        </h3>
        <button onClick={onClose} style={{ border:"none", background:"#f1f0f7", borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:15, color:"#7c6f9e" }}>✕</button>
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
            <input type="date" value={form.inicio} onChange={e => set("inicio", e.target.value)} style={inputS}/>
          </div>
          <div>
            <label style={labelS}>{t("Return")}</label>
            <input type="date" value={form.fin} onChange={e => set("fin", e.target.value)} style={inputS}/>
          </div>
        </div>
        {noches > 0 && (
          <div style={{ fontSize:12, color:"#7c6f9e", marginTop:-8 }}>📅 {noches} {t(noches !== 1 ? "nights" : "night")}</div>
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
                style={{ width:28, height:28, borderRadius:"50%", background:c, cursor:"pointer", border:form.color===c?"3px solid #1a1a2e":"3px solid transparent", transition:"border 0.15s" }}/>
            ))}
          </div>
        </div>

        {/* Desglose gastos */}
        <div style={{ background:"#f8f7ff", borderRadius:14, padding:14, border:"1px solid #e2e0ed" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#4c1d95", marginBottom:12, textTransform:"uppercase", letterSpacing:"0.6px" }}>💸 {t("Expense breakdown")}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {GASTOS_VIAJE.map(g => (
              <div key={g.key}>
                <label style={{ ...labelS, fontSize:10 }}>{g.emoji} {t(g.label)}</label>
                <input type="number" min="0" step="0.01" value={form.gastos[g.key] || ""} onChange={e => setG(g.key, e.target.value)} placeholder="0" style={inputS}/>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div style={{ marginTop:12, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <div style={{ background:"white", borderRadius:8, padding:"8px 12px", textAlign:"center" }}>
              <div style={{ fontSize:10, color:"#7c6f9e", textTransform:"uppercase" }}>{t("Total")}</div>
              <div style={{ fontSize:18, fontWeight:700, color:"#8b5cf6", fontFamily:"'Playfair Display',serif" }}>{fmt(total)}</div>
            </div>
            <div style={{ background:restante>=0?"#f0fdf4":"#fff1f2", borderRadius:8, padding:"8px 12px", textAlign:"center" }}>
              <div style={{ fontSize:10, color:restante>=0?"#059669":"#be123c", textTransform:"uppercase" }}>{restante>=0?t("Remaining"):t("Exceeded")}</div>
              <div style={{ fontSize:18, fontWeight:700, color:restante>=0?"#065f46":"#9f1239", fontFamily:"'Playfair Display',serif" }}>{fmt(Math.abs(restante))}</div>
            </div>
          </div>

          {/* Barra progreso */}
          {form.presupuesto > 0 && (
            <div style={{ marginTop:10 }}>
              <div style={{ height:6, background:"#e2e0ed", borderRadius:6, overflow:"hidden" }}>
                <div style={{ width:`${Math.min(100, (total / (+form.presupuesto)) * 100)}%`, height:"100%", background:restante>=0?"#8b5cf6":"#be123c", borderRadius:6, transition:"width 0.4s" }}/>
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
            onClick={() => onSave({ ...form, id:viaje?.id || Date.now(), presupuesto:+form.presupuesto || 0 })}
            style={{ flex:1, background:C.cyan, color:"white", border:"none", borderRadius:12, padding:11, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
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
