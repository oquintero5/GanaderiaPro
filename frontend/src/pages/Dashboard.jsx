import { useState } from "react";

function Dashboard({ finca }) {
  const [animales, setAnimales] = useState([]);
  const [mostrarFormAnimal, setMostrarFormAnimal] = useState(false);
  const [vista, setVista] = useState("inicio");
  const [form, setForm] = useState({
    nombre: "",
    chapeta: "",
    edad: "",
    peso: "",
    sexo: "",
    raza: "",
    crias: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const agregarAnimal = () => {
    if (!form.nombre || !form.chapeta || !form.edad || !form.peso || !form.sexo || !form.raza) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }
    setAnimales([...animales, { ...form, id: Date.now(), historialSalud: [] }]);
    setForm({ nombre: "", chapeta: "", edad: "", peso: "", sexo: "", raza: "", crias: "" });
    setMostrarFormAnimal(false);
    alert("¡Animal registrado exitosamente!");
  };

  const machos = animales.filter((a) => a.sexo === "Macho").length;
  const hembras = animales.filter((a) => a.sexo === "Hembra").length;

  return (
    <div className="min-h-screen bg-gray-100">
      
      {/* Header */}
      <div className="bg-green-700 text-white py-6 px-8 shadow-lg">
        <h1 className="text-4xl font-bold text-center">🐄 {finca?.nombreFinca || "Mi Finca"}</h1>
        <p className="text-center text-green-200 mt-1">AgroGanaderíaPro</p>
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-center gap-4 py-6 px-8">
        <button onClick={() => setVista("inicio")}
          className={`px-6 py-3 rounded-lg font-bold transition duration-200 ${vista === "inicio" ? "bg-green-600 text-white" : "bg-white text-green-600 border border-green-600"}`}>
          🐄 Ganado
        </button>
        <button onClick={() => setVista("insumos")}
          className={`px-6 py-3 rounded-lg font-bold transition duration-200 ${vista === "insumos" ? "bg-green-600 text-white" : "bg-white text-green-600 border border-green-600"}`}>
          🌱 Insumos
        </button>
        <button onClick={() => setVista("finanzas")}
          className={`px-6 py-3 rounded-lg font-bold transition duration-200 ${vista === "finanzas" ? "bg-green-600 text-white" : "bg-white text-green-600 border border-green-600"}`}>
          💰 Finanzas
        </button>
      </div>

      {/* Vista Ganado */}
      {vista === "inicio" && (
        <div className="px-8">
          
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <p className="text-gray-500 text-sm">Total Animales</p>
              <p className="text-4xl font-bold text-green-700">{animales.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <p className="text-gray-500 text-sm">Machos</p>
              <p className="text-4xl font-bold text-blue-600">{machos}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <p className="text-gray-500 text-sm">Hembras</p>
              <p className="text-4xl font-bold text-pink-600">{hembras}</p>
            </div>
          </div>

          {/* Botón agregar animal */}
          <div className="text-center mb-6">
            <button onClick={() => setMostrarFormAnimal(!mostrarFormAnimal)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg transition duration-200">
              {mostrarFormAnimal ? "Cancelar" : "➕ Agregar Animal"}
            </button>
          </div>

          {/* Formulario agregar animal */}
          {mostrarFormAnimal && (
            <div className="bg-white rounded-xl shadow p-6 mb-6 max-w-lg mx-auto">
              <h2 className="text-xl font-bold text-green-700 mb-4">Registrar Nuevo Animal</h2>
              <div className="space-y-3">
                <input name="nombre" placeholder="Nombre del animal *" value={form.nombre} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                <input name="chapeta" placeholder="ID / Chapeta *" value={form.chapeta} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                <input name="edad" placeholder="Edad (años) *" value={form.edad} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                <input name="peso" placeholder="Peso en kg *" value={form.peso} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                <select name="sexo" value={form.sexo} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500">
                  <option value="">Selecciona Sexo *</option>
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
                <input name="raza" placeholder="Raza *" value={form.raza} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                {form.sexo === "Hembra" && (
                  <input name="crias" placeholder="Número de crías que ha tenido" value={form.crias} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500" />
                )}
                <button onClick={agregarAnimal}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition duration-200">
                  Guardar Animal
                </button>
              </div>
            </div>
          )}

          {/* Lista de animales */}
          {animales.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              <p className="text-6xl">🐄</p>
              <p className="text-xl mt-4">No hay animales registrados aún</p>
              <p className="text-sm mt-2">Haz clic en "Agregar Animal" para comenzar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {animales.map((animal) => (
                <div key={animal.id} className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition duration-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-green-700">{animal.nombre}</h3>
                      <p className="text-gray-500 text-sm">Chapeta: {animal.chapeta}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${animal.sexo === "Macho" ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"}`}>
                      {animal.sexo}
                    </span>
                  </div>
                  <div className="mt-4 space-y-1 text-sm text-gray-600">
                    <p>🎂 Edad: {animal.edad} años</p>
                    <p>⚖️ Peso: {animal.peso} kg</p>
                    <p>🐮 Raza: {animal.raza}</p>
                    {animal.sexo === "Hembra" && <p>🍼 Crías: {animal.crias || 0}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vista Insumos */}
      {vista === "insumos" && (
        <div className="px-8 text-center">
          <div className="bg-white rounded-xl shadow p-10 max-w-lg mx-auto">
            <p className="text-6xl">🌱</p>
            <h2 className="text-2xl font-bold text-green-700 mt-4">Módulo de Insumos</h2>
            <p className="text-gray-500 mt-2">Próximamente disponible</p>
          </div>
        </div>
      )}

      {/* Vista Finanzas */}
      {vista === "finanzas" && (
        <div className="px-8 text-center">
          <div className="bg-white rounded-xl shadow p-10 max-w-lg mx-auto">
            <p className="text-6xl">💰</p>
            <h2 className="text-2xl font-bold text-green-700 mt-4">Módulo de Finanzas</h2>
            <p className="text-gray-500 mt-2">Próximamente disponible</p>
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;