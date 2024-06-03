let trackingId = null;
const logElement = document.getElementById("log");

document.getElementById("startButton").addEventListener("click", () => {
  if (navigator.geolocation) {
    trackingId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, altitude } = position.coords;
        logElement.textContent += `Lat: ${latitude}, Lon: ${longitude}, Alt: ${
          altitude || "Not available"
        }\n`;
      },
      (error) => {
        logElement.textContent += `Error: ${error.message}\n`;
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000,
      }
    );
  }
});

document.getElementById("stopButton").addEventListener("click", () => {
  if (trackingId) {
    navigator.geolocation.clearWatch(trackingId);
    logElement.textContent += "Stopped tracking.\n";
    // Save the data
    const blob = new Blob([logElement.textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gps_log.txt";
    a.click();
    URL.revokeObjectURL(url);
  }
});
