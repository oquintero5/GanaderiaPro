import { useState } from "react";
import { loginFinca } from "../api";

function Login({ onRegister, onLogin }) {
  const [nombreFinca, setNombreFinca] = useState("");
  const [clave, setClave] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!nombreFinca || !clave) {
      setError("Por favor ingresa el nombre de la finca y la clave");
      return;
    }
    setCargando(true);
    setError("");

    const timeoutId = setTimeout(() => {
      setCargando(false);
      setError("La conexión tardó demasiado. Verifica tu internet e intenta de nuevo.");
    }, 15000);

    try {
      const respuesta = await loginFinca({ nombre: nombreFinca, clave });
      clearTimeout(timeoutId);
      if (respuesta.finca_id) {
        onLogin({ nombreFinca: respuesta.nombre, finca_id: respuesta.finca_id, token: respuesta.token });
      } else {
        setError(respuesta.detail || "Nombre de finca o clave incorrectos");
      }
    } catch (e) {
      clearTimeout(timeoutId);
      setError("Error al conectar con el servidor. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #0f1a0e;
          overflow: hidden;
          position: relative;
        }

        /* Left panel - visual */
        .login-left {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 48px;
          overflow: hidden;
        }

        .login-left-bg {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(160deg, rgba(15,26,14,0) 30%, rgba(15,26,14,0.85) 100%),
            url('https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=900&q=80') center/cover no-repeat;
        }

        .login-left-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, rgba(15,26,14,0.1), rgba(15,26,14,0.6));
        }

        .login-left-content {
          position: relative;
          z-index: 2;
        }

        .login-tagline {
          font-family: 'Playfair Display', serif;
          font-size: 42px;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          margin-bottom: 16px;
          text-shadow: 0 2px 20px rgba(0,0,0,0.4);
        }

        .login-tagline span {
          color: #fcd34d;
        }

        .login-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.7);
          font-weight: 300;
          letter-spacing: 0.3px;
          max-width: 360px;
          line-height: 1.6;
        }

        .login-badges {
          display: flex;
          gap: 12px;
          margin-top: 32px;
          flex-wrap: wrap;
        }

        .login-badge {
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 100px;
          padding: 8px 16px;
          font-size: 12px;
          color: rgba(255,255,255,0.9);
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        /* Right panel - form */
        .login-right {
          width: 480px;
          background: #fafaf7;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 64px 56px;
          position: relative;
          box-shadow: -20px 0 60px rgba(0,0,0,0.3);
        }

        .login-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 48px;
        }

        .login-logo-icon {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, #92400e, #b45309);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          box-shadow: 0 4px 16px rgba(155,35,53,0.35);
        }

        .login-logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 600;
          color: #78350f;
          letter-spacing: -0.3px;
        }

        .login-title {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .login-subtitle {
          font-size: 14px;
          color: #888;
          margin-bottom: 40px;
          font-weight: 300;
        }

        .login-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-left: 3px solid #ef4444;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .login-field {
          margin-bottom: 20px;
        }

        .login-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #555;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .login-input-wrap {
          position: relative;
        }

        .login-input {
          width: 100%;
          padding: 14px 16px;
          border: 1.5px solid #e5e5e0;
          border-radius: 10px;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          background: #fff;
          color: #1a1a1a;
          transition: all 0.2s ease;
          outline: none;
          appearance: none;
        }

        .login-input:focus {
          border-color: #92400e;
          box-shadow: 0 0 0 3px rgba(155,35,53,0.1);
        }

        .login-input::placeholder {
          color: #bbb;
          font-weight: 300;
        }

        .toggle-pw {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #999;
          font-size: 16px;
          padding: 4px;
          line-height: 1;
          transition: color 0.2s;
        }

        .toggle-pw:hover { color: #92400e; }

        .login-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #92400e, #b45309);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          margin-top: 8px;
          transition: all 0.2s ease;
          letter-spacing: 0.3px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(155,35,53,0.35);
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(155,35,53,0.45);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-btn-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 28px 0;
        }

        .login-divider-line {
          flex: 1;
          height: 1px;
          background: #e5e5e0;
        }

        .login-divider-text {
          font-size: 12px;
          color: #bbb;
          white-space: nowrap;
        }

        .login-register-btn {
          width: 100%;
          padding: 14px;
          background: transparent;
          color: #92400e;
          border: 1.5px solid #fde68a;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.3px;
        }

        .login-register-btn:hover {
          background: #fffbeb;
          border-color: #fcd34d;
        }

        .login-footer {
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid #e5e5e0;
          font-size: 11px;
          color: #bbb;
          text-align: center;
          letter-spacing: 0.3px;
        }

        /* Decorative elements */
        .deco-circle {
          position: absolute;
          border-radius: 50%;
          opacity: 0.05;
          background: #92400e;
          pointer-events: none;
        }

        /* Mobile */
        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right {
            width: 100%;
            padding: 48px 28px;
          }
        }
      `}</style>

      <div className="login-root">
        {/* Left visual panel */}
        <div className="login-left">
          <div className="login-left-bg" />
          <div className="login-left-overlay" />
          <div className="login-left-content">
            <h1 className="login-tagline">
              Tu finca,<br />
              <span>inteligente</span><br />
              y conectada.
            </h1>
            <p className="login-sub">
              Gestiona tu ganado, controla tus finanzas y optimiza tu producción desde cualquier lugar.
            </p>
            <div className="login-badges">
              <span className="login-badge">🐄 Control de Ganado</span>
              <span className="login-badge">💰 Finanzas</span>
              <span className="login-badge">🥛 Lechería</span>
              <span className="login-badge">👷 Obreros</span>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="login-right">
          {/* Decorative circles */}
          <div className="deco-circle" style={{ width: 300, height: 300, top: -100, right: -100 }} />
          <div className="deco-circle" style={{ width: 200, height: 200, bottom: -60, left: -60 }} />

          <div className="login-logo">
            <div className="login-logo-icon">🐄</div>
            <div>
              <span className="login-logo-text">AgroGanaderíaPro</span>
              <p style={{ fontSize: 11, color: '#aaa', fontWeight: 300, letterSpacing: '0.5px', marginTop: 2 }}>by Oscar Ortiz</p>
            </div>
          </div>

          <h2 className="login-title">Bienvenido</h2>
          <p className="login-subtitle">Ingresa a tu finca para continuar</p>

          {error && (
            <div className="login-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="login-field">
            <label className="login-label">Nombre de la Finca</label>
            <div className="login-input-wrap">
              <input
                className="login-input"
                type="text"
                placeholder="Ej: Finca La Esperanza"
                value={nombreFinca}
                onChange={(e) => setNombreFinca(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                autoCapitalize="none"
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label">Clave de Acceso</label>
            <div className="login-input-wrap">
              <input
                className="login-input"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa tu clave"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                className="toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={cargando}
          >
            {cargando ? (
              <span className="login-btn-loading">
                <span className="spinner" />
                Ingresando...
              </span>
            ) : (
              "Ingresar a mi Finca"
            )}
          </button>

          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-text">¿Primera vez aquí?</span>
            <div className="login-divider-line" />
          </div>

          <button className="login-register-btn" onClick={onRegister}>
            ➕ Registrar nueva finca
          </button>

          <div className="login-footer">
            AgroGanaderíaPro · Gestión integral ganadera
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
