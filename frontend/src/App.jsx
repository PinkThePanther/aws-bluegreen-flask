import { useState } from "react";
import Login from "./pages/login";
import Feed from "./components/feed";
import "./App.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  function handleLogin() {
    setLoggedIn(true);
  }

  return loggedIn ? (
    <Feed />
  ) : (
   <Login onLogin={handleLogin} />
  );
}

export default App;