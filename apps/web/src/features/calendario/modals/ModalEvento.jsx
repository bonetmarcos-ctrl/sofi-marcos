import { useState, useEffect } from "react";
import Modal from "../../../components/Modal.jsx";
import { CATEGORIAS, PERSONAS } from "../../../constants/categorias.js";
import { C, inputS, labelS } from "../../../constants/colores.js";
import { fmtd } from "../../../utils/format.js";
import { labelMes } from "../../../utils/format.js";
import { todayISO } from "../../../utils/dates.js";

export default function ModalEvento({ fechaInicial, evento, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(evento ? { ...evento } : {
    fecha: fechaInicial || todayISO,
    titulo: "",
    hora: "",
    categoria: "ocio",
    importe: "",
    notas: "",
    huespedes: "",
    noches: 1,
    precioPorNoche: 35,
    diasAlquiler: 1,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Excluir viaje — los viajes van por ModalViaje
  const CATS_EVENTO = Object.fromEntries(Object.entries(CATEGORIAS).filter(([k]) => k !== "viaje"));
  const esIngreso   = CATEGORIAS[form.categoria]?.tipo === "ingreso";

  // Auto-calcular importe para habitación y coche
  useEffect(() => {
    if (form.categoria === "habitacion" && form.noches && form.precioPorNoche !== undefined) {
      set("importe", form.noches * form.precioPorNoche);
      if (form.huespedes) set("titulo", `${form.huespedes} — habitación`);
    }
    if (form.categoria === "coche" && form.diasAlquiler) {
      set("importe", Math.round(form.diasAlquiler * 35 * 0.7));
    }
  }, [form.categoria, form.noches, form.precioPorNoche, form.huespedes, form.diasAlquiler]);

  return (
    <Modal onClose={onClose}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ fontSize:18, fontWeight:700, color:C.txt }}>{evento ? "Editar evento" : "Nuevo evento"}</h3>
        <button onClick={onClose} style={{ border:"none", background:C.fondo, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:15, color:C.txt2 }}>✕</button>
      </div>

      <div style={{ display:"grid", gap:14 }}>
        {/* Tipo de categoría */}
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>Tipo</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {Object.entries(CATS_EVENTO).map(([k, v]) => (
              <button key={k} onClick={() => set("categoria", k)}
                style={{ padding:"5px 11px", borderRadius:20, fontSize:12, border:"none", cursor:"pointer", fontFamily:"'Lato',sans-serif", transition:"all 0.15s", background:form.categoria===k?v.color:v.bg, color:form.categoria===k?"white":v.color, fontWeight:form.categoria===k?700:400 }}>
                {v.emoji} {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Persona */}
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>¿De quién?</label>
          <div style={{ display:"flex", gap:6 }}>
            {Object.entries(PERSONAS).map(([k, v]) => (
              <button key={k} onClick={() => set("persona", k)}
                style={{ flex:1, padding:"7px", borderRadius:10, fontSize:12, border:"none", cursor:"pointer", fontFamily:"'Lato',sans-serif", transition:"all 0.15s", background:form.persona===k?v.color:v.bg, color:form.persona===k?"white":v.color, fontWeight:form.persona===k?700:500 }}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Panel habitación */}
        {form.categoria === "habitacion" && (
          <div style={{ background:C.exitoBg, borderRadius:12, padding:14, border:`1px solid ${C.exito}55` }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.sageDark, marginBottom:10 }}>🛏️ Datos de la reserva</div>
            <div style={{ display:"grid", gap:10 }}>
              <div>
                <label style={{ ...labelS, color:C.txt2 }}>Huéspedes</label>
                <input value={form.huespedes || ""} onChange={e => set("huespedes", e.target.value)} placeholder="Ej: Marc & Sofía" style={{ ...inputS, background:C.superficie, border:`1px solid ${C.borde}` }}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>Noches</label>
                  <input type="number" min="1" value={form.noches || 1} onChange={e => set("noches", +e.target.value)} style={{ ...inputS, background:C.superficie, border:`1px solid ${C.borde}` }}/>
                </div>
                <div>
                  <label style={{ ...labelS, color:C.txt2 }}>€/noche</label>
                  <select value={form.precioPorNoche} onChange={e => set("precioPorNoche", +e.target.value)} style={{ ...inputS, background:C.superficie, border:`1px solid ${C.borde}` }}>
                    <option value={35}>35€ — individual</option>
                    <option value={50}>50€ — pareja</option>
                    <option value={0}>0€ — familia/gratis</option>
                  </select>
                </div>
              </div>
              <div style={{ background:C.superficie, borderRadius:8, padding:"8px 12px", fontSize:13, color:C.sageDark, fontWeight:700 }}>
                💰 Total: {fmtd((form.noches || 1) * (form.precioPorNoche || 0))}
              </div>
            </div>
          </div>
        )}

        {/* Panel coche */}
        {form.categoria === "coche" && (
          <div style={{ background:C.cyanLight, borderRadius:12, padding:14, border:`1px solid ${C.cyan}44` }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.cyan, marginBottom:10 }}>🔑 Alquiler coche</div>
            <div>
              <label style={{ ...labelS, color:C.txt2 }}>Días</label>
              <input type="number" min="1" value={form.diasAlquiler || 1} onChange={e => set("diasAlquiler", +e.target.value)} style={{ ...inputS, background:C.superficie, border:`1px solid ${C.borde}` }}/>
            </div>
            <div style={{ background:C.superficie, borderRadius:8, padding:"8px 12px", fontSize:13, color:C.cyan, fontWeight:700, marginTop:8 }}>
              💰 Neto (−30%): {fmtd((form.diasAlquiler || 1) * 35 * 0.7)}
            </div>
          </div>
        )}

        {/* Descripción */}
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>Descripción</label>
          <input value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="¿Qué es?" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        {/* Fecha + Hora */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>Fecha</label>
            <input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>Hora</label>
            <input type="time" value={form.hora || ""} onChange={e => set("hora", e.target.value)} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
        </div>

        {/* Importe (solo si no es habitación ni coche) */}
        {form.categoria !== "habitacion" && form.categoria !== "coche" && (
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>Importe (€)</label>
            <input type="number" step="0.01" value={form.importe || ""} onChange={e => set("importe", +e.target.value)} placeholder="0.00" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
        )}

        {/* Notas */}
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>Notas</label>
          <input value={form.notas || ""} onChange={e => set("notas", e.target.value)} placeholder="Detalles..." style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        {/* Resumen */}
        <div style={{ background:esIngreso?C.exitoBg:C.lavLight, borderRadius:10, padding:"10px 14px", fontSize:12, color:esIngreso?C.sageDark:C.lavender, border:`1px solid ${esIngreso?C.exito+"44":C.lavender+"44"}` }}>
          {esIngreso ? "✅ Ingreso extra" : "✅ Gasto variable"} → {labelMes((form.fecha || todayISO).slice(0, 7))}
          {form.importe > 0 && <strong> · {fmtd(+form.importe)}</strong>}
        </div>

        {/* Acciones */}
        <div style={{ display:"flex", gap:8 }}>
          <button
            onClick={() => onSave({ ...form, id:evento?.id || Date.now(), importe:+form.importe || 0 })}
            style={{ flex:1, background:C.cyan, color:"white", border:"none", borderRadius:12, padding:11, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
            {evento ? "Guardar cambios" : "Guardar evento"}
          </button>
          {evento && (
            <button onClick={() => { if (window.confirm("¿Eliminar este evento?")) onDelete(evento.id); }}
              style={{ background:C.errorBg, color:C.error, border:`1px solid ${C.error}44`, borderRadius:12, padding:"11px 16px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              🗑️ Eliminar
            </button>
          )}
        </div>

        {!evento && (
          <div style={{ fontSize:11, color:C.txt2, textAlign:"center", padding:"4px 0", borderTop:`1px solid ${C.borde}`, marginTop:-4 }}>
            ¿Quieres añadir un viaje? Usa el botón <strong>+ Añadir</strong> → Viaje desde el menú principal
          </div>
        )}
      </div>
    </Modal>
  );
}
