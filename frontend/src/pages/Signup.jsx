import { useState } from "react";

function Signup({ onBackToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignup(event) {
    event.preventDefault();

    const response = await fetch("http://localhost:8080/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    const data = await response.json();

    console.log(data);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-logo">BlueGreen</h1>
        <p className="signup-intro">Create an account to get started.</p>

        <form className="login-form" onSubmit={handleSignup}>
          <label className="form-field">
            <span className="form-label">Username</span>
            <input
              className="login-input"
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Choose a username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>

          <label className="form-field">
            <span className="form-label">Email</span>
            <input
              className="login-input"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="form-field">
            <span className="form-label">Password</span>
            <input
              className="login-input"
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button type="submit" className="login-button">
            Create account
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <button type="button" className="text-button" onClick={onBackToLogin}>
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;
