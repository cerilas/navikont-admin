async function testApi() {
  const apiUrl = "https://www.cerilas.com";
  const email = "deniz@cerilas.com";
  const password = "24232423";

  try {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    const token = data.token;

    const payload = {
      senderId: 1,
      to: "deniz@cerilas.com",
      subject: "Test",
      html: "Test"
    };

    const mailRes = await fetch(`${apiUrl}/api/mail/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    console.log("Mail Status:", mailRes.status);
    if (!mailRes.ok) {
        console.error(await mailRes.text());
    } else {
        console.log("Mail sent!");
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
testApi();
