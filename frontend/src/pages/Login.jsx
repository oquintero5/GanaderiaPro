import { useState } from "react";
import { loginFinca } from "../api";

function Login({ onRegister, onLogin }) {
  const [nombreFinca, setNombreFinca] = useState("");
  const [clave, setClave] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!nombreFinca || !clave) {
      setError("Por favor ingresa el nombre de la finca y la clave");
      return;
    }
    setCargando(true);
    setError("");
    try {
      const respuesta = await loginFinca({ nombre: nombreFinca, clave });
      if (respuesta.finca_id) {
        onLogin({ nombreFinca: respuesta.nombre, finca_id: respuesta.finca_id });
      } else {
        setError(respuesta.detail || "Nombre de finca o clave incorrectos");
      }
    } catch (e) {
      setError("Error al conectar con el servidor");
    }
    setCargando(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 70%, #4ade80 100%)",
      }}
    >
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="bg-white bg-opacity-95 rounded-2xl shadow-2xl p-10 w-full max-w-md">
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-green-700">🐄 AgroGanaderíaPro</h1>
            <p className="text-gray-500 mt-2">Gestión integral para tu finca</p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Nombre de la Finca
              </label>
              <input
                type="text"
                placeholder="Ej: Finca La Esperanza"
                value={nombreFinca}
                onChange={(e) => setNombreFinca(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Clave de Acceso
              </label>
              <input
                type="password"
                placeholder="Ingresa tu clave"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={cargando}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition duration-200 disabled:opacity-50"
            >
              {cargando ? "Ingresando..." : "Ingresar"}
            </button>

            <div className="text-center mt-4">
              <p className="text-gray-500">¿Primera vez aquí?</p>
              <button
                onClick={onRegister}
                className="text-green-600 font-semibold hover:underline mt-1"
              >
                Registrar nueva finca
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;