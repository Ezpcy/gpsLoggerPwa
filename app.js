document.addEventListener("DOMContentLoaded", function () {
  const logElement = document.getElementById("log");
  let logData = "";
  let intervalId = null;

  document.getElementById("startButton").addEventListener("click", () => {
    if (!navigator.geolocation) {
      logElement.textContent = "Geolocation is not supported by your browser";
      return;
    }
    intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, altitude } = position.coords;
          const timestamp = new Date(position.timestamp);
          const entry = `Time: ${timestamp}, Lat: ${latitude}, Lon: ${longitude}, Alt: ${
            altitude || "Not available"
          }\n`;
          logData += entry;
          logElement.textContent += entry;
        },
        (error) => {
          logElement.textContent += `Error: ${error.message}\n`;
        }
      );
    }, 30000); // 30000 milliseconds = 30 seconds
  });

  document.getElementById("stopButton").addEventListener("click", () => {
    if (intervalId) {
      clearInterval(intervalId);
      logElement.textContent += "Stopped tracking.\n";
      saveData(logData);
    }
  });

  function saveData(data) {
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gps_log.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
});
