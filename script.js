// script.js — BFBC Scanner (fixed) June 15

let html5QrcodeScanner;
let isScanning = false;

async function searchBook(isbn) {
  const email = document.getElementById("email-input").value.trim();
  const cleanIsbn = isbn.trim();

  if (!email || !cleanIsbn) {
    alert("Please enter both email and ISBN.");
    return;
  }

  // Save email to sessionStorage
  sessionStorage.setItem("email", email);

  try {
    console.log(`Searching for ISBN: ${cleanIsbn}`);
    
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`
    );
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      alert("Book not found. Please check the ISBN and try again.");
      return;
    }

    const book = data.items[0].volumeInfo;
    const payload = {
      title: book.title || "Unknown Title",
      author: (book.authors && book.authors.join(", ")) || "Unknown Author",
      description: book.description || "No description available",
      isbn: cleanIsbn,
      email: email,
    };

    console.log("Book found:", payload);

    // Replace with your actual Albato webhook URL
    const albatoWebhookURL = "https://h.albato.com/wh/38/1lfklq4/6IxY60JazgpMLhLjenj7NuhPTtjuBswp1J-oecRZljQ/";

    const albatoResponse = await fetch("/.netlify/functions/sendToAlbato", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: albatoWebhookURL,
        payload: payload,
      }),
    });

    if (!albatoResponse.ok) {
      const errorText = await albatoResponse.text();
      console.error("Albato error:", errorText);
      alert("Error sending book to database. Please try again.");
      return;
    }

    alert(`Book uploaded successfully!\n\nTitle: ${payload.title}\nAuthor: ${payload.author}`);
    
    // Clear the manual ISBN input after successful upload
    document.getElementById("manual-isbn").value = "";
    
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred while uploading the book. Please check your internet connection and try again.");
  }
}

function setupScanner() {
  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
    supportedScanTypes: [
      Html5QrcodeScanType.SCAN_TYPE_CAMERA
    ]
  };

  html5QrcodeScanner = new Html5QrcodeScanner("reader", config, false);
  
  html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

function onScanSuccess(decodedText, decodedResult) {
  console.log(`Scanned: ${decodedText}`);
  
  // Stop scanning
  html5QrcodeScanner.clear().then(() => {
    isScanning = false;
    document.getElementById("startScan").textContent = "Start Scanning";
    document.getElementById("startScan").disabled = false;
  }).catch(err => {
    console.error("Error stopping scanner:", err);
  });
  
  // Process the scanned ISBN
  searchBook(decodedText);
}

function onScanFailure(error) {
  // This is called frequently during scanning, so we don't want to log every failure
  // console.log(`Scan failed: ${error}`);
}

function startScan() {
  const email = document.getElementById("email-input").value.trim();
  
  if (!email) {
    alert("Please enter your email before scanning.");
    document.getElementById("email-input").focus();
    return;
  }

  if (!isScanning) {
    isScanning = true;
    document.getElementById("startScan").textContent = "Scanning...";
    document.getElementById("startScan").disabled = true;
    
    // Clear any existing scanner
    const readerElement = document.getElementById("reader");
    readerElement.innerHTML = "";
    
    setupScanner();
  }
}

function stopScan() {
  if (html5QrcodeScanner && isScanning) {
    html5QrcodeScanner.clear().then(() => {
      isScanning = false;
      document.getElementById("startScan").textContent = "Start Scanning";
      document.getElementById("startScan").disabled = false;
    }).catch(err => {
      console.error("Error stopping scanner:", err);
      isScanning = false;
      document.getElementById("startScan").textContent = "Start Scanning";
      document.getElementById("startScan").disabled = false;
    });
  }
}

function detectDeviceTypeAndInitialize() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  const scanner = document.getElementById("scanner-section");
  const manual = document.getElementById("manual-input-section");
  
  if (isMobile) {
    scanner.style.display = "block";
    manual.style.display = "block";
  } else {
    scanner.style.display = "none";
    manual.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing...");
  
  detectDeviceTypeAndInitialize();

  // Restore saved email
  const savedEmail = sessionStorage.getItem("email");
  if (savedEmail) {
    document.getElementById("email-input").value = savedEmail;
  }

  // Save email when it changes
  document.getElementById("email-input").addEventListener("input", (e) => {
    sessionStorage.setItem("email", e.target.value);
  });

  // Start scan button
  document.getElementById("startScan").addEventListener("click", startScan);

  // Manual submit button
  document.getElementById("manualSubmit").addEventListener("click", () => {
    const isbn = document.getElementById("manual-isbn").value.trim();
    if (!isbn) {
      alert("Please enter an ISBN.");
      document.getElementById("manual-isbn").focus();
      return;
    }
    searchBook(isbn);
  });

  // Allow Enter key to submit manual ISBN
  document.getElementById("manual-isbn").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const isbn = e.target.value.trim();
      if (isbn) {
        searchBook(isbn);
      }
    }
  });

  console.log("Initialization complete");
});