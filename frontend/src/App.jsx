import { useState, useEffect, useCallback } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Recuperar from "./pages/Recuperar";
import Dashboard from "./pages/Dashboard";
import { ToastContainer } from "./ToastContainer";
import { setToken, clearToken, alExpirarSesion } from "./api";
import { toast } from "./toast";

const CLAVE_SESION = "agroganaderiapro_sesion";

// Lee la fecha de vencimiento (exp) del JWT sin verificar la firma: solo para no restaurar sesiones vencidas
function tokenVigente(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now() + 60_000;
  } catch {
    return false;
  }
}

// El almacenamiento del navegador puede fallar (modo privado, permisos): nunca debe romper la app
function leerSesion() {
  try {
    const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION));
    if (sesion?.token && sesion?.finca_id && tokenVigente(sesion.token)) return sesion;
    localStorage.removeItem(CLAVE_SESION);
  } catch { /* sin almacenamiento disponible */ }
  return null;
}
function guardarSesion(sesion) {
  try { localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion)); } catch { /* sin almacenamiento */ }
}
function borrarSesion() {
  try { localStorage.removeItem(CLAVE_SESION); } catch { /* sin almacenamiento */ }
}

const sesionInicial = leerSesion();
if (sesionInicial) setToken(sesionInicial.token);

function App() {
  const [fincaData, setFincaData] = useState(sesionInicial);
  const [currentPage, setCurrentPage] = useState(sesionInicial ? "dashboard" : "login");

  const handleLogout = useCallback(() => {
    clearToken();
    borrarSesion();
    setFincaData(null);
    setCurrentPage("login");
  }, []);

  useEffect(() => {
    alExpirarSesion(() => {
      handleLogout();
      toast.info("Tu sesión expiró. Vuelve a entrar.");
    });
  }, [handleLogout]);

  const handleLogin = (data) => {
    setToken(data.token);
    const sesion = { token: data.token, finca_id: data.finca_id, nombreFinca: data.nombreFinca };
    guardarSesion(sesion);
    setFincaData(sesion);
    setCurrentPage("dashboard");
  };

  return (
    <div>
      <ToastContainer />
      {currentPage === "login" && (
        <Login
          onRegister={() => setCurrentPage("register")}
          onLogin={handleLogin}
          onOlvide={() => setCurrentPage("recuperar")}
        />
      )}
      {currentPage === "register" && (
        <Register onBack={() => setCurrentPage("login")} onLogin={handleLogin} />
      )}
      {currentPage === "recuperar" && (
        <Recuperar onBack={() => setCurrentPage("login")} onLogin={handleLogin} />
      )}
      {currentPage === "dashboard" && (
        <Dashboard finca={fincaData} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
