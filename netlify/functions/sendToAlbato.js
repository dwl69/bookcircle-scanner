export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const payload = await req.json();

console.log("📩 Function triggered");
console.log("Payload received:", payload);

    const albatoWebhookUrl = "https://h.albato.com/wh/38/1lfklq4/6IxY60JazgpMLhLjenj7NuhPTtjuBswp1J-oecRZljQ/";

console.log("📤 Sending to Albato:", JSON.stringify(payload));

    const response = await fetch(albatoWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.text();
    return new Response(result, { status: 200 });
  } catch (error) {
    return new Response("Error sending to Albato: " + error.message, {
      status: 500
    });
  }
};

