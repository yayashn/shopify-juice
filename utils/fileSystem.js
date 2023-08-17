const fs = require('fs-extra');
const path = require('path');

/**
 * Ensures the build directory exists and creates essential sub-folders.
 * @param {string} destDir - The destination directory.
 */
function ensureBuildDirectory(destDir) {
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        const essentialFolders = ['assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'];
        essentialFolders.forEach(folder => {
            fs.mkdirSync(path.join(destDir, folder), { recursive: true });
        });
    }
}

/**
 * Generates a component map from the given directory.
 * @param {string} dir - The directory to scan.
 * @param {Object} componentMap - The map to populate.
 */
function generateComponentMap(dir, componentMap) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            generateComponentMap(fullPath, componentMap);
        } else if (stats.isFile() && path.extname(fullPath) === '.liquid') {
            const componentName = path.basename(fullPath, '.liquid');
            componentMap[componentName] = fs.readFileSync(fullPath, 'utf8');
        }
    });
}

module.exports = {
    ensureBuildDirectory,
    generateComponentMap
};
