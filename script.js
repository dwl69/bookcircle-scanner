document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email-input");
  const scanButton = document.getElementById("scan-button");
  const scannerContainer = document.getElementById("scanner-container");

  const savedEmail = sessionStorage.getItem("email");
  if (savedEmail) {
    emailInput.value = savedEmail;
  }

  scanButton.addEventListener("click", () => {
    const email = emailInput.value.trim();
    if (!email) {
      alert("Please enter your email before scanning.");
      return;
    }

    sessionStorage.setItem("email", email);
    scannerContainer.style.display = "block";

    if (Quagga.initialized) return;

    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.querySelector('#scanner'),
        constraints: {
          facingMode: "environment"
        }
      },
      decoder: {
        readers: ["ean_reader"]
      },
      locate: true
    }, (err) => {
      if (err) {
        console.error("Quagga init error:", err);
        alert("Error starting scanner. Try refreshing.");
        return;
      }
      Quagga.initialized = true;
      Quagga.start();
    });

    Quagga.onDetected((data) => {
      const isbn = data.codeResult.code;
      if (isbn) {
        Quagga.stop();
        Quagga.initialized = false;
        alert(`Scanned ISBN: ${isbn}`);
        fetch("/.netlify/functions/sendToAlbato", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isbn, email })
        })
        .then(res => res.json())
        .then(() => alert("Book uploaded successfully!"))
        .catch(err => {
          console.error("Upload failed:", err);
          alert("There was an error uploading the book.");
        });
      }
    });
  });
});