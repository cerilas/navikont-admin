const fs = require('fs');
const path = '/Users/deniz/.gemini/antigravity/brain/b08ae379-4e24-4f38-b08c-d766394430b6/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (!lines[i]) continue;
  try {
    const step = JSON.parse(lines[i]);
    if (step.tool_calls && Array.isArray(step.tool_calls)) {
      for (const call of step.tool_calls) {
        const argStr = JSON.stringify(call.arguments);
        if (argStr && argStr.includes('PatientDetailClient.tsx')) {
           console.log("Found call at step", step.step_index, call.name);
           if (call.name === 'default_api:replace_file_content' || call.name === 'default_api:multi_replace_file_content') {
               console.log(call.arguments.ReplacementContent?.substring(0, 50));
           }
        }
      }
    }
  } catch (e) {}
}
