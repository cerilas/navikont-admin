const fs = require('fs');
const path = '/Users/deniz/.gemini/antigravity/brain/b08ae379-4e24-4f38-b08c-d766394430b6/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (!lines[i]) continue;
  try {
    const step = JSON.parse(lines[i]);
    if (step.source === 'SYSTEM' && step.content) {
       if (step.content.includes('File Path: `file:///Users/deniz/Documents/navikont-admin-2/src/app/%28app%29/apps/%5BappId%5D/patients/%5BenrollmentId%5D/PatientDetailClient.tsx`')) {
          const match = step.content.match(/Showing lines 1 to (\d+)/);
          if (match && parseInt(match[1]) > 500) {
             const codeMatch = step.content.match(/Showing lines 1 to \d+\n([\s\S]+)/);
             if (codeMatch) {
               let linesArr = codeMatch[1].split('\n');
               const cleanLines = linesArr.map(l => {
                   const m = l.match(/^\d+:\s(.*)/);
                   return m ? m[1] : l;
               });
               fs.writeFileSync('recovered_full.tsx', cleanLines.join('\n'));
               console.log("Wrote to recovered_full.tsx");
             }
          }
       }
    }
  } catch (e) {}
}
