const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:5000/api/patient/faqs', {
      headers: { 'Authorization': 'Bearer test' } // This will fail auth, but let's see. Wait, I can generate a token.
    });
    console.log(res.data);
  } catch(e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();
