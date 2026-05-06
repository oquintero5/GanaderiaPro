import { useState } from "react";
import { registrarFinca } from "../api";

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

function Register({ onBack }) {
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
        alert("¡Finca registrada exitosamente! Ya puedes iniciar sesión.");
        onBack();
      } else {
        setError(respuesta.detail || "Error al registrar la finca");
      }
    } catch (e) {
      setError("Error al conectar con el servidor");
    }
    setCargando(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-10"
      style={{
        background: "linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 70%, #4ade80 100%)",
      }}
    >
      <div className="w-full flex items-center justify-center py-10">
        <div className="bg-white bg-opacity-95 rounded-2xl shadow-2xl p-10 w-full max-w-lg">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-red-800">🐄 Registrar Nueva Finca</h1>
            <p className="text-gray-500 mt-2">Completa todos los campos para registrarte</p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <input name="nombreFinca" placeholder="Nombre de la Finca *" value={form.nombreFinca} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600" />

            <div className="grid grid-cols-2 gap-4">
              <input name="nombre" placeholder="Nombre *" value={form.nombre} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600" />
              <input name="apellido" placeholder="Apellido *" value={form.apellido} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600" />
            </div>

            <input name="celular" placeholder="Número de Celular *" value={form.celular} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600" />

            <input name="correo" type="email" placeholder="Correo Electrónico *" value={form.correo} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600" />

            <select name="pais" value={form.pais} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600">
              <option value="">Selecciona tu País *</option>
              {Object.keys(paises).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {form.pais && (
              <select name="departamento" value={form.departamento} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600">
                <option value="">Selecciona Departamento/Estado *</option>
                {paises[form.pais].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}

            <input name="municipio" placeholder="Municipio *" value={form.municipio} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600" />

            <input name="vereda" placeholder="Vereda *" value={form.vereda} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600" />

            <input name="clave" type="password" placeholder="Crear Clave (mínimo 6 caracteres, letras y números) *"
              value={form.clave} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600" />

            <input name="confirmarClave" type="password" placeholder="Confirmar Clave *"
              value={form.confirmarClave} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600" />

            <button onClick={handleRegister} disabled={cargando}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-lg transition duration-200 disabled:opacity-50">
                 {cargando ? "Registrando..." : "Registrar Finca"}
             </button>

            <button onClick={onBack}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-lg transition duration-200">
              Volver al Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;