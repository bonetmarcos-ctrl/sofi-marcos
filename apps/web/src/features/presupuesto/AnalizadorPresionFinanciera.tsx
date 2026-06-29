import { C, cardN } from "../../constants/colores.ts";
import { COLOR_VIAJE, BG_VIAJE } from "../../constants/categorias.ts";
import { useBreakpoint } from "../../hooks/useBreakpoint.ts";
import { useI18n } from "../../i18n.tsx";
import { fmt } from "../../utils/format.ts";

const pct = (value, total) => total > 0 ? Math.round((value / total) * 100) : 0;
const clampPct = (value) => Math.max(0, Math.min(100, value));

export default function AnalizadorPresionFinanciera({ resumenMes, ingresosFijosResumen, mesVista, año }) {
  const { t, monthName } = useI18n();
  const { isMobile, isTablet } = useBreakpoint();

  const totalIncome = Number(resumenMes?.total_ingresos || 0);
  const fixedIncome = Number(ingresosFijosResumen || 0);
  const variableIncome = Number(resumenMes?.ingresos_var_total || 0);
  const structural = Number(resumenMes?.gasto_estructural || 0);
  const utilities = Number(resumenMes?.gasto_suministros || 0);
  const trips = Number(resumenMes?.gastos_viaje || 0);
  const lifestyle = Math.max(0, Number(resumenMes?.gasto_discrecional || 0) - trips);
  const committed = structural + utilities;
  const flexible = lifestyle + trips;
  const totalExpenses = Number(resumenMes?.total_gastos || committed + flexible);
  const balance = Number(resumenMes?.saldo ?? totalIncome - totalExpenses);
  const dropRoom = Math.max(0, balance);
  const dropPct = totalIncome > 0 ? Math.round((dropRoom / totalIncome) * 100) : 0;
  const pressure = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0;
  const fixedIncomeEssentialBalance = fixedIncome - committed;
  const fixedIncomeCurrentBalance = fixedIncome - totalExpenses;

  const layers = [
    { key:"structural", label:t("Structural"), amount:structural, color:"#64748b", bg:"#eef2f7" },
    { key:"utilities", label:t("Utilities"), amount:utilities, color:"#d97706", bg:"#fef3c7" },
    { key:"lifestyle", label:t("Variable expenses"), amount:lifestyle, color:C.lavender, bg:C.lavLight },
    { key:"trips", label:t("Trips"), amount:trips, color:COLOR_VIAJE, bg:BG_VIAJE },
  ];

  const scenarios = [
    { key:"current", label:t("Current income"), income:totalIncome },
    { key:"minus10", label:"-10%", income:totalIncome * 0.9 },
    { key:"minus20", label:"-20%", income:totalIncome * 0.8 },
    { key:"fixed", label:t("Only fixed income"), income:fixedIncome },
  ].filter((scenario, index, list) => index === list.findIndex(item => item.key === scenario.key));

  const scenarioStatus = (income) => {
    const scenarioBalance = income - totalExpenses;
    const scenarioPressure = income > 0 ? Math.round((totalExpenses / income) * 100) : 0;
    if (scenarioBalance >= 0) {
      return { label:t("Maintains current lifestyle"), detail:t("Surplus {amount}", { amount:fmt(scenarioBalance) }), color:C.sageDark, bg:C.sageLight, pressure:scenarioPressure };
    }
    if (income >= committed) {
      return { label:t("Needs lifestyle adjustment"), detail:t("Cut {amount}", { amount:fmt(Math.abs(scenarioBalance)) }), color:C.warn, bg:C.warnBg, pressure:scenarioPressure };
    }
    return { label:t("Structural gap"), detail:t("Cut {amount}", { amount:fmt(committed - income) }), color:C.error, bg:C.errorBg, pressure:scenarioPressure };
  };

  const diagnosis = balance < 0
    ? t("Lifestyle needs a buffer")
    : dropPct >= 15
      ? t("Lifestyle is sustainable at current income")
      : t("Lifestyle is tight under lower income");
  const essentialDiagnosis = fixedIncomeEssentialBalance >= 0
    ? t("Fixed income covers essentials")
    : t("Fixed income does not cover essentials");

  const mainColumns = isMobile ? "1fr" : "minmax(0,1.05fr) minmax(320px,0.95fr)";
  const metricColumns = isMobile ? "1fr" : isTablet ? "repeat(2,minmax(0,1fr))" : "repeat(3,minmax(0,1fr))";

  return (
    <div style={cardN(isMobile ? { padding:"14px 12px" } : undefined)}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap",marginBottom:16 }}>
        <div>
          <div style={{ fontSize:16,fontWeight:700,color:C.txt }}>{t("Financial pressure analyzer")}</div>
          <div style={{ fontSize:12,color:C.txt2,marginTop:2 }}>{t("Committed structure · income stress test")} · {monthName(mesVista)} {año}</div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:8,background:pressure > 95 ? C.errorBg : pressure > 80 ? C.warnBg : C.sageLight,border:`1px solid ${pressure > 95 ? C.error : pressure > 80 ? C.warn : C.sage}44`,borderRadius:999,padding:"6px 10px" }}>
          <span style={{ fontSize:11,fontWeight:800,color:pressure > 95 ? C.error : pressure > 80 ? "#b45309" : C.sageDark }}>{pressure}%</span>
          <span style={{ fontSize:11,color:C.txt2 }}>{t("Financial pressure")}</span>
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:metricColumns,gap:10,marginBottom:16 }}>
        {[
          { label:t("Committed spending"), value:fmt(committed), sub:`${pct(committed, totalExpenses)}% ${t("of spending")}`, color:"#64748b" },
          { label:t("Minimum income for current lifestyle"), value:fmt(totalExpenses), sub:t("all monthly spending"), color:C.lavender },
          { label:t("Income drop room"), value:fmt(dropRoom), sub:`${dropPct}% ${t("before deficit")}`, color:dropRoom > 0 ? C.sageDark : C.error },
        ].map(metric => (
          <div key={metric.label} style={{ background:C.fondo,borderRadius:12,padding:"12px 14px",border:`1px solid ${C.borde}`,minWidth:0 }}>
            <div style={{ fontSize:10,fontWeight:800,color:C.txt2,textTransform:"uppercase",letterSpacing:"0.6px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{metric.label}</div>
            <div style={{ fontSize:22,fontWeight:800,color:metric.color,fontFamily:"'Playfair Display',serif",marginTop:5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{metric.value}</div>
            <div style={{ fontSize:11,color:C.txt2,marginTop:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{metric.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid",gridTemplateColumns:mainColumns,gap:16,alignItems:"start" }}>
        <div style={{ minWidth:0 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:8 }}>
            <div style={{ fontSize:12,fontWeight:800,color:C.txt,textTransform:"uppercase",letterSpacing:"0.5px" }}>{t("Expense commitment")}</div>
            <div style={{ fontSize:12,color:C.txt2 }}>{fmt(totalExpenses)}</div>
          </div>
          <div style={{ display:"flex",height:18,borderRadius:999,overflow:"hidden",background:C.borde,marginBottom:12 }}>
            {layers.map(layer => layer.amount > 0 && (
              <div key={layer.key} title={`${layer.label} · ${fmt(layer.amount)}`} style={{ width:`${clampPct(pct(layer.amount, totalExpenses))}%`,background:layer.color,minWidth:layer.amount > 0 ? 4 : 0 }}/>
            ))}
          </div>
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,minmax(0,1fr))",gap:8 }}>
            {layers.map(layer => (
              <div key={layer.key} style={{ display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",background:layer.bg,border:`1px solid ${layer.color}33`,borderRadius:10,padding:"9px 10px",minWidth:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:7,minWidth:0 }}>
                  <span style={{ width:9,height:9,borderRadius:3,background:layer.color,flexShrink:0 }}/>
                  <span style={{ fontSize:12,fontWeight:700,color:layer.color,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{layer.label}</span>
                </div>
                <div style={{ textAlign:"right",flexShrink:0 }}>
                  <div style={{ fontSize:12,fontWeight:800,color:layer.color }}>{fmt(layer.amount)}</div>
                  <div style={{ fontSize:10,color:C.txt2 }}>{pct(layer.amount, totalExpenses)}%</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8,marginTop:12 }}>
            <div style={{ borderRadius:10,padding:"10px 12px",background:fixedIncomeEssentialBalance >= 0 ? C.sageLight : C.errorBg,border:`1px solid ${fixedIncomeEssentialBalance >= 0 ? C.sage : C.error}44` }}>
              <div style={{ fontSize:11,fontWeight:800,color:fixedIncomeEssentialBalance >= 0 ? C.sageDark : C.error }}>{essentialDiagnosis}</div>
              <div style={{ fontSize:11,color:C.txt2,marginTop:3 }}>{t("Minimum income for essentials")}: {fmt(committed)}</div>
            </div>
            <div style={{ borderRadius:10,padding:"10px 12px",background:balance >= 0 ? C.sageLight : C.warnBg,border:`1px solid ${balance >= 0 ? C.sage : C.warn}44` }}>
              <div style={{ fontSize:11,fontWeight:800,color:balance >= 0 ? C.sageDark : "#b45309" }}>{diagnosis}</div>
              <div style={{ fontSize:11,color:C.txt2,marginTop:3 }}>{t("Balance")}: {fmt(balance)}</div>
            </div>
          </div>
        </div>

        <div style={{ background:C.fondo,border:`1px solid ${C.borde}`,borderRadius:12,padding:14,minWidth:0 }}>
          <div style={{ fontSize:12,fontWeight:800,color:C.txt,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10 }}>{t("Stress test with lower income")}</div>
          <div style={{ display:"grid",gap:8 }}>
            {scenarios.map(scenario => {
              const status = scenarioStatus(scenario.income);
              return (
                <div key={scenario.key} style={{ display:"grid",gridTemplateColumns:"minmax(88px,0.8fr) minmax(82px,0.75fr) minmax(0,1.25fr)",gap:8,alignItems:"center",background:"white",border:`1px solid ${C.borde}`,borderRadius:10,padding:"8px 10px",minWidth:0 }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:12,fontWeight:800,color:C.txt,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{scenario.label}</div>
                    <div style={{ fontSize:10,color:C.txt2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{fmt(scenario.income)}</div>
                  </div>
                  <div style={{ textAlign:"right",fontSize:12,fontWeight:800,color:status.pressure > 100 ? C.error : status.pressure > 90 ? "#b45309" : C.sageDark }}>{status.pressure}%</div>
                  <div style={{ justifySelf:"stretch",background:status.bg,border:`1px solid ${status.color}33`,borderRadius:9,padding:"6px 8px",minWidth:0 }}>
                    <div style={{ fontSize:11,fontWeight:800,color:status.color,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{status.label}</div>
                    <div style={{ fontSize:10,color:C.txt2,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{status.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop:10,fontSize:11,color:C.txt2,lineHeight:1.45 }}>
            {t("Fixed-only balance")}: <strong style={{ color:fixedIncomeCurrentBalance >= 0 ? C.sageDark : C.error }}>{fmt(fixedIncomeCurrentBalance)}</strong> · {t("Variable income")}: {fmt(variableIncome)}
          </div>
        </div>
      </div>
    </div>
  );
}