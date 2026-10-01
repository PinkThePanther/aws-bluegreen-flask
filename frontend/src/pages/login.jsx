import { useState } from "react";
import { apiUrl } from "../api";

const DEMO_EMAIL = "demo@bluegreen.app";
const DEMO_PASSWORD = "DemoOnly123!";

function Login({ onLogin, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  

  // NEW: stores an error message to show on the page
  const [error, setError] = useState("");

  // NEW: tracks whether the login request is currently running
  const [loading, setLoading] = useState(false);

  function loadDemoAccount() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // NEW: clear any old error before trying again
    setError("");

    // NEW: mark the request as running
    setLoading(true);

    try {
      const response = await fetch(apiUrl("/login"), {
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
        onLogin(data.account);
      } else {
        // NEW: show Flask's error message
        setError(data.message || "Login failed");
      }
    } catch {
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
        <p className="signup-intro">
          A containerized Flask and React portfolio project demonstrating how
          teams compare a stable Blue release with a Green candidate before
          deciding whether to promote or roll back.
        </p>

        {loading && (
          <div className="login-status">
            <div className="spinner"></div>
            <span>Signing in...</span>
          </div>
        )}

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

          <div className="demo-login">
            <p>
              Recruiter walkthrough: load the disposable demo account, sign in,
              then follow the Blue → Green → rollback controls below the feed.
            </p>
            <button
              type="button"
              className="demo-button"
              onClick={loadDemoAccount}
              disabled={loading}
            >
              Use demo account
            </button>
          </div>

          <p className="login-hosting-note">
            Originally exercised on AWS ECS with CloudWatch logging. This live
            portfolio version runs on Railway using the same Dockerized app and
            Railway runtime logs.
          </p>

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
