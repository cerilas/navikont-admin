const fs = require('fs');
const path = '/Users/deniz/.gemini/antigravity/brain/b08ae379-4e24-4f38-b08c-d766394430b6/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (!lines[i]) continue;
  try {
    const step = JSON.parse(lines[i]);
    if (step.source === 'SYSTEM' && step.content && step.content.includes('File Path: `file:///Users/deniz/Documents/navikont-admin-2/src/app/%28app%29/apps/%5BappId%5D/patients/%5BenrollmentId%5D/PatientDetailClient.tsx`')) {
       console.log("Found view_file at step:", step.step_index);
       if (step.content.includes('Total Lines: 634')) {
           const match = step.content.match(/Showing lines 1 to 800\n([\s\S]+)/);
           if (match) {
               console.log("Found full content!");
               let linesArr = match[1].split('\n');
               // remove prefix like '123: '
               const cleanLines = linesArr.map(l => {
                   const m = l.match(/^\d+:\s(.*)/);
                   return m ? m[1] : l;
               });
               fs.writeFileSync('recovered.tsx', cleanLines.join('\n'));
               console.log("Wrote to recovered.tsx");
               break;
           }
       }
    }
  } catch (e) {}
}
