import { useState } from "react";
import Login from "./pages/login";
import Feed from "./components/feed";
import "./App.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return loggedIn ? (
    <Feed />
  ) : (
    <Login onLogin={() => setLoggedIn(true)} />
  );
}

export default App;