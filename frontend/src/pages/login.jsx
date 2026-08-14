import { useState } from "react";

function Login({ onLogin, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // NEW: stores an error message to show on the page
  const [error, setError] = useState("");

  // NEW: tracks whether the login request is currently running
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    // NEW: clear any old error before trying again
    setError("");

    // NEW: mark the request as running
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8080/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin();
      } else {
        // NEW: show Flask's error message
        setError(data.message || "Login failed");
      }
    } catch (error) {
      // NEW: handles things like Flask not running
      setError("Unable to connect to the server");
    } finally {
      // NEW: request is finished whether it succeeded or failed
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-logo">BlueGreen</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username or email"
            className="login-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="login-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {/* NEW: only appears if there is an error */}
          {error && (
            <p className="login-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>

          <button
            type="button"
            className="signup-button"
            onClick={onSignup}
          >
            Create account
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;