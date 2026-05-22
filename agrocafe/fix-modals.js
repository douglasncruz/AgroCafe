const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend/src/app');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(srcDir);
let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix padding in modal overlay
    content = content.replace(/className="fixed inset-0[^"]* p-4/g, (match) => {
        return match.replace(' p-4', ' p-2 sm:p-4');
    });

    // Fix modal max height
    content = content.replace(/max-h-\[90vh\]/g, 'max-h-[95dvh] sm:max-h-[90dvh]');

    // Fix overflow-x-auto missing from tables
    // Not safe with simple regex, skipping

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
        console.log(`Updated ${path.basename(file)}`);
    }
});

console.log(`Done. Modified ${changedCount} files.`);
