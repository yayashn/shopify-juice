#!/usr/bin/env node
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs-extra');
const components = require('./components');
const crypto = require('crypto');

const srcDir = path.resolve(process.cwd(), 'src');
const buildDir = path.resolve(process.cwd(), 'build');

components.loadAllComponents(srcDir);

const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

function computeFileHash(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(data).digest('hex');
}

const fileHashes = {}; // Map filePath to its content hash

function computeContentHash(content) {
    return crypto.createHash('md5').update(content).digest('hex');
  }

const coreFolders = ['assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'];


fs.ensureDirSync(buildDir);
coreFolders.forEach(folder => fs.ensureDirSync(path.join(buildDir, folder)));

const configFilePathSrc = path.join(srcDir, 'config', 'settings_schema.json'); // example config file
const configFilePathBuild = path.join(buildDir, 'config', 'settings_schema.json');

if (!fs.existsSync(configFilePathBuild) || fs.readFileSync(configFilePathBuild, 'utf8').trim() === '') {
    if (fs.existsSync(configFilePathSrc)) {
        fs.copySync(configFilePathSrc, configFilePathBuild);
        console.log('Initial config file copied from src to build.');
    } else {
        console.log('Warning: No initial config file found in src.');
    }
}

const watcher = chokidar.watch(srcDir, {
  persistent: true,
  ignored: [path.join(srcDir, 'config')],  // Ignore the 'config' folder in src
  ignoreInitial: false
});

watcher.on('add', processFile).on('change', (filePath) => {
  const relativePath = path.relative(srcDir, filePath);
  const segments = relativePath.split(path.sep);

  // If the changed file is in a non-core folder, reprocess all core files
  if (!coreFolders.includes(segments[0])) {
      coreFolders.forEach(folder => {
          const folderPath = path.join(srcDir, folder);
          fs.readdirSync(folderPath).forEach(item => {
              const itemPath = path.join(folderPath, item);
              if (fs.statSync(itemPath).isFile()) {
                  processFile(itemPath);
              }
          });
      });
  } else {
      processFile(filePath);
  }
});

watcher.on('unlink', filePath => {
  const buildFilePath = getBuildFilePath(filePath);
  if (buildFilePath) fs.removeSync(buildFilePath);
});

// Watcher for the build/config folder
const configWatcher = chokidar.watch(path.join(buildDir, 'config'), { persistent: true, ignoreInitial: true });

configWatcher
    .on('change', (filePath) => {
        const relativePath = path.relative(buildDir, filePath);
        const srcFilePath = path.join(srcDir, relativePath);
        fs.copySync(filePath, srcFilePath);
    })
    .on('add', (filePath) => {
        const relativePath = path.relative(buildDir, filePath);
        const srcFilePath = path.join(srcDir, relativePath);
        fs.copySync(filePath, srcFilePath);
    })
    .on('unlink', (filePath) => {
        const relativePath = path.relative(buildDir, filePath);
        const srcFilePath = path.join(srcDir, relativePath);
        if (fs.existsSync(srcFilePath)) {
            fs.removeSync(srcFilePath);
        }
    });

async function processFile(filePath) {
    await components.loadAllComponents(srcDir);
    const buildFilePath = getBuildFilePath(filePath);
    if (!buildFilePath) return;
    
    fs.ensureDirSync(path.dirname(buildFilePath));
    
    if (imageExtensions.includes(path.extname(filePath).toLowerCase())) {
        if (!fs.existsSync(buildFilePath) || computeFileHash(filePath) !== computeFileHash(buildFilePath)) {
            fs.copySync(filePath, buildFilePath);
        }
    } else {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/['"]([^'"]+\/[^'"]+)['"]/g, (match, p1) => {
            const segments = p1.split('/');
            if (segments.length > 2 && coreFolders.includes(segments[0])) {
                return `'${segments[0]}/${segments.slice(1).join('_')}'`;
            }
            return match;
        });
    
        content = components.replaceComponents(content);
        
        // Check if the file content has changed
        const newContentHash = computeContentHash(content);
        if (fileHashes[buildFilePath] !== newContentHash) {
            fs.writeFileSync(buildFilePath, content, 'utf8');
            fileHashes[buildFilePath] = newContentHash; // Update the hash
        }
    }
}
      

function getBuildFilePath(filePath) {
  const relativePath = path.relative(srcDir, filePath);
  const segments = relativePath.split(path.sep);

  if (coreFolders.includes(segments[0])) {
      if (segments.length > 2) {
          return path.join(buildDir, segments[0], segments.slice(1).join('_'));
      }
      return path.join(buildDir, ...segments);
  }

  return null;
}

console.log('Build tool is running...');