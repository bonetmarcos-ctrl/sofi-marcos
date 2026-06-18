import { CATEGORIAS, PERSONAS, COLOR_VIAJE } from "../../constants/categorias.js";
import { C } from "../../constants/colores.js";
import { DIAS } from "../../constants/meses.js";
import { fmt } from "../../utils/format.js";
import { toISO, todayISO, rangoFechas } from "../../utils/dates.js";
import { useBreakpoint } from "../../hooks/useBreakpoint.js";

export default function CalMensual({ año, mes, eventos, viajes, bloqueos, onDia, onEvento, onViaje }) {
  const { isMobile } = useBreakpoint();
  const primer  = new Date(año, mes, 1);
  const total   = new Date(año, mes + 1, 0).getDate();
  let offset    = primer.getDay() - 1;
  if (offset < 0) offset = 6;

  const celdas = Array.from({ length: offset + total }, (_, i) => i < offset ? null : i - offset + 1);
  while (celdas.length % 7 !== 0) celdas.push(null);

  // Mapa viajes por fecha
  const vxf = {};
  viajes.forEach(v => {
    if (!v.inicio || !v.fin) return;
    rangoFechas(v.inicio, v.fin).forEach(f => {
      if (!vxf[f]) vxf[f] = [];
      vxf[f].push({ ...v, esViaje: true });
    });
  });
  eventos.filter(e => e.categoria === "viaje" && e.viajeInicio && e.viajeFin).forEach(ev => {
    rangoFechas(ev.viajeInicio, ev.viajeFin).forEach(f => {
      if (!vxf[f]) vxf[f] = [];
      vxf[f].push({ id:ev.id, nombre:ev.titulo, emoji:"✈️", esEvento:true });
    });
  });

  // Mapa bloqueos por fecha
  const bxf = {};
  (bloqueos || []).forEach(b => {
    if (!b.inicio || !b.fin) return;
    rangoFechas(b.inicio, b.fin).forEach(f => {
      if (!bxf[f]) bxf[f] = [];
      bxf[f].push(b);
    });
  });

  return (
    <div>
      {/* Cabecera días */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:8, minWidth:isMobile?620:"auto" }}>
        {DIAS.map(d => (
          <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:C.txt2, padding:"6px 0", letterSpacing:"0.5px" }}>{d}</div>
        ))}
      </div>

      {/* Celdas */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, minWidth:isMobile?620:"auto" }}>
        {celdas.map((dia, i) => {
          if (!dia) return <div key={i} style={{ minHeight:isMobile?78:88 }}/>;

          const iso         = `${año}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
          const evs         = eventos.filter(e => e.fecha === iso);
          const vh          = vxf[iso] || [];
          const bh          = bxf[iso] || [];
          const isToday     = iso === todayISO;
          const gt          = evs.filter(e => CATEGORIAS[e.categoria]?.tipo === "gasto").reduce((a, e) => a + e.importe, 0);
          const it          = evs.filter(e => CATEGORIAS[e.categoria]?.tipo === "ingreso").reduce((a, e) => a + e.importe, 0);
          const habOcupada  = bh.some(b => b.tipo === "habitacion");
          const cocheOcupado = bh.some(b => b.tipo === "coche");
          const esViaje     = vh.length > 0;

          const bgPattern = habOcupada
            ? "repeating-linear-gradient(45deg,#ecfdf5,#ecfdf5 4px,#d1fae5 4px,#d1fae5 8px)"
            : esViaje
            ? `repeating-linear-gradient(45deg,${C.cyanLight},${C.cyanLight} 5px,#cce9ed 5px,#cce9ed 10px)`
            : isToday ? C.cyan : C.superficie;

          const borderColor = isToday ? C.cyan : habOcupada ? C.sage : esViaje ? C.cyanMid : C.borde;

          return (
            <div key={i}
              onClick={() => esViaje ? onViaje(vh[0]) : onDia(iso)}
              style={{ minHeight:isMobile?78:88, borderRadius:12, padding:"6px 7px", cursor:"pointer", background:bgPattern, border:`1px solid ${borderColor}`, position:"relative", overflow:"hidden", transition:"box-shadow 0.15s" }}
              onMouseEnter={e => { if (!isToday && !habOcupada && !esViaje) { e.currentTarget.style.background = C.cyanLight; e.currentTarget.style.borderColor = C.cyan; }}}
              onMouseLeave={e => { if (!isToday && !habOcupada && !esViaje) { e.currentTarget.style.background = C.superficie; e.currentTarget.style.borderColor = C.borde; }}}>

              {esViaje    && <div style={{ position:"absolute", top:3, right:5, fontSize:10 }}>✈️</div>}
              {cocheOcupado && <div style={{ position:"absolute", top:4, right:4, fontSize:9, background:"#fef3c7", borderRadius:4, padding:"1px 3px", border:"1px solid #fcd34d" }}>🚗</div>}

              <div style={{ fontSize:13, fontWeight:700, color:isToday?"white":C.txt, marginBottom:3, marginTop:vh.length>0?6:0 }}>{dia}</div>

              {evs.slice(0, 2).map(ev => {
                const cat     = CATEGORIAS[ev.categoria];
                const esIng   = cat?.tipo === "ingreso";
                const persona = PERSONAS[ev.persona || "ambos"];
                const bgColor = esIng ? C.exitoBg : (ev.persona && ev.persona !== "ambos") ? persona.bg : cat?.bg;
                const txtColor = esIng ? C.sageDark : (ev.persona && ev.persona !== "ambos") ? persona.color : cat?.color;
                return (
                  <div key={ev.id}
                    onClick={e => { e.stopPropagation(); onEvento(ev); }}
                    style={{ fontSize:10, padding:"2px 6px", borderRadius:6, marginBottom:2, background:bgColor, color:txtColor, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontWeight:600, display:"flex", alignItems:"center", gap:3 }}>
                    {ev.persona && ev.persona !== "ambos" && <span style={{ width:5, height:5, borderRadius:"50%", background:persona.color, flexShrink:0, display:"inline-block" }}/>}
                    {cat?.emoji} {ev.titulo}
                  </div>
                );
              })}

              {evs.length > 2 && <div style={{ fontSize:9, color:C.txt2 }}>+{evs.length - 2} más</div>}
              {habOcupada && <div style={{ fontSize:9, color:C.sageDark, fontWeight:700, marginTop:2 }}>🛏️ ocupada</div>}

              <div style={{ marginTop:2 }}>
                {gt > 0 && <div style={{ fontSize:9, fontWeight:700, color:C.lavender }}>−{fmt(gt)}</div>}
                {it > 0 && <div style={{ fontSize:9, fontWeight:700, color:C.sageDark }}>+{fmt(it)}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
