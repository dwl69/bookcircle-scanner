let scannerInitialized = false;
let qrScanner;

document.addEventListener("DOMContentLoaded", () => {
  const savedEmail = sessionStorage.getItem("email");
  if (savedEmail) {
    document.getElementById("email-input").value = savedEmail;
  }

  document.getElementById("scan-button").addEventListener("click", () => {
    const email = document.getElementById("email-input").value.trim();
    if (!email) {
      alert("Please enter your email before scanning.");
      return;
    }

    sessionStorage.setItem("email", email);
    const scannerElement = document.getElementById("scanner");
    scannerElement.style.display = "block";

    if (!scannerInitialized) {
      qrScanner = new Html5Qrcode("scanner");
      scannerInitialized = true;
    }

    qrScanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        fetch("/.netlify/functions/sendToAlbato", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isbn: decodedText, email })
        })
        .then(res => res.json())
        .then(() => {
          alert("Book uploaded successfully!");
          qrScanner.stop();
          scannerElement.style.display = "none";
        })
        .catch(err => {
          console.error("Upload failed:", err);
          alert("There was an error uploading the book.");
        });
      },
      (errorMessage) => {
        console.warn("Scan error:", errorMessage);
      }
    ).catch(err => {
      console.error("Error initializing scanner:", err);
    });
  });
});