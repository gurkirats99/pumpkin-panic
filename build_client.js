const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const buildDir = path.join(rootDir, 'crazygames_build');
const zipFile = path.join(rootDir, 'pumpkin-panic-crazygames.zip');

console.log('🎃 =========================================================');
console.log('🎃 PUMPKIN PANIC.IO - CrazyGames Client Packaging Script');
console.log('🎃 Output Target Folder:', buildDir);
console.log('🎃 Output Target Zip:   ', zipFile);
console.log('🎃 =========================================================');

// 1. Clean or create output directory
if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
}
fs.mkdirSync(buildDir, { recursive: true });

if (fs.existsSync(zipFile)) {
    fs.rmSync(zipFile, { force: true });
}

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
fs.copyFileSync(path.join(rootDir, 'index.html'), path.join(buildDir, 'index.html'));

console.log('📦 Copying style.css...');
fs.copyFileSync(path.join(rootDir, 'style.css'), path.join(buildDir, 'style.css'));

console.log('📦 Copying src/ directory...');
copyDirectory(path.join(rootDir, 'src'), path.join(buildDir, 'src'));

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

auditDirectory(buildDir);

console.log('✅ Client files copied to crazygames_build successfully!');
console.log(`📁 Files: ${totalFiles}`);
console.log(`⚖️  Total Uncompressed Size: ${(totalBytes / 1024).toFixed(2)} KB (${(totalBytes / (1024 * 1024)).toFixed(3)} MB)`);

// 5. Create Zip Archive using PowerShell Compress-Archive
try {
    console.log('📦 Creating zip archive for CrazyGames upload...');
    execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${buildDir}\\*' -DestinationPath '${zipFile}' -Force"`, { stdio: 'inherit' });
    console.log('🎉 ZIP created successfully:', zipFile);

    // Also populate NEW_UPDATE_UPLOAD
    const uploadDir = path.join(rootDir, 'NEW_UPDATE_UPLOAD');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    fs.copyFileSync(zipFile, path.join(uploadDir, 'pumpkin-panic-crazygames.zip'));
    
    const coversDir = path.join(rootDir, 'crazygames_covers');
    if (fs.existsSync(coversDir)) {
        const covers = fs.readdirSync(coversDir);
        for (const cover of covers) {
            fs.copyFileSync(path.join(coversDir, cover), path.join(uploadDir, cover));
        }
    }
    console.log('🚀 NEW_UPDATE_UPLOAD synchronized with fresh package!');
} catch (e) {
    console.log('ℹ️  Compress-Archive error:', e);
}

console.log('🎃 Complete! Upload crazygames_build folder contents or pumpkin-panic-crazygames.zip to CrazyGames Developer Portal!');
