const fs = require('fs');
const path = '/Users/deniz/.gemini/antigravity/brain/b08ae379-4e24-4f38-b08c-d766394430b6/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
  if (!lines[i]) continue;
  try {
    const step = JSON.parse(lines[i]);
    if (step.tool_calls && Array.isArray(step.tool_calls)) {
      for (const call of step.tool_calls) {
        if (call.name === 'default_api:replace_file_content' || call.name === 'default_api:multi_replace_file_content' || call.name === 'default_api:write_to_file') {
           if (call.arguments.TargetFile && call.arguments.TargetFile.includes('PatientDetailClient.tsx')) {
               console.log("Found edit at step", step.step_index, call.name, call.arguments.Description);
               if (call.name === 'default_api:replace_file_content' && call.arguments.ReplacementContent && call.arguments.ReplacementContent.length > 2000) {
                   fs.writeFileSync('recovered_large_edit.tsx', call.arguments.ReplacementContent);
                   console.log("Wrote replacement content to recovered_large_edit.tsx");
               }
           }
        }
      }
    }
  } catch (e) {}
}
