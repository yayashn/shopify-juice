const chokidar = require('chokidar');
const { transformJSXtoLiquid } = require('./utils/transform');
const path = require('path');
const fs = require('fs-extra');
const { srcDir, destDir, componentsPath, buildComponentsPath } = require('./paths');

/**
 * Sets up a file watcher for the given source directory.
 * @param {string} srcDir - The source directory to watch.
 * @param {string} destDir - The destination directory for output.
 * @param {Object} componentMap - The map of components.
 */
function setupWatcher(srcDir, destDir, componentMap) {    
    const copyAndRenameFile = (srcPath) => {
        let destPath;

        fs.stat(srcPath)
            .then(stats => {
                if (stats.isFile()) {
                    const relativePath = path.relative(srcDir, srcPath).replace(/\\/g, '/');
                    const splitPath = relativePath.split('/');
                    
                    if(relativePath.startsWith('components/')) return;
                    if (relativePath.startsWith('templates/')) {
                        destPath = path.join(destDir, relativePath);
                    } else if (splitPath.length === 2) {
                        destPath = path.join(destDir, relativePath);
                    } else {
                        destPath = path.join(destDir, splitPath[0], splitPath.slice(1).join('_'));
                    }

                    return fs.readFile(srcPath, 'utf8');
                }
            })
            .then(content => {
                const transformedContent = transformJSXtoLiquid(content, componentMap);
                return fs.writeFile(destPath, transformedContent, 'utf8');
            })
            .then(() => console.log(`Copied and renamed ${srcPath} to ${destPath}`))
            .catch(err => console.error(err));
    };

    const watcher = chokidar.watch(srcDir, {
        persistent: true,
        ignored: [
            '**/.*', componentsPath
    ],
    });

    watcher
        .on('add', copyAndRenameFile)
        .on('change', copyAndRenameFile)
        .on('unlink', (srcPath) => {
            const relativePath = path.relative(srcDir, srcPath).replace(/\\/g, '/');
            let destPath;

            const splitPath = relativePath.split('/');
            if (relativePath.startsWith('templates/')) {
                destPath = path.join(destDir, relativePath);
            } else if (splitPath.length === 2) {
                destPath = path.join(destDir, relativePath);
            } else {
                destPath = path.join(destDir, splitPath[0], splitPath.slice(1).join('_'));
            }

            fs.remove(destPath)
                .then(() => console.log(`Removed ${destPath}`))
                .catch(err => console.error(err));
        })
        watcher.on('ready', () => {
            console.log('Initial scan complete. Ready for changes.');
        });
}

module.exports = {
    setupWatcher
};
