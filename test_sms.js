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
      msg: "Navikont test",
      no: "5301234567" // FAKE NUMBER
    };

    const smsRes = await fetch(`${apiUrl}/api/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    console.log("SMS Status:", smsRes.status);
    if (!smsRes.ok) {
        console.error(await smsRes.text());
    } else {
        console.log("SMS sent!");
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
testApi();
