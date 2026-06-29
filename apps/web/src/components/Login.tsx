import { useState } from "react";
import { DEFAULT_APP_NAME } from "@sofi-marqui/domain";
import { C } from "../constants/colores.ts";
import { useI18n } from "../i18n.tsx";

const pillarKeys = [
  { title:"Iter pillar dreams", copy:"Iter pillar dreams copy" },
  { title:"Iter pillar projects", copy:"Iter pillar projects copy" },
  { title:"Iter pillar time", copy:"Iter pillar time copy" },
  { title:"Iter pillar resources", copy:"Iter pillar resources copy" },
];

export const Login = ({ error, loading, onLogin, onRegister, onError }) => {
  const { language, languages, setLanguage, t } = useI18n();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [appName, setAppName] = useState(DEFAULT_APP_NAME);
  const [submitting, setSubmitting] = useState(false);

  const isRegistering = mode === "register";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const submit = isRegistering ? onRegister : onLogin;
      await submit({ username: username.trim(), password, ...(isRegistering ? { appName: appName.trim() } : {}) });
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

  const disabled = loading || submitting;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@650;700&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        html { min-width: 320px; }
        body { background:${C.fondo}; font-family:'Inter',sans-serif; color:${C.txt}; overflow-x:hidden; }
        button, input, select { font: inherit; }
        .iter-login-shell {
          min-height:100vh;
          display:grid;
          grid-template-columns:minmax(0, 1.05fr) minmax(360px, 460px);
          gap:clamp(28px, 5vw, 70px);
          align-items:center;
          padding:clamp(24px, 5vw, 64px);
          background:${C.fondo};
        }
        .iter-login-hero {
          max-width:760px;
          display:grid;
          gap:26px;
        }
        .iter-brand-row {
          display:flex;
          align-items:center;
          gap:14px;
          min-width:0;
        }
        .iter-mark {
          width:44px;
          height:44px;
          border-radius:8px;
          background:${C.txt};
          color:${C.fondo};
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight:800;
          font-size:22px;
          line-height:1;
          box-shadow:0 14px 28px rgba(31,36,33,0.16);
          flex:0 0 auto;
        }
        .iter-brand-name {
          font-weight:800;
          font-size:16px;
          letter-spacing:0;
        }
        .iter-tagline {
          margin-top:3px;
          color:${C.muted};
          font-size:13px;
          font-weight:600;
        }
        .iter-login-title {
          max-width:680px;
          font-family:'Playfair Display',serif;
          font-size:clamp(44px, 6.2vw, 84px);
          line-height:0.96;
          letter-spacing:0;
          color:${C.txt};
        }
        .iter-login-copy {
          max-width:640px;
          color:${C.txt2};
          font-size:clamp(17px, 2vw, 21px);
          line-height:1.55;
        }
        .iter-principle {
          width:min(100%, 610px);
          border-left:4px solid ${C.cyan};
          padding:14px 18px;
          color:${C.txt};
          background:rgba(255,255,255,0.58);
          font-size:15px;
          font-weight:700;
          line-height:1.5;
        }
        .iter-pillar-grid {
          display:grid;
          grid-template-columns:repeat(4, minmax(0, 1fr));
          gap:10px;
          width:min(100%, 720px);
        }
        .iter-pillar {
          min-width:0;
          min-height:118px;
          display:flex;
          flex-direction:column;
          gap:8px;
          justify-content:space-between;
          background:${C.superficie};
          border:1px solid ${C.borde};
          border-radius:8px;
          padding:14px;
          box-shadow:0 10px 24px rgba(31,36,33,0.05);
        }
        .iter-pillar-title {
          color:${C.txt};
          font-size:13px;
          font-weight:800;
        }
        .iter-pillar-copy {
          color:${C.muted};
          font-size:12px;
          line-height:1.42;
        }
        .iter-auth-wrap {
          width:100%;
          max-width:460px;
          justify-self:end;
        }
        .iter-auth-card {
          width:100%;
          background:${C.superficie};
          border:1px solid ${C.borde};
          border-radius:8px;
          padding:24px;
          box-shadow:0 24px 70px rgba(31,36,33,0.12);
        }
        .iter-auth-top {
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:16px;
          margin-bottom:20px;
        }
        .iter-auth-eyebrow {
          color:${C.muted};
          font-size:12px;
          font-weight:800;
          text-transform:uppercase;
          letter-spacing:0.08em;
        }
        .iter-auth-title {
          margin-top:7px;
          color:${C.txt};
          font-size:24px;
          line-height:1.18;
          font-weight:800;
        }
        .iter-language-select {
          border:1px solid ${C.borde};
          border-radius:8px;
          background:${C.fondo};
          color:${C.txt};
          padding:8px 10px;
          font-size:12px;
          font-weight:800;
          cursor:pointer;
          flex:0 0 auto;
        }
        .iter-mode-switch {
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:4px;
          background:${C.fondo};
          border:1px solid ${C.borde};
          border-radius:8px;
          padding:4px;
          margin-bottom:18px;
        }
        .iter-mode-switch button {
          border:none;
          border-radius:6px;
          padding:9px 10px;
          color:${C.txt};
          font-weight:800;
          cursor:pointer;
          background:transparent;
        }
        .iter-mode-switch button[aria-pressed="true"] {
          background:${C.superficie};
          box-shadow:0 1px 4px rgba(31,36,33,0.08);
        }
        .iter-mode-switch button:disabled,
        .iter-submit:disabled {
          cursor:default;
        }
        .iter-field {
          display:grid;
          gap:7px;
          margin-bottom:14px;
          color:${C.txt};
          font-size:13px;
          font-weight:700;
        }
        .iter-field input {
          width:100%;
          min-width:0;
          border:1px solid ${C.borde};
          border-radius:8px;
          background:${C.fondo};
          color:${C.txt};
          padding:12px 13px;
          outline:none;
        }
        .iter-field input:focus {
          border-color:${C.cyan};
          box-shadow:0 0 0 3px ${C.cyanLight};
          background:${C.superficie};
        }
        .iter-field input:disabled,
        .iter-language-select:disabled {
          opacity:0.68;
          cursor:default;
        }
        .iter-error {
          color:${C.error};
          background:${C.errorBg};
          border:1px solid rgba(184,93,75,0.18);
          border-radius:8px;
          padding:10px 12px;
          font-size:13px;
          margin-bottom:14px;
        }
        .iter-submit {
          width:100%;
          border:none;
          border-radius:8px;
          background:${C.cyan};
          color:white;
          padding:12px 14px;
          font-weight:800;
          cursor:pointer;
          box-shadow:0 12px 26px rgba(47,111,94,0.22);
        }
        .iter-submit:disabled {
          opacity:0.65;
          box-shadow:none;
        }
        .iter-auth-note {
          margin-top:16px;
          color:${C.muted};
          font-size:12px;
          line-height:1.45;
        }
        @media (max-width: 920px) {
          .iter-login-shell {
            grid-template-columns:1fr;
            align-items:start;
            padding:28px 16px 36px;
          }
          .iter-auth-wrap {
            justify-self:stretch;
            max-width:none;
          }
          .iter-pillar-grid {
            grid-template-columns:repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 560px) {
          .iter-login-hero {
            gap:20px;
          }
          .iter-login-title {
            font-size:42px;
          }
          .iter-login-copy {
            font-size:16px;
          }
          .iter-pillar-grid {
            grid-template-columns:1fr;
          }
          .iter-pillar {
            min-height:auto;
          }
          .iter-auth-card {
            padding:20px;
          }
          .iter-auth-top {
            flex-direction:column-reverse;
            align-items:stretch;
          }
          .iter-language-select {
            width:100%;
          }
        }
      `}</style>
      <main className="iter-login-shell">
        <section className="iter-login-hero" aria-labelledby="iter-login-title">
          <div className="iter-brand-row">
            <div className="iter-mark" aria-hidden="true">I</div>
            <div>
              <div className="iter-brand-name">Iter</div>
              <p className="iter-tagline">navigate your becoming</p>
            </div>
          </div>

          <div>
            <h1 id="iter-login-title" className="iter-login-title">{t("Iter login headline")}</h1>
            <p className="iter-login-copy">{t("Iter login copy")}</p>
          </div>

          <p className="iter-principle">{t("Iter product principle")}</p>

          <div className="iter-pillar-grid" role="list" aria-label={t("Iter pillars label")}>
            {pillarKeys.map((pillar) => (
              <div className="iter-pillar" role="listitem" key={pillar.title}>
                <p className="iter-pillar-title">{t(pillar.title)}</p>
                <p className="iter-pillar-copy">{t(pillar.copy)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="iter-auth-wrap" aria-label={t("Access your Iter space")}>
          <form className="iter-auth-card" onSubmit={handleSubmit}>
            <div className="iter-auth-top">
              <div>
                <p className="iter-auth-eyebrow">{isRegistering ? t("Start a shared space") : t("Private access")}</p>
                <h2 className="iter-auth-title">{t("Access your Iter space")}</h2>
              </div>
              <select className="iter-language-select" aria-label={t("Language")} value={language} onChange={(event) => setLanguage(event.target.value as typeof language)} disabled={disabled}>
                {languages.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
              </select>
            </div>

            <div className="iter-mode-switch">
              <button type="button" aria-label={t("Login")} aria-pressed={!isRegistering} onClick={() => switchMode("login")} disabled={disabled}>
              {t("Login")}
              </button>
              <button type="button" aria-label={t("Create account")} aria-pressed={isRegistering} onClick={() => switchMode("register")} disabled={disabled}>
              {t("Create account")}
              </button>
            </div>

            <label className="iter-field">
              {t("Username")}
              <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" disabled={disabled} required />
            </label>

            {isRegistering && (
              <label className="iter-field">
                {t("Application name")}
                <input value={appName} onChange={(event) => setAppName(event.target.value)} autoComplete="organization" maxLength={80} disabled={disabled} required />
              </label>
            )}

            <label className="iter-field">
              {t("Password")}
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={isRegistering ? "new-password" : "current-password"} minLength={isRegistering ? 6 : undefined} disabled={disabled} required />
            </label>

            {error && <p className="iter-error" role="alert">{error}</p>}

            <button className="iter-submit" type="submit" disabled={disabled}>
              {submitting ? (isRegistering ? t("Creating...") : t("Logging in...")) : (isRegistering ? t("Create account") : t("Login"))}
            </button>

            <p className="iter-auth-note">{t("Iter auth note")}</p>
          </form>
        </section>
      </main>
    </>
  );
};