const fs = require('fs');
const path = require('path');

const entitiesDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.entity.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(entitiesDir);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('} , JoinColumn') || content.includes('} , ManyToOne, JoinColumn')) {
    content = content.replace(/\} , JoinColumn/g, ', JoinColumn }');
    content = content.replace(/\} , ManyToOne, JoinColumn/g, ', ManyToOne, JoinColumn }');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
}
