import { CATEGORIAS, PERSONAS, COLOR_VIAJE, BG_VIAJE, COLOR_VIAJE_MID, categoriaEventoKey, eventoVisibleEnCalendario } from "../../constants/categorias.ts";
import { C } from "../../constants/colores.ts";
import { DIAS } from "../../constants/meses.ts";
import { toISO, todayISO, rangoFechas } from "../../utils/dates.ts";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useI18n } from "../../i18n.tsx";

export default function CalMensual({ año, mes, eventos, viajes, bloqueos, cumpleanos = [], onDia, onEvento, onViaje, onBloqueo }) {
  const { t, weekdayName } = useI18n();
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
        {DIAS.map((d, index) => (
          <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:C.txt2, padding:"6px 0", letterSpacing:"0.5px" }}>{weekdayName(index)}</div>
        ))}
      </div>

      {/* Celdas */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, minWidth:isMobile?620:"auto" }}>
        {celdas.map((dia, i) => {
          if (!dia) return <div key={i} style={{ minHeight:isMobile?78:88 }}/>;

          const iso         = `${año}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
          const evsDia      = eventos.filter(e => e.fecha === iso);
          const evs         = evsDia.filter(eventoVisibleEnCalendario);
          const vh          = vxf[iso] || [];
          const bh          = bxf[iso] || [];
          const cumpleDia   = cumpleanos.filter(cumple => birthdayMatchesDate(cumple.fecha, iso));
          const isToday     = iso === todayISO;
          const conDisponibilidad = bh.length > 0;
          const esViaje     = vh.length > 0;

          const bgPattern = conDisponibilidad
            ? `repeating-linear-gradient(45deg,${C.brandPrimaryFixed},${C.brandPrimaryFixed} 4px,${C.superficie} 4px,${C.superficie} 8px)`
            : esViaje
            ? `repeating-linear-gradient(45deg,${BG_VIAJE},${BG_VIAJE} 5px,${COLOR_VIAJE_MID}55 5px,${COLOR_VIAJE_MID}55 10px)`
            : isToday ? C.cyan : C.superficie;

          const borderColor = isToday ? C.cyan : conDisponibilidad ? C.brandPrimaryDim : esViaje ? COLOR_VIAJE : C.borde;

          return (
            <div key={i}
              onClick={() => esViaje ? onViaje(vh[0]) : onDia(iso)}
              style={{ minHeight:isMobile?78:88, borderRadius:12, padding:"6px 7px", cursor:"pointer", background:bgPattern, border:`1px solid ${borderColor}`, position:"relative", overflow:"hidden", transition:"box-shadow 0.15s" }}
              onMouseEnter={e => { if (!isToday && !conDisponibilidad && !esViaje) { e.currentTarget.style.background = C.cyanLight; e.currentTarget.style.borderColor = C.cyan; }}}
              onMouseLeave={e => { if (!isToday && !conDisponibilidad && !esViaje) { e.currentTarget.style.background = C.superficie; e.currentTarget.style.borderColor = C.borde; }}}>

              {esViaje    && <div style={{ position:"absolute", top:3, right:5, fontSize:10 }}>✈️</div>}
              {conDisponibilidad && <div style={{ position:"absolute", top:4, right:4, fontSize:9, background:C.brandPrimaryFixed, color:C.brandPrimary, borderRadius:4, padding:"1px 3px", border:`1px solid ${C.brandPrimaryDim}` }}>{blockIcon(bh[0])}</div>}

              <div style={{ fontSize:13, fontWeight:700, color:isToday?"white":C.txt, marginBottom:3, marginTop:vh.length>0?6:0 }}>{dia}</div>

              {evs.slice(0, 2).map(ev => {
                const cat     = CATEGORIAS[categoriaEventoKey(ev)];
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

              {evs.length > 2 && <div style={{ fontSize:9, color:C.txt2 }}>+{evs.length - 2} {t("more")}</div>}
              {bh.slice(0, 2).map(b => (
                <div key={b.id || `${b.tipo}-${b.inicio}-${b.fin}`} onClick={e => { e.stopPropagation(); onBloqueo?.(b); }}
                  style={{ fontSize:9, color:blockColor(b), fontWeight:700, marginTop:2, background:blockBg(b), border:`1px solid ${blockColor(b)}33`, borderRadius:6, padding:"2px 5px", cursor:"pointer", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {blockIcon(b)} {blockLabel(b, t)}
                </div>
              ))}
              {bh.length > 2 && <div style={{ fontSize:9, color:C.txt2 }}>+{bh.length - 2} {t("more")}</div>}
              {cumpleDia.slice(0, 1).map(cumple => (
                <div key={cumple.id || `${cumple.nombre}-${cumple.fecha}`} style={{ fontSize:9, color:"#b45309", fontWeight:700, marginTop:2, background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:6, padding:"2px 5px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  🎂 {cumple.nombre}
                </div>
              ))}
              {cumpleDia.length > 1 && <div style={{ fontSize:9, color:C.txt2 }}>+{cumpleDia.length - 1} {t("more")}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const birthdayMatchesDate = (birthday, isoDate) => Boolean(birthday && isoDate && birthday.slice(5, 10) === isoDate.slice(5, 10));
const blockIcon = (block) => block?.tipo === "habitacion" ? "🛏️" : block?.tipo === "coche" ? "🚗" : "📍";
const blockLabel = (block, t) => block?.recursoNombre || block?.nota || (block?.tipo === "habitacion" ? t("Room") : block?.tipo === "coche" ? t("Car") : t("Availability"));
const blockColor = (block) => block?.tipo === "habitacion" ? C.sageDark : block?.tipo === "coche" ? C.brandTertiary : C.brandPrimary;
const blockBg = (block) => block?.tipo === "habitacion" ? C.exitoBg : block?.tipo === "coche" ? C.brandTertiaryFixed : C.brandPrimaryFixed;
