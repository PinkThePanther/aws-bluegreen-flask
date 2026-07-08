import "./App.css"
import Login from "./pages/Login";
import Feed from "./components/Feed";

function App() {
  const loggedIn = false;

  return loggedIn ? <Feed /> : <Login />;
}

export default App