import { useState } from "react";
import Modal from "../../../components/Modal.jsx";
import { C, inputS, labelS } from "../../../constants/colores.js";
import { fmt } from "../../../utils/format.js";
import { labelMes, } from "../../../utils/format.js";
import { todayISO } from "../../../utils/dates.js";
import { calcDeuda } from "../../../utils/calcDeuda.js";

export default function ModalDeuda({ deuda, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(deuda ? { ...deuda } : {
    nombre: "", tipo: "cuotas", cuota: "", interes_mensual: 0,
    cuotas_totales: "", cuota_actual: 0, mes_inicio: todayISO.slice(0, 7), notas: "",
  });
  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const calc = form.cuota && form.cuotas_totales
    ? calcDeuda({ ...form, cuota:+form.cuota, interes_mensual:+form.interes_mensual||0, cuotas_totales:+form.cuotas_totales, cuota_actual:+form.cuota_actual||0 })
    : null;

  return (
    <Modal onClose={onClose} maxW={460}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ fontSize:18, fontWeight:700, color:C.txt }}>{deuda ? "Editar deuda" : "Nueva deuda"}</h3>
        <button onClick={onClose} style={{ border:"none", background:C.fondo, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:15, color:C.txt2 }}>✕</button>
      </div>

      <div style={{ display:"grid", gap:13 }}>
        <div>
          <label style={{ ...labelS, color:C.txt2 }}>Nombre / Acreedor</label>
          <input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Marti / Tere" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>Cuota mensual (€)</label>
            <input type="number" min="0" value={form.cuota || ""} onChange={e => set("cuota", e.target.value)} placeholder="1000" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>Interés / gasto mes (€)</label>
            <input type="number" min="0" value={form.interes_mensual || ""} onChange={e => set("interes_mensual", e.target.value)} placeholder="50" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>Cuotas totales</label>
            <input type="number" min="1" value={form.cuotas_totales || ""} onChange={e => set("cuotas_totales", e.target.value)} placeholder="24" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
          <div>
            <label style={{ ...labelS, color:C.txt2 }}>Cuotas pagadas</label>
            <input type="number" min="0" value={form.cuota_actual || 0} onChange={e => set("cuota_actual", +e.target.value)} placeholder="6" style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
          </div>
        </div>

        <div>
          <label style={{ ...labelS, color:C.txt2 }}>Mes primera cuota</label>
          <input type="month" value={form.mes_inicio} onChange={e => set("mes_inicio", e.target.value)} style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        <div>
          <label style={{ ...labelS, color:C.txt2 }}>Notas</label>
          <input value={form.notas || ""} onChange={e => set("notas", e.target.value)} placeholder="Contexto..." style={{ ...inputS, background:C.fondo, border:`1px solid ${C.borde}` }}/>
        </div>

        {/* Resumen calculado */}
        {calc && (
          <div style={{ background:C.fondo, borderRadius:12, padding:14, border:`1px solid ${C.borde}`, display:"grid", gap:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.txt2, textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:4 }}>Resumen calculado</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { l:"Pendiente capital",  v:fmt(calc.pendiente_capital),                    c:C.error },
                { l:"Coste intereses",    v:fmt(calc.coste_total_intereses),                c:C.warn  },
                { l:"Impacto mensual",    v:fmt(calc.impacto_mensual) + "/mes",             c:C.txt   },
                { l:"Fecha fin estimada", v:labelMes(calc.mes_fin_real),                    c:C.cyan  },
              ].map(x => (
                <div key={x.l} style={{ background:C.superficie, borderRadius:9, padding:"8px 12px", border:`1px solid ${C.borde}` }}>
                  <div style={{ fontSize:10, color:C.txt2 }}>{x.l}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:x.c, marginTop:2 }}>{x.v}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.txt2, marginBottom:4 }}>
                <span>Progreso</span>
                <span style={{ fontWeight:700, color:C.txt }}>{calc.pagadas} de {form.cuotas_totales} cuotas</span>
              </div>
              <div style={{ height:6, background:C.borde, borderRadius:6, overflow:"hidden" }}>
                <div style={{ width:`${calc.pct}%`, height:"100%", background:`linear-gradient(90deg,${C.sage},${C.cyan})`, borderRadius:6, transition:"width 0.4s" }}/>
              </div>
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:8 }}>
          <button
            onClick={() => onSave({ ...form, id:deuda?.id||Date.now(), cuota:+form.cuota||0, interes_mensual:+form.interes_mensual||0, cuotas_totales:+form.cuotas_totales||0, cuota_actual:+form.cuota_actual||0 })}
            style={{ flex:1, background:C.cyan, color:"white", border:"none", borderRadius:12, padding:11, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
            Guardar deuda
          </button>
          {deuda && (
            <button onClick={() => onDelete(deuda.id)}
              style={{ background:C.errorBg, color:C.error, border:`1px solid ${C.error}44`, borderRadius:12, padding:"11px 16px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
              Eliminar
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
