const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'client_dist');

console.log('🎃 =========================================================');
console.log('🎃 PUMPKIN PANIC.IO - Production Client Packaging Script');
console.log('🎃 Output Target:', distDir);
console.log('🎃 =========================================================');

// 1. Clean or create output directory
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. Helper to copy directories recursively
function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// 3. Copy production assets
console.log('📦 Copying index.html...');
fs.copyFileSync(path.join(rootDir, 'index.html'), path.join(distDir, 'index.html'));

console.log('📦 Copying style.css...');
fs.copyFileSync(path.join(rootDir, 'style.css'), path.join(distDir, 'style.css'));

console.log('📦 Copying src/ directory...');
copyDirectory(path.join(rootDir, 'src'), path.join(distDir, 'src'));

// 4. Validate output files
let totalFiles = 0;
let totalBytes = 0;

function auditDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            auditDirectory(fullPath);
        } else {
            totalFiles++;
            const stat = fs.statSync(fullPath);
            totalBytes += stat.size;
        }
    }
}

auditDirectory(distDir);

console.log('✅ Production client build packaged successfully!');
console.log(`📁 Files: ${totalFiles}`);
console.log(`⚖️  Total Bundle Size: ${(totalBytes / 1024).toFixed(2)} KB (${(totalBytes / (1024 * 1024)).toFixed(3)} MB)`);
console.log('🎉 Target output ready for CrazyGames zip packaging at:', distDir);
