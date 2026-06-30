import { CATEGORIAS, COLOR_VIAJE, categoriaEventoKey, eventoVisibleEnCalendario } from "../../constants/categorias.ts";
import { C } from "../../constants/colores.ts";
import { toISO, todayISO, rangoFechas } from "../../utils/dates.ts";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useI18n } from "../../i18n.tsx";

export default function CalSemanal({ inicio, eventos, viajes, bloqueos, cumpleanos = [], onDia, onEvento, onViaje, onBloqueo }) {
  const { t, weekdayName } = useI18n();
  const { isMobile } = useBreakpoint();
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(d.getDate() + i);
    return d;
  });

  const bxf = {};
  (bloqueos || []).forEach(b => {
    if (!b.inicio || !b.fin) return;
    rangoFechas(b.inicio, b.fin).forEach(f => {
      if (!bxf[f]) bxf[f] = [];
      bxf[f].push(b);
    });
  });

  const allViajes = [
    ...viajes.filter(v => v.inicio && v.fin),
    ...eventos
      .filter(e => e.categoria === "viaje" && e.viajeInicio && e.viajeFin)
      .map(e => ({ id:e.id, nombre:e.titulo, inicio:e.viajeInicio, fin:e.viajeFin, emoji:"✈️", persona:e.persona })),
  ];

  return (
    <div>
      {/* ── Banners de viajes ── */}
      {allViajes.map(v => {
        const rango = rangoFechas(v.inicio, v.fin);
        const dr    = dias.map(d => toISO(d));
        const fi    = dr.findIndex(d => rango.includes(d));
        const li    = dr.map((d, i) => rango.includes(d) ? i : -1).filter(i => i >= 0).pop();
        if (fi === -1) return null;
        return (
          <div key={v.id} onClick={() => onViaje(v)}
            style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:6, cursor:"pointer", minWidth:isMobile?620:"auto" }}>
            {dias.map((_, i) => {
              const en = i >= fi && i <= li;
              return (
                <div key={i} style={{
                  height:24,
                  background: en ? COLOR_VIAJE : "transparent",
                  borderRadius: i===fi ? "12px 0 0 12px" : i===li ? "0 12px 12px 0" : "0",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:10, color:"white", fontWeight:700,
                }}>
                  {i === fi && <span>✈️ {v.nombre}</span>}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* ── Columnas de días ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, minWidth:isMobile?620:"auto" }}>
        {dias.map((dia, i) => {
          const iso   = toISO(dia);
          const evsDia = eventos.filter(e => e.fecha === iso);
          const evs   = evsDia.filter(eventoVisibleEnCalendario);
          const bls   = bxf[iso] || [];
          const cumpleDia = cumpleanos.filter(cumple => birthdayMatchesDate(cumple.fecha, iso));
          const isToday = iso === todayISO;

          return (
            <div key={i}>
              {/* Cabecera día */}
              <div style={{
                textAlign:"center", padding:"8px 4px", borderRadius:10, marginBottom:6,
                background: isToday ? C.cyan : "transparent",
                border: isToday ? "none" : `1px solid ${C.borde}`,
              }}>
                <div style={{ fontSize:10, color:isToday?"rgba(255,255,255,0.7)":C.txt2, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>{weekdayName(i)}</div>
                <div style={{ fontSize:20, fontWeight:700, color:isToday?"white":C.txt }}>{dia.getDate()}</div>
              </div>

              {/* Eventos del día */}
              <div style={{ display:"flex", flexDirection:"column", gap:4, minHeight:90 }}>
                {evs.map(ev => {
                  const cat   = CATEGORIAS[categoriaEventoKey(ev)];
                  return (
                    <div key={ev.id} onClick={() => onEvento(ev)}
                      style={{ padding:"8px 9px", borderRadius:10, cursor:"pointer", background:cat?.bg || C.fondo, border:`1px solid ${(cat?.color || C.borde)}33` }}>
                      <div style={{ fontSize:11, fontWeight:700, color:cat?.color || C.txt }}>{cat?.emoji} {ev.titulo}</div>
                      {ev.hora && <div style={{ fontSize:10, color:C.txt2, marginTop:1 }}>⏰ {ev.hora}</div>}
                    </div>
                  );
                })}

                {bls.map(b => (
                  <div key={b.id || `${b.tipo}-${b.inicio}-${b.fin}`} onClick={() => onBloqueo?.(b)} style={{ padding:"8px 9px", borderRadius:10, background:blockBg(b), border:`1px solid ${blockColor(b)}33`, cursor:"pointer" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:blockColor(b) }}>{blockIcon(b)} {blockLabel(b, t, weekdayName(i))}</div>
                    {(b.horaInicio || b.horaFin) && <div style={{ fontSize:10, color:C.txt2, marginTop:1 }}>⏰ {b.horaInicio || "--:--"} - {b.horaFin || "--:--"}</div>}
                  </div>
                ))}

                {cumpleDia.map(cumple => (
                  <div key={cumple.id || `${cumple.nombre}-${cumple.fecha}`} style={{ padding:"8px 9px", borderRadius:10, background:"#fffbeb", border:"1px solid #fcd34d" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#b45309" }}>🎂 {cumple.nombre}</div>
                  </div>
                ))}

                {/* Botón añadir */}
                <div onClick={() => onDia(iso)}
                  style={{ border:`1.5px dashed ${C.borde}`, borderRadius:10, padding:8, textAlign:"center", fontSize:18, color:C.borde, cursor:"pointer", transition:"all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyan; e.currentTarget.style.color = C.cyan; e.currentTarget.style.background = C.cyanLight; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.borde; e.currentTarget.style.color = C.borde; e.currentTarget.style.background = "transparent"; }}>
                  +
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const birthdayMatchesDate = (birthday, isoDate) => Boolean(birthday && isoDate && birthday.slice(5, 10) === isoDate.slice(5, 10));
const blockIcon = (block) => block?.tipo === "habitacion" ? "🛏️" : block?.tipo === "coche" ? "🚗" : "📍";
const blockLabel = (block, t, fallback) => block?.recursoNombre || block?.nota || (block?.tipo === "habitacion" ? t("Room") : block?.tipo === "coche" ? t("Car") : fallback || t("Availability"));
const blockColor = (block) => block?.tipo === "habitacion" ? C.sageDark : block?.tipo === "coche" ? C.brandTertiary : C.brandPrimary;
const blockBg = (block) => block?.tipo === "habitacion" ? C.exitoBg : block?.tipo === "coche" ? C.brandTertiaryFixed : C.brandPrimaryFixed;
