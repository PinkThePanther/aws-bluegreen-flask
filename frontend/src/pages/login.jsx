


function Login(onLogin ) {

     function handleSubmit(event) {
        event.preventDefault();
        onLogin();
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
          />

          <input
            type="password"
            placeholder="Password"
            className="login-input"
          />

          <button type="submit" className="login-button">
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}



export default Login;