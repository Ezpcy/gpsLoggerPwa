document.addEventListener("DOMContentLoaded", function () {
  const logElement = document.getElementById("log");
  let logData = "";
  let intervalId = null;

  document.getElementById("startButton").addEventListener("click", () => {
    if (!navigator.geolocation) {
      logElement.textContent = "Geolocation is not supported by your browser";
      return;
    }
    logData += "timestamp,latitude,longitude,altitude\n";
    logElement.textContent =
      "Started tracking...\ntimestamp,latitude,longitude,altitude\n";
    intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, altitude } = position.coords;
          // date format hours:minutes:seconds 24
          const timestamp = new Date().toTimeString().split(" ")[0];
          const entry = `${timestamp},${latitude},${longitude},${altitude}\n`;
          logData += entry;
          const json = JSON.stringify({
            timestamp,
            latitude,
            longitude,
            altitude,
          });
          logElement.textContent += entry;
        },
        (error) => {
          logElement.textContent += `Error: ${error.message}\n`;
        }
      ); // track every 30 seconds
    }, 30000);
  });

  document.getElementById("stopButton").addEventListener("click", () => {
    if (intervalId) {
      clearInterval(intervalId);
      logElement.textContent += "Stopped tracking.\n";
      saveData(logData);
    }
    logData = "";
  });

  function saveData(data) {
    // csv
    const blob = new Blob([data], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gps_log.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
});
