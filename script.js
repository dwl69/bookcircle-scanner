let email = "";

function initializeScanner() {
  const qrCodeScanner = new Html5Qrcode("scanner");
  qrCodeScanner.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: 250,
    },
    (decodedText) => {
      document.getElementById("isbn-input").value = decodedText;
      qrCodeScanner.stop();
    },
    (errorMessage) => {
      console.warn(errorMessage);
    }
  ).catch(err => {
    console.error("Error starting scanner:", err);
  });
}

function uploadISBNManually() {
  const isbn = document.getElementById("isbn-input").value.trim();
  email = document.getElementById("email-input").value.trim();
  if (!isbn || !email) {
    alert("Please enter both ISBN and email.");
    return;
  }

  sessionStorage.setItem("email", email);

  fetch("/.netlify/functions/sendToAlbato", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ isbn, email })
  })
  .then(res => res.json())
  .then(data => {
    alert("Book uploaded successfully.");
    document.getElementById("isbn-input").value = "";
  })
  .catch(err => {
    console.error("Upload failed:", err);
    alert("There was an error uploading the book.");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const savedEmail = sessionStorage.getItem("email");
  if (savedEmail) {
    document.getElementById("email-input").value = savedEmail;
  }

  document.getElementById("scan-button").addEventListener("click", () => {
    document.getElementById("scanner").style.display = "block";
    initializeScanner();
  });

  document.getElementById("upload-button").addEventListener("click", uploadISBNManually);
});