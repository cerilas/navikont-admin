const fs = require('fs');
const path = '/Users/deniz/.gemini/antigravity/brain/b08ae379-4e24-4f38-b08c-d766394430b6/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (!lines[i]) continue;
  try {
    const step = JSON.parse(lines[i]);
    if (step.source === 'SYSTEM' && step.content && step.content.includes('PatientDetailClient.tsx')) {
       if (step.content.includes('Showing lines 1 to')) {
           const match = step.content.match(/Showing lines (\d+) to (\d+)\n([\s\S]+)/);
           if (match && parseInt(match[2]) > 500) {
               console.log("Found at step", step.step_index);
               let linesArr = match[3].split('\n');
               const cleanLines = linesArr.map(l => {
                   const m = l.match(/^\d+:\s(.*)/);
                   return m ? m[1] : l;
               });
               fs.writeFileSync('recovered_full.tsx', cleanLines.join('\n'));
               console.log("Wrote to recovered_full.tsx");
               break;
           }
       }
    }
  } catch (e) {}
}
