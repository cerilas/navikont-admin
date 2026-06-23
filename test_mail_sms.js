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
    console.log("Status:", res.status);
    if (!res.ok) {
        console.error(await res.text());
    } else {
        const data = await res.json();
        console.log("Token:", data.token ? "YES" : "NO");
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
testApi();
