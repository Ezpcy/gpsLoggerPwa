window.addEventListener("beforeunload", function (e) {
  e.preventDefault();
  e.returnValue = "";
});

document.addEventListener("DOMContentLoaded", function () {
  const audio = document.getElementById("audio");

  function startSilentAudio() {
    audio
      .play()
      .catch((error) => console.error("Error playing silent audio:", error));
  }

  function stopSilentAudio() {
    audio.pause();
    audio.currentTime = 0; // Reset the time
  }

  const logElement = document.getElementById("log");
  let header = document.getElementById("header");
  let logData = "";
  let intervalId = null;
  let db = null;
  let request = indexedDB.open("gpslogger", 3);

  request.onerror = function (event) {
    logElement.textContent =
      "Error opening database: " + event.target.errorCode;
    return;
  };

  request.onupgradeneeded = function (event) {
    db = event.target.result;
    const objectStore = db.createObjectStore("gpslog", {
      keyPath: "timestamp",
    });
    objectStore.createIndex("latitude", "latitude", { unique: false });
    objectStore.createIndex("longitude", "longitude", { unique: false });
    objectStore.createIndex("altitude", "altitude", { unique: false });
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    console.log("Database opened.");
    const transaction = db.transaction("gpslog", "readonly");
    const objectStore = transaction.objectStore("gpslog");
    const request = objectStore.getAll();
    request.onsuccess = function (event) {
      const data = event.target.result;
      data.forEach((entry) => {
        logElement.textContent += `${entry.timestamp},${entry.latitude},${entry.longitude},${entry.altitude}\n`;
      });
    };
  };

  document.getElementById("startButton").addEventListener("click", () => {
    startSilentAudio();
    document.getElementById("startButton").style.display = "none";
    document.getElementById("stopButton").style.display = "block";
    document.getElementById("startButton").disabled = true;

    if (!navigator.geolocation) {
      header.textContent = "Geolocation is not supported by your browser";
      return;
    }
    header.textContent =
      "Started tracking...\ntimestamp,latitude,longitude,altitude\n";
    // get permission
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
        addData(db, json);
        logElement.textContent += entry;
      },
      (error) => {
        logElement.textContent += `Error: ${error.message}\n`;
      }
    );

    intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, altitude } = position.coords;
          // date format hours:minutes:seconds 24
          const timestamp = new Date().toTimeString().split(" ")[0];
          const entry = `${timestamp},${latitude},${longitude},${altitude}\n`;
          const json = JSON.stringify({
            timestamp,
            latitude,
            longitude,
            altitude,
          });
          addData(db, json);
          logElement.textContent += entry;
        },
        (error) => {
          logElement.textContent += `Error: ${error.message}\n`;
        }
      ); // track every 30 seconds
    }, 30000);
  });

  document.getElementById("stopButton").addEventListener("click", () => {
    stopSilentAudio();
    document.getElementById("startButton").style.display = "block";
    document.getElementById("stopButton").style.display = "none";
    document.getElementById("startButton").disabled = false;
    if (intervalId || db) {
      clearInterval(intervalId);
      header.textContent = "Stopped tracking.\n";
      saveData();
    }

    clearData(db);
  });

  function saveData() {
    // csv
    let data = "timestamp,latitude,longitude,altitude\n";
    const transaction = db.transaction("gpslog", "readonly");
    const objectStore = transaction.objectStore("gpslog");
    const request = objectStore.getAll();
    request.onsuccess = function (event) {
      const event_data = event.target.result;
      event_data.forEach((entry) => {
        data += `${entry.timestamp},${entry.latitude},${entry.longitude},${entry.altitude}\n`;
      });
      const blob = new Blob([data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gps_log.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
  }

  function addData(db, data) {
    const transaction = db.transaction("gpslog", "readwrite");
    const objectStore = transaction.objectStore("gpslog");
    const request = objectStore.add({ ...JSON.parse(data) });

    request.onsuccess = function (event) {
      console.log("Data added to database.");
    };

    request.onerror = function (event) {
      console.log("Error adding data to database.");
    };
  }

  function clearData(db) {
    logElement.textContent = "";
    const transaction = db.transaction("gpslog", "readwrite");
    const objectStore = transaction.objectStore("gpslog");
    const request = objectStore.clear();
    request.onsuccess = function (event) {
      console.log("Database cleared.");
    };
  }
});
