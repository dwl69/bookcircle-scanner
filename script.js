function isValidISBN13(isbn) {
  if (!/^97[89]\d{10}$/.test(isbn)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checksum = (10 - (sum % 10)) % 10;
  return checksum === parseInt(isbn[12]);
}

// Multi-frame validation system
class ISBNValidator {
  constructor(requiredMatches = 3, windowSize = 10) {
    this.requiredMatches = requiredMatches;
    this.windowSize = windowSize;
    this.recentScans = [];
    this.scanCounts = new Map();
  }

  addScan(isbn) {
    // Only consider valid ISBN format
    if (!isValidISBN13(isbn)) return null;

    // Add to recent scans
    this.recentScans.push(isbn);
    if (this.recentScans.length > this.windowSize) {
      const removed = this.recentScans.shift();
      this.scanCounts.set(removed, (this.scanCounts.get(removed) || 1) - 1);
      if (this.scanCounts.get(removed) <= 0) {
        this.scanCounts.delete(removed);
      }
    }

    // Update count
    this.scanCounts.set(isbn, (this.scanCounts.get(isbn) || 0) + 1);

    // Check if we have enough matches
    if (this.scanCounts.get(isbn) >= this.requiredMatches) {
      return isbn;
    }

    return null;
  }

  reset() {
    this.recentScans = [];
    this.scanCounts.clear();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email-input");
  const scanButton = document.getElementById("scan-button");
  const scannerContainer = document.getElementById("scanner-container");
  
  // Create validator instance
  const validator = new ISBNValidator(3, 10); // Require 3 matches in last 10 scans
  let isProcessing = false;

  const savedEmail = sessionStorage.getItem("email");
  if (savedEmail) emailInput.value = savedEmail;

  scanButton.addEventListener("click", () => {
    const email = emailInput.value.trim();
    if (!email) {
      alert("Please enter your email before scanning.");
      return;
    }

    sessionStorage.setItem("email", email);
    scannerContainer.style.display = "block";
    validator.reset();
    isProcessing = false;

    if (Quagga.initialized) {
      Quagga.start();
      return;
    }

    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.querySelector('#scanner'),
        constraints: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      decoder: {
        readers: ["ean_reader"],
        debug: {
          drawBoundingBox: true,
          showFrequency: false,
          drawScanline: true,
          showPattern: false
        }
      },
      locate: true,
      numOfWorkers: 2,
      frequency: 10, // Process every 10th frame to reduce false positives
      debug: false
    }, (err) => {
      if (err) {
        console.error("Quagga init error:", err);
        alert("Scanner failed to start.");
        return;
      }
      Quagga.initialized = true;
      Quagga.start();
    });

    Quagga.onDetected((data) => {
      if (isProcessing) return;

      const isbn = data.codeResult.code;
      console.log("Scanned (raw):", isbn, "Quality:", data.codeResult.decodedCodes.length);

      if (!isbn) return;

      // Add quality filtering - QuaggaJS provides quality metrics
      const quality = data.codeResult.decodedCodes.length;
      if (quality < 10) { // Reject low-quality scans
        console.log("Rejected due to low quality:", quality);
        return;
      }

      // Try multi-frame validation
      const validatedISBN = validator.addScan(isbn);
      
      if (validatedISBN) {
        isProcessing = true;
        Quagga.stop();
        Quagga.initialized = false;
        
        console.log("Validated ISBN:", validatedISBN);
        alert(`Successfully scanned ISBN: ${validatedISBN}`);

        fetch("/.netlify/functions/sendToAlbato", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isbn: validatedISBN, email })
        })
        .then(res => res.json())
        .then(() => {
          alert("Book uploaded successfully!");
          scannerContainer.style.display = "none";
        })
        .catch(err => {
          console.error("Upload failed:", err);
          alert("There was an error uploading the book.");
          isProcessing = false;
        });
      } else {
        // Show current scan counts for debugging
        const currentCount = validator.scanCounts.get(isbn) || 0;
        console.log(`ISBN ${isbn} seen ${currentCount}/${validator.requiredMatches} times`);
      }
    });

    // Add error handling for processing issues
    Quagga.onProcessed((result) => {
      if (!result) return;
      
      // You can add additional processing logic here if needed
      // For example, checking scan line quality or positioning
    });
  });

  // Add a manual reset button if needed
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset Scanner';
  resetButton.onclick = () => {
    validator.reset();
    isProcessing = false;
    console.log('Scanner reset');
  };
  // Uncomment next line if you want to add the reset button to your HTML
  // document.body.appendChild(resetButton);
});