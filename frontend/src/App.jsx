import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [fincaData, setFincaData] = useState(null);

  return (
    <div>
      {currentPage === "login" && (
        <Login
          onRegister={() => setCurrentPage("register")}
          onLogin={(data) => {
            setFincaData(data);
            setCurrentPage("dashboard");
          }}
        />
      )}
      {currentPage === "register" && (
        <Register onBack={() => setCurrentPage("login")} />
      )}
      {currentPage === "dashboard" && (
        <Dashboard finca={fincaData} />
      )}
    </div>
  );
}

export default App;