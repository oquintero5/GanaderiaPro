import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { ToastContainer } from "./ToastContainer";
import { setToken, clearToken } from "./api";

function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [fincaData, setFincaData] = useState(null);

  const handleLogin = (data) => {
    setToken(data.token);
    setFincaData(data);
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    clearToken();
    setFincaData(null);
    setCurrentPage("login");
  };

  return (
    <div>
      <ToastContainer />
      {currentPage === "login" && (
        <Login
          onRegister={() => setCurrentPage("register")}
          onLogin={handleLogin}
        />
      )}
      {currentPage === "register" && (
        <Register onBack={() => setCurrentPage("login")} onLogin={handleLogin} />
      )}
      {currentPage === "dashboard" && (
        <Dashboard finca={fincaData} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
