const RAIN_DROPS = Array.from({ length: 14 }, (_, index) => index);

function WeatherWidget() {
  return (
    <>
      <div className="rain-curtain" aria-hidden="true">
        {RAIN_DROPS.map((drop) => (
          <span
            key={drop}
            style={{
              left: `${drop * 7.3 + 1}%`,
              height: `${9 + (drop % 3) * 3}px`,
              animationDuration: `${1.25 + (drop % 4) * 0.18}s`,
              animationDelay: `${drop * -0.17}s`,
            }}
          />
        ))}
      </div>

      <section className="weather-widget" aria-label="Local weather widget malfunction">
        <div className="weather-titlebar">
          <span className="weather-logo">BG</span>
          <strong>BlueGreen Weather</strong>
          <div className="weather-window-buttons" aria-hidden="true">
            <span>_</span><span>□</span><span className="weather-close">×</span>
          </div>
        </div>
        <div className="weather-tabs" aria-hidden="true">
          <span className="active">Conditions</span>
          <span>Forecast</span>
          <span>Radar</span>
        </div>
        <div className="weather-location">
          <strong>New York, NY</strong>
          <span>Updated 4:42 PM</span>
        </div>
        <div className="weather-current">
          <div className="weather-reading">
            <span className="weather-icon" aria-hidden="true">🌧️</span>
            <div><strong>64°F</strong><span>Light Rain</span></div>
          </div>
          <dl className="weather-details">
            <div><dt>Feels Like</dt><dd>62°F</dd></div>
            <div><dt>Humidity</dt><dd>91%</dd></div>
            <div><dt>Wind</dt><dd>NE 12 mph</dd></div>
            <div><dt>Rain Today</dt><dd>0.34 in</dd></div>
          </dl>
        </div>
        <div className="weather-forecast" aria-label="Three day forecast">
          <div><b>Tonight</b><span>🌧️</span><small>58°</small></div>
          <div><b>Friday</b><span>🌦️</span><small>67° / 55°</small></div>
          <div><b>Saturday</b><span>⛅</span><small>71° / 57°</small></div>
        </div>
        <p className="weather-status">Station: KNYC · Data refresh in 09:42</p>
      </section>
    </>
  );
}

export default WeatherWidget;
