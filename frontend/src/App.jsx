import { useEffect, useState } from "react";

function App() {
  const [backendStatus, setBackendStatus] = useState("checking...");

  useEffect(() => {
    fetch("http://localhost:8080/health")
      .then((response) => response.text())
      .then((data) => {
        setBackendStatus(data);
      })
      .catch((error) => {
        setBackendStatus("Could not reach Flask backend");
        console.error(error);
      });
  }, []);

  return (
    <div>
      <h1>Blue Green Flask + React</h1>
      <p>Backend status: {backendStatus}</p>
    </div>
  );
}

export default App;