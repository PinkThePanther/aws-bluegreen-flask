import { useState } from "react";
import Login from "./pages/login";
import Signup from "./pages/Signup";
import Feed from "./components/feed";
import "./App.css";

function App() {
  const [account, setAccount] = useState(null);
  const [page, setPage] = useState("login");

  function handleLogin(authenticatedAccount) {
    setAccount(authenticatedAccount);
  }

  function handleLogout(){
    setAccount(null);
  } 

   if (account) {
    return (
      <Feed
        account={account}
        isDemoSession={account.is_demo}
        onLogout={handleLogout}
      />
    );
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
