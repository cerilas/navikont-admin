import re

path = '/Users/deniz/Documents/Navikont/backend/server.js'
with open(path, 'r') as f:
    content = f.read()

new_endpoint = """
// GET /api/patient/faqs
app.get('/api/patient/faqs', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, question, answer, order_index
       FROM core_faqs
       WHERE is_active = true
       ORDER BY order_index ASC`
    );

    const lang = getLanguage(req);
    if (lang !== 'tr' && result.rows.length > 0) {
      const faqIds = result.rows.map(r => r.id);
      const transMap = await getTranslationsMap(client, 'core_faqs', faqIds, lang);
      for (const row of result.rows) {
        if (transMap[row.id]) {
          if (transMap[row.id].question) row.question = transMap[row.id].question;
          if (transMap[row.id].answer) row.answer = transMap[row.id].answer;
        }
      }
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching faqs:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});
"""

# Insert before GET /api/patient/consents
content = content.replace("// GET /api/patient/consents", new_endpoint + "\n// GET /api/patient/consents")

with open(path, 'w') as f:
    f.write(content)

