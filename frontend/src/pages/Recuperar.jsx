import { useState } from "react";
import { pedirCodigoClave, restablecerClave } from "../api";
import { GRAD } from "../shared";

const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 bg-white text-sm";

// Recuperar la clave: 1) pedir un código al correo  2) escribir el código y la clave nueva
function Recuperar({ onBack, onLogin }) {
  const [paso, setPaso] = useState(1);
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [clave, setClave] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const pedirCodigo = async () => {
    if (!correo.trim()) { setError("Escribe el correo con el que registraste tu finca"); return; }
    setCargando(true); setError(""); setAviso("");
    try {
      const r = await pedirCodigoClave(correo.trim());
      setAviso(r?.mensaje || "Revisa tu correo");
      setPaso(2);
    } catch (e) { setError(e?.message || "No se pudo enviar el código"); }
    setCargando(false);
  };

  const guardar = async () => {
    if (!/^\d{6}$/.test(codigo.trim())) { setError("El código tiene 6 números"); return; }
    if (clave.length < 8 || !/[a-zA-Z]/.test(clave) || !/[0-9]/.test(clave)) { setError("La clave debe tener al menos 8 caracteres con letras y números"); return; }
    if (clave !== confirmar) { setError("Las claves no coinciden"); return; }
    setCargando(true); setError("");
    try {
      const r = await restablecerClave({ correo: correo.trim(), codigo: codigo.trim(), clave_nueva: clave });
      onLogin({ nombreFinca: r.nombre, finca_id: r.finca_id, token: r.token });
    } catch (e) { setError(e?.message || "No se pudo cambiar la clave"); }
    setCargando(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-10 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0b2545 0%, #13315c 45%, #1e40af 100%)" }}>
      <div className="absolute rounded-full pointer-events-none"
        style={{ width: 420, height: 420, top: -140, right: -120, background: "radial-gradient(circle, rgba(96,165,250,0.35), rgba(96,165,250,0) 70%)" }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />

      <div className="relative z-10 w-full flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="px-8 pt-8 pb-5 text-center border-b border-gray-100">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow mb-3" style={{ background: GRAD }}>
              <span className="text-2xl">🔑</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Recuperar clave</h1>
            <p className="text-sm text-gray-400 mt-1">
              {paso === 1 ? "Te enviaremos un código a tu correo" : "Escribe el código y tu clave nueva"}
            </p>
          </div>

          <div className="px-8 py-6 space-y-3">
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
            {aviso && paso === 2 && <p className="text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">{aviso}</p>}

            {paso === 1 ? (
              <>
                <input type="email" autoComplete="email" placeholder="Correo de tu finca" value={correo}
                  onChange={(e) => setCorreo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && pedirCodigo()} className={inputClass} />
                <button onClick={pedirCodigo} disabled={cargando} style={{ background: GRAD }}
                  className="w-full text-white font-semibold py-3 rounded-xl shadow text-sm disabled:opacity-60">
                  {cargando ? "Enviando..." : "Enviarme el código"}
                </button>
              </>
            ) : (
              <>
                <input inputMode="numeric" maxLength={6} placeholder="Código de 6 números" value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))} className={`${inputClass} tracking-widest text-center text-lg`} />
                <input type="password" autoComplete="new-password" placeholder="Clave nueva (mín. 8, letras y números)" value={clave}
                  onChange={(e) => setClave(e.target.value)} className={inputClass} />
                <input type="password" autoComplete="new-password" placeholder="Confirmar clave nueva" value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)} onKeyDown={(e) => e.key === "Enter" && guardar()} className={inputClass} />
                <button onClick={guardar} disabled={cargando} style={{ background: GRAD }}
                  className="w-full text-white font-semibold py-3 rounded-xl shadow text-sm disabled:opacity-60">
                  {cargando ? "Guardando..." : "Guardar clave nueva"}
                </button>
                <button onClick={pedirCodigo} disabled={cargando} className="w-full text-sm text-blue-600 hover:underline">
                  No me llegó, enviar otro código
                </button>
              </>
            )}

            <p className="text-xs text-gray-400 text-center pt-1">
              ¿No te llega el correo? Revisa la carpeta de spam o escríbele al administrador de AgroGanaderíaPro.
            </p>
            <button onClick={onBack} className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium py-3 rounded-xl text-sm transition">
              ← Volver al login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Recuperar;
