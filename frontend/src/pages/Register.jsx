import { useState } from "react";
import { registrarFinca } from "../api";
import { GRAD } from "../shared";

const paises = {
 "Colombia": ["Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada"],
  "Venezuela": ["Apure", "Barinas", "Bolívar", "Guárico", "Monagas", "Portuguesa"],
  "México": ["Jalisco", "Veracruz", "Chiapas", "Oaxaca", "Guerrero", "Michoacán"],
  "Guatemala": ["Alta Verapaz", "Petén", "Izabal", "Escuintla", "Santa Rosa"],
  "Honduras": ["Olancho", "Choluteca", "El Paraíso", "Comayagua", "Yoro"],
  "Nicaragua": ["Chontales", "Boaco", "Matagalpa", "Jinotega", "Río San Juan"],
  "Costa Rica": ["Guanacaste", "Alajuela", "Puntarenas", "Limón", "San José"],
  "Panamá": ["Chiriquí", "Veraguas", "Los Santos", "Herrera", "Coclé"],
  "Brasil": ["Mato Grosso", "Minas Gerais", "Goiás", "Pará", "Bahia"],
  "Argentina": ["Buenos Aires", "Córdoba", "Santa Fe", "Entre Ríos", "Corrientes"],
  "Uruguay": ["Tacuarembó", "Rivera", "Artigas", "Salto", "Paysandú"],
  "Paraguay": ["Concepción", "San Pedro", "Caaguazú", "Caazapá", "Misiones"],
  "Bolivia": ["Beni", "Santa Cruz", "Cochabamba", "La Paz", "Tarija"],
  "Perú": ["Cajamarca", "Junín", "Puno", "Cusco", "Loreto"],
  "Ecuador": ["Manabí", "Guayas", "Los Ríos", "Esmeraldas", "Sucumbíos"],
  "Chile": ["Los Lagos", "La Araucanía", "Los Ríos", "Aysén", "Biobío"],
};

function Register({ onBack, onLogin }) {
  const [form, setForm] = useState({
    nombreFinca: "",
    nombre: "",
    apellido: "",
    celular: "",
    correo: "",
    pais: "",
    departamento: "",
    municipio: "",
    vereda: "",
    clave: "",
    confirmarClave: "",
  });

  const [error, setError] = useState("");
const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "pais") {
      setForm({ ...form, pais: value, departamento: "", municipio: "" });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const validarClave = (clave) => {
    const tieneLetras = /[a-zA-Z]/.test(clave);
    const tieneNumeros = /[0-9]/.test(clave);
    return clave.length >= 6 && tieneLetras && tieneNumeros;
  };

  const handleRegister = async () => {
    if (!form.nombreFinca || !form.nombre || !form.apellido || !form.celular ||
      !form.correo || !form.pais || !form.departamento || !form.municipio ||
      !form.vereda || !form.clave) {
      setError("Por favor completa todos los campos");
      return;
    }
    if (!validarClave(form.clave)) {
      setError("La clave debe tener al menos 6 caracteres con letras y números");
      return;
    }
    if (form.clave !== form.confirmarClave) {
      setError("Las claves no coinciden");
      return;
    }
    setCargando(true);
    setError("");
    try {
      const respuesta = await registrarFinca({
        nombre: form.nombreFinca,
        propietario: `${form.nombre} ${form.apellido}`,
        correo: form.correo,
        celular: form.celular,
        pais: form.pais,
        departamento: form.departamento,
        municipio: form.municipio,
        vereda: form.vereda,
        clave: form.clave,
      });
      if (respuesta.finca_id) {
        if (onLogin && respuesta.token) {
          onLogin({ nombreFinca: form.nombreFinca, finca_id: respuesta.finca_id, token: respuesta.token });
        } else {
          onBack();
        }
      } else {
        setError(respuesta.detail || "Error al registrar la finca");
      }
    } catch (e) {
      setError("Error al conectar con el servidor");
    }
    setCargando(false);
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-500 bg-white text-sm";

  return (
    <div className="min-h-screen relative flex items-center justify-center py-10"
      style={{
        backgroundImage: "url('https://images.pexels.com/photos/2280551/pexels-photo-2280551.jpeg?auto=compress&cs=tinysrgb&w=1600')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}>
      {/* Overlay oscuro sobre la imagen */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,61,35,0.82), rgba(22,101,52,0.75))" }} />

      <div className="relative z-10 w-full flex items-center justify-center px-4 py-10">
        <div className="bg-white bg-opacity-97 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

          {/* Header del formulario */}
          <div className="px-8 pt-8 pb-5 text-center border-b border-gray-100">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow mb-3" style={{ background: GRAD }}>
              <span className="text-2xl">🐄</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Registrar Nueva Finca</h1>
            <p className="text-gray-400 text-sm mt-1">Completa todos los campos para comenzar</p>
          </div>

          <div className="px-8 py-6">
            {error && (
              <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                ⚠️ {error}
              </div>
            )}

            <div className="space-y-3">
              <input name="nombreFinca" placeholder="Nombre de la Finca *" value={form.nombreFinca} onChange={handleChange} className={inputClass} />

              <div className="grid grid-cols-2 gap-3">
                <input name="nombre" placeholder="Nombre *" value={form.nombre} onChange={handleChange} className={inputClass} />
                <input name="apellido" placeholder="Apellido *" value={form.apellido} onChange={handleChange} className={inputClass} />
              </div>

              <input name="celular" placeholder="Número de Celular *" value={form.celular} onChange={handleChange} className={inputClass} />
              <input name="correo" type="email" placeholder="Correo Electrónico *" value={form.correo} onChange={handleChange} className={inputClass} />

              <select name="pais" value={form.pais} onChange={handleChange} className={inputClass}>
                <option value="">Selecciona tu País *</option>
                {Object.keys(paises).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>

              {form.pais && (
                <select name="departamento" value={form.departamento} onChange={handleChange} className={inputClass}>
                  <option value="">Departamento/Estado *</option>
                  {paises[form.pais].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              )}

              <div className="grid grid-cols-2 gap-3">
                <input name="municipio" placeholder="Municipio *" value={form.municipio} onChange={handleChange} className={inputClass} />
                <input name="vereda" placeholder="Vereda *" value={form.vereda} onChange={handleChange} className={inputClass} />
              </div>

              <input name="clave" type="password" placeholder="Clave (mín. 6 caracteres, letras y números) *" value={form.clave} onChange={handleChange} className={inputClass} />
              <input name="confirmarClave" type="password" placeholder="Confirmar Clave *" value={form.confirmarClave} onChange={handleChange} className={inputClass} />

              <button onClick={handleRegister} disabled={cargando} style={{ background: GRAD }}
                className="w-full text-white font-semibold py-3 rounded-xl transition duration-200 disabled:opacity-50 shadow-sm text-sm mt-1">
                {cargando ? "Registrando..." : "Crear mi Finca →"}
              </button>

              <button onClick={onBack}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium py-3 rounded-xl transition duration-200 text-sm border border-gray-200">
                ← Volver al Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;