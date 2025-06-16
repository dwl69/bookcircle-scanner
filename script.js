function isValidISBN13(isbn) {
  if (!/^97[89]\d{10}$/.test(isbn)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checksum = (10 - (sum % 10)) % 10;
  return checksum === parseInt(isbn[12]);
}

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email-input");
  const scanButton = document.getElementById("scan-button");
  const scannerContainer = document.getElementById("scanner-container");

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

    if (Quagga.initialized) {
      Quagga.start();
      return;
    }

    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.querySelector('#scanner'),
        constraints: { facingMode: "environment" }
      },
      decoder: {
        readers: ["ean_reader"]
      },
      locate: true
    }, (err) => {
      if (err) {
        console.error("Quagga init error:", err);
        alert("Scanner failed to start.");
        return;
      }
      Quagga.initialized = true;
      Quagga.start();
    });

    const scannedISBNs = new Map();
    Quagga.onDetected((data) => {
      const isbn = data.codeResult.code;
      if (!isbn || !isValidISBN13(isbn)) return;

      const count = scannedISBNs.get(isbn) || 0;
      scannedISBNs.set(isbn, count + 1);

      if (scannedISBNs.get(isbn) >= 3) {
        Quagga.stop();
        Quagga.initialized = false;

        alert(`Successfully scanned ISBN: ${isbn}`);

        fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
          .then(res => res.json())
          .then(data => {
            const book = data.items?.[0]?.volumeInfo || {};
            const title = book.title || '';
            const author = Array.isArray(book.authors) ? book.authors.join(", ") : (book.authors || '');
            const description = book.description || '';

            fetch("https://h.albato.com/wh/38/1lfklq4/6IxY60JazgpMLhLjenj7NuhPTtjuBswp1J-oecRZljQ/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isbn, email, title, author, description })
            })
            .then(res => res.json())
            .then(() => alert("Book uploaded successfully!"))
            .catch(err => {
              console.error("Upload failed:", err);
              alert("There was an error uploading the book.");
            });
          })
          .catch(err => {
            console.error("Google Books API error:", err);
            alert("Could not fetch book info.");
          });
      }
    });
  });
});