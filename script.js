// script.js — BFBC Scanner (fully corrected) June 15 3:59

let selectedDeviceId;
let codeReader;

async function searchBook(isbn) {
  const email = document.getElementById("email-input").value;
  sessionStorage.setItem("email", email);

  if (!email || !isbn) {
    alert("Please enter both email and ISBN.");
    return;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
    );
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      alert("Book not found. Please try again.");
      return;
    }

    const book = data.items[0].volumeInfo;
    const payload = {
      title: book.title || "",
      author: (book.authors && book.authors.join(", ")) || "",
      description: book.description || "",
      email: email,
    };

    const albatoWebhookURL = "https://connect.albato.com/your-webhook-url";

    const albatoResponse = await fetch("/.netlify/functions/forwardToAlbato", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: albatoWebhookURL,
        payload: payload,
      }),
    });

    if (!albatoResponse.ok) {
      alert("Error sending book to database.");
      return;
    }

    alert("Book uploaded successfully!");
  } catch (error) {
    alert("An error occurred while uploading the book.");
    console.error(error);
  }
}

function setupScanner() {
  codeReader = new ZXing.BrowserBarcodeReader();

  codeReader
    .getVideoInputDevices()
    .then((videoInputDevices) => {
      selectedDeviceId = videoInputDevices[0]?.deviceId;
    })
    .catch((err) => {
      console.error(err);
      alert("No camera devices found or camera access denied.");
      fallbackToManualInput();
    });
}

function startScan() {
  if (!selectedDeviceId) {
    alert("No camera selected.");
    return;
  }

  codeReader
    .decodeOnceFromVideoDevice(selectedDeviceId, "reader")
    .then((result) => {
      searchBook(result.text);
    })
    .catch((err) => {
      console.error(err);
      alert("Failed to scan barcode. You can enter the ISBN manually.");
      fallbackToManualInput();
    });
}

function fallbackToManualInput() {
  document.getElementById("scanner-section").style.display = "none";
  document.getElementById("manual-input-section").style.display = "block";
}

function detectDeviceTypeAndInitialize() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const scanner = document.getElementById("scanner-section");
  const manual = document.getElementById("manual-input-section");

  if (isMobile) {
    scanner.style.display = "block";
    manual.style.display = "block";
    setupScanner();
  } else {
    scanner.style.display = "none";
    manual.style.display = "block";
  }

  document.getElementById("email-input").style.fontSize = "1.25em";
  document.getElementById("manual-isbn").style.fontSize = "1.25em";
  document.getElementById("manualSubmit").style.fontSize = "1.25em";
}

document.addEventListener("DOMContentLoaded", () => {
  detectDeviceTypeAndInitialize();

  const savedEmail = sessionStorage.getItem("email");
  if (savedEmail) {
    document.getElementById("email-input").value = savedEmail;
  }

  document.getElementById("email-input").addEventListener("change", (e) => {
    sessionStorage.setItem("email", e.target.value);
  });

  document
    .getElementById("startScan")
    .addEventListener("click", startScan);

  document
    .getElementById("manualSubmit")
    .addEventListener("click", () => {
      const isbn = document.getElementById("manual-isbn").value;
      searchBook(isbn);
    });
});
