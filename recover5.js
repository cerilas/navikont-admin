const fs = require('fs');
const path = '/Users/deniz/.gemini/antigravity/brain/b08ae379-4e24-4f38-b08c-d766394430b6/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (!lines[i]) continue;
  try {
    const step = JSON.parse(lines[i]);
    if (step.step_index === 135) {
       fs.writeFileSync('step135.txt', step.content);
       console.log("Wrote step 135 to step135.txt");
    }
  } catch (e) {}
}
