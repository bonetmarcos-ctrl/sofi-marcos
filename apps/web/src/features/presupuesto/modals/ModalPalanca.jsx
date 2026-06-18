import { useState } from "react";
import Modal from "../../../components/Modal.jsx";
import { SUBCAT_VAR } from "../../../constants/categorias.js";
import { C, inputS, labelS } from "../../../constants/colores.js";
import { fmt, labelMes } from "../../../utils/format.js";

export default function ModalPalanca({ palanca, onSave, onDelete, onClose }) {
  const año = new Date().getFullYear();
  const [form, setForm] = useState(palanca ? { ...palanca } : {
    nombre: "", subcategoria: "habitacion", importe: "",
    mes: `${año}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    activa: false, notas: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const sub = SUBCAT_VAR[form.subcategoria];

  return (
    <Modal onClose={onClose} maxW={420}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ fontSize:18, fontWeight:700, color:C.txt }}>
          {palanca ? "Editar palanca" : "✨ Nueva palanca"}
        </h3>
        <button onClick={onClose} style={{ border:"none", background:C.fondo, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:15, color:C.txt2 }}>✕</button>
      </div>

      <div style={{ display:"grid", gap:14 }}>
        {/* Subcategoría */}
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>Subcategoría</label>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {Object.entries(SUBCAT_VAR).map(([k, v]) => (
              <button key={k} onClick={() => set("subcategoria", k)}
                style={{ padding:"6px 14px", borderRadius:20, fontSize:12, border:"none", cursor:"pointer", fontFamily:"'Lato',sans-serif", fontWeight:600, transition:"all 0.15s", background:form.subcategoria===k?v.color:v.bg, color:form.subcategoria===k?"white":v.color }}>
                {v.emoji} {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>Nombre</label>
          <input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Alquiler coche agosto" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        {/* Importe + Mes */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>Importe estimado (€)</label>
            <input type="number" min="0" value={form.importe || ""} onChange={e => set("importe", +e.target.value)} placeholder="0" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>Mes</label>
            <input type="month" value={form.mes} onChange={e => set("mes", e.target.value)} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>Notas</label>
          <input value={form.notas || ""} onChange={e => set("notas", e.target.value)} placeholder="Contexto o condiciones..." style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        {/* Info */}
        <div style={{ background:C.sageLight, borderRadius:10, padding:"10px 14px", fontSize:12, color:C.sageDark, border:`1px solid ${C.sage}44` }}>
          💡 Al <strong>activar</strong> esta palanca, <strong>{fmt(+form.importe || 0)}</strong> se sumará a los ingresos variables de <strong>{labelMes(form.mes)}</strong>
        </div>

        {/* Acciones */}
        <div style={{ display:"flex", gap:8 }}>
          <button
            onClick={() => onSave({ ...form, id:palanca?.id||Date.now(), importe:+form.importe||0 })}
            style={{ flex:1, background:C.cyan, color:"white", border:"none", borderRadius:12, padding:11, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
            Guardar palanca
          </button>
          {palanca && (
            <button onClick={() => onDelete(palanca.id)}
              style={{ background:C.errorBg, color:C.error, border:`1px solid ${C.error}44`, borderRadius:12, padding:"11px 16px", fontSize:13, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              Eliminar
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
