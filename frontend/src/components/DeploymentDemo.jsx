const RELEASES = {
  blue: {
    label: "Blue · stable release",
    task: "bluegreen-flask:4",
    traffic: "100% production traffic",
    status: "Healthy",
    latency: "9.38 ms",
    trace: "761412e64323f73deb209dc307abc223",
  },
  green: {
    label: "Green · candidate release",
    task: "bluegreen-flask:5",
    traffic: "Preview traffic only",
    status: "Health check passed",
    latency: "8.91 ms",
    trace: "4c825f319e864e21a99c78d04675e90a",
  },
};

function DeploymentDemo({ deployment, onDeploymentChange }) {
  const release = RELEASES[deployment];
  const isGreen = deployment === "green";

  return (
    <section className="deployment-demo" aria-labelledby="deployment-demo-title">
      <header className="deployment-demo-header">
        <div>
          <p className="eyebrow">Interactive portfolio walkthrough</p>
          <h2 id="deployment-demo-title">Why this release gets rolled back</h2>
        </div>
        <span className={`release-badge ${deployment}`}>{release.label}</span>
      </header>

      <div className="scenario-panel">
        <strong>The scenario</strong>
        <p>
          Blue is the stable ECS release. Green introduces a weather widget.
          The API remains available, but the new interface visibly malfunctions.
          The account and feed stay identical so the release change is isolated.
        </p>
      </div>

      <ol className="deployment-walkthrough" aria-label="Recruiter walkthrough">
        <li className={deployment === "blue" ? "current" : "complete"}>
          <span>1</span>
          <div><strong>Establish the baseline</strong><small>View Blue and confirm the application works normally without the widget.</small></div>
        </li>
        <li className={isGreen ? "current" : ""}>
          <span>2</span>
          <div><strong>Preview the candidate</strong><small>Switch to Green. The weather window and escaped rain make the defect obvious.</small></div>
        </li>
        <li className={isGreen ? "ready" : ""}>
          <span>3</span>
          <div><strong>Compare health with experience</strong><small>The request still returns 200, proving a health check cannot detect every product defect.</small></div>
        </li>
      </ol>

      <div className="release-summary" aria-live="polite">
        <div><span>Active view</span><strong>{release.label}</strong></div>
        <div><span>ECS task</span><strong>{release.task}</strong></div>
        <div><span>Traffic</span><strong>{release.traffic}</strong></div>
        <div><span>Service</span><strong>{release.status}</strong></div>
      </div>

      <details className="trace-example">
        <summary>View example trace and CloudWatch log</summary>
        <div className="trace-explanation">
          <p>
            OpenTelemetry places the same trace identifier on the request span
            and application log, allowing an operator to connect the user action
            to the ECS service that handled it.
          </p>
          <pre>{`request_completed
method=GET path=/posts status=200
duration_ms=${release.latency}
service=bluegreen-flask
task_definition=${release.task}
trace_id=${release.trace}`}</pre>
          <small>Representative example—not a live CloudWatch query.</small>
        </div>
      </details>

      <div className={`release-decision ${isGreen ? "rollback" : "baseline"}`}>
        <strong>{isGreen ? "Why roll back?" : "What should the reviewer do?"}</strong>
        <p>
          {isGreen
            ? "Green is technically healthy, but the customer-facing defect makes it unsuitable for production. Roll traffic back to the known-good Blue task revision."
            : "Start with Blue, then preview Green. Compare the visible behavior with the successful request trace before making the release decision."}
        </p>
      </div>

      <footer className="deployment-actions" aria-label="Deployment demonstration controls">
        <span>Try the release sequence:</span>
        <div>
          <button type="button" className={deployment === "blue" ? "active blue" : ""} aria-pressed={deployment === "blue"} onClick={() => onDeploymentChange("blue")}>1 · View Blue</button>
          <button type="button" className={isGreen ? "active green" : ""} aria-pressed={isGreen} onClick={() => onDeploymentChange("green")}>2 · Preview Green</button>
          <button type="button" className="rollback-button" disabled={!isGreen} onClick={() => onDeploymentChange("blue")}>3 · Roll back to Blue</button>
        </div>
        <small>Browser simulation only · no AWS resources are started</small>
      </footer>
    </section>
  );
}

export default DeploymentDemo;
