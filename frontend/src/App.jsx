import { useState } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Feed from "./components/Feed";
import "./App.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("login");

  function handleLogin() {
    setLoggedIn(true);
  }

  if (loggedIn) {
    return <Feed />;
  }

  if (page === "signup") {
    return (
      <Signup
        onBackToLogin={() => setPage("login")}
      />
    );
  }

  return (
    <Login
      onLogin={handleLogin}
      onSignup={() => setPage("signup")}
    />
  );
}

export default App;