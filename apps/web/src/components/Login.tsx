import { useState } from "react";
import { C } from "../constants/colores.ts";
import { useI18n } from "../i18n.tsx";

export const Login = ({ error, loading, onLogin, onRegister, onError }) => {
  const { language, languages, setLanguage, t } = useI18n();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isRegistering = mode === "register";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const submit = isRegistering ? onRegister : onLogin;
      await submit({ username: username.trim(), password });
    } catch (loginError) {
      onError(loginError.message || (isRegistering ? t("Could not create the account") : t("Could not log in")));
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    onError("");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Lato:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        html { min-width: 320px; }
        body { background:${C.fondo}; font-family:'Lato',sans-serif; color:${C.txt}; overflow-x:hidden; }
      `}</style>
      <main style={{ minHeight:"100vh", display:"grid", placeItems:"center", padding:"24px 14px", background:C.fondo }}>
        <form onSubmit={handleSubmit} style={{ width:"100%", maxWidth:390, background:"white", border:`1px solid ${C.borde}`, borderRadius:8, padding:"26px 22px", boxShadow:"0 16px 40px rgba(17,20,24,0.08)" }}>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14 }}>
            <select aria-label={t("Language")} value={language} onChange={(event) => setLanguage(event.target.value as typeof language)} style={{ border:`1px solid ${C.borde}`, borderRadius:8, background:C.fondo, color:C.txt, padding:"7px 10px", fontSize:12, fontWeight:800, fontFamily:"'Lato',sans-serif", cursor:"pointer" }}>
              {languages.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:22 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:`linear-gradient(135deg,${C.cyan},${C.lavender})`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:800 }}>S</div>
            <div>
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:25, lineHeight:1.05, color:C.txt }}>Sofi & Marqui</h1>
              <p style={{ color:C.muted, fontSize:13, marginTop:3 }}>{isRegistering ? t("Create account") : t("Private access")}</p>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, background:C.fondo, border:`1px solid ${C.borde}`, borderRadius:8, padding:4, marginBottom:16 }}>
            <button type="button" aria-label={t("Login")} onClick={() => switchMode("login")} disabled={loading || submitting} style={{ border:"none", borderRadius:6, background:!isRegistering ? "white" : "transparent", color:C.txt, padding:"8px 10px", fontWeight:800, cursor:loading || submitting ? "default" : "pointer" }}>
              {t("Login")}
            </button>
            <button type="button" aria-label={t("Create account")} onClick={() => switchMode("register")} disabled={loading || submitting} style={{ border:"none", borderRadius:6, background:isRegistering ? "white" : "transparent", color:C.txt, padding:"8px 10px", fontWeight:800, cursor:loading || submitting ? "default" : "pointer" }}>
              {t("Create account")}
            </button>
          </div>

          <label style={{ display:"grid", gap:7, fontSize:13, fontWeight:700, color:C.txt, marginBottom:14 }}>
            {t("Username")}
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" disabled={loading || submitting} required style={{ width:"100%", border:`1px solid ${C.borde}`, borderRadius:8, padding:"11px 12px", font:"inherit", minWidth:0 }} />
          </label>

          <label style={{ display:"grid", gap:7, fontSize:13, fontWeight:700, color:C.txt, marginBottom:16 }}>
            {t("Password")}
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={isRegistering ? "new-password" : "current-password"} minLength={isRegistering ? 6 : undefined} disabled={loading || submitting} required style={{ width:"100%", border:`1px solid ${C.borde}`, borderRadius:8, padding:"11px 12px", font:"inherit", minWidth:0 }} />
          </label>

          {error && <p role="alert" style={{ color:C.error, fontSize:13, marginBottom:14 }}>{error}</p>}

          <button type="submit" disabled={loading || submitting} style={{ width:"100%", border:"none", borderRadius:8, background:C.cyan, color:"white", padding:"11px 14px", fontWeight:800, cursor:loading || submitting ? "default" : "pointer", opacity:loading || submitting ? 0.65 : 1 }}>
            {submitting ? (isRegistering ? t("Creating...") : t("Logging in...")) : (isRegistering ? t("Create account") : t("Login"))}
          </button>
        </form>
      </main>
    </>
  );
};