const fs = require('fs');
const path = require('path');

function getFilesRecursively(dir) {
  if (!fs.existsSync(dir)) return [];
  let allFiles = [];
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      allFiles = allFiles.concat(getFilesRecursively(fullPath));
    } else if (file.endsWith('.md')) {
      allFiles.push(fullPath);
    }
  }
  return allFiles;
}

const dirs = [
  path.join(process.cwd(), 'md_archive', '01.RAW MD'),
  path.join(process.cwd(), 'md_archive', '03.tag')
];

let updated = 0;
let skipped = 0;

for (const dir of dirs) {
  const files = getFilesRecursively(dir);
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.startsWith('---')) {
      const endIdx = content.indexOf('---', 3);
      if (endIdx !== -1) {
        const frontmatter = content.slice(3, endIdx);
        if (!frontmatter.includes('\nauthor:')) {
          // Insert author: "NA" before the closing ---
          const newContent = content.slice(0, endIdx) + 'author: "NA"\n' + content.slice(endIdx);
          fs.writeFileSync(file, newContent, 'utf8');
          console.log('Updated: ' + path.basename(file));
          updated++;
        } else {
          console.log('Skipped (has author): ' + path.basename(file));
          skipped++;
        }
      }
    } else {
      console.log('No frontmatter found: ' + path.basename(file));
    }
  }
}

console.log('\nDone. Updated: ' + updated + ', Skipped: ' + skipped);
