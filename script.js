let qrScanner = null;
let isScanning = false;

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email-input");
  const scanButton = document.getElementById("scan-button");
  const scannerDiv = document.getElementById("scanner");

  // Restore saved email
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
    scannerDiv.style.display = "block";

    if (!qrScanner) {
      qrScanner = new Html5Qrcode("scanner");
    }

    if (!isScanning) {
      isScanning = true;
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
            qrScanner.stop().then(() => {
              scannerDiv.style.display = "none";
              isScanning = false;
            });
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
        console.error("Scanner start error:", err);
        alert("Could not start the camera scanner.");
        isScanning = false;
      });
    }
  });
});