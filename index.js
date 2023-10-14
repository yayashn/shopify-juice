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

/**
 * An array of Shopify's core folders.
 * @type {string[]}
 */
const coreFolders = ['assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'];

// Ensure build directory and core folders exist
fs.ensureDirSync(buildDir);
coreFolders.forEach(folder => fs.ensureDirSync(path.join(buildDir, folder)));

// Set up the file watcher
const watcher = chokidar.watch(srcDir, { persistent: true, ignoreInitial: false });


/**
 * Callback function to handle file addition and modification.
 * @param {string} filePath - The path to the file being processed.
 */
watcher.on('add', processFile).on('change', (filePath) => {
  const relativePath = path.relative(srcDir, filePath);
  const segments = relativePath.split(path.sep);

  // If the changed file is in a non-core folder, reprocess all core files
  if (!coreFolders.includes(segments[0])) {
      coreFolders.forEach(folder => {
          const folderPath = path.join(srcDir, folder);
          fs.readdirSync(folderPath).forEach(item => {
              const itemPath = path.join(folderPath, item);
              if (fs.statSync(itemPath).isFile()) { // Ensure it's a file
                  processFile(itemPath);
              }
          });
      });
  } else {
      processFile(filePath);
  }
});


/**
 * Callback function to handle file deletion.
 * @param {string} filePath - The path to the file being deleted.
 */
watcher.on('unlink', filePath => {
  const buildFilePath = getBuildFilePath(filePath);
  if (buildFilePath) fs.removeSync(buildFilePath);
});

/**
 * Processes a file from the src directory and copies it to the build directory.
 * @function
 * @param {string} filePath - The path to the file being processed.
 */
async function processFile(filePath) {
  await components.loadAllComponents(srcDir); // Reload components
  const buildFilePath = getBuildFilePath(filePath);
  if (!buildFilePath) return; // Do not process non-core files further

  fs.ensureDirSync(path.dirname(buildFilePath));

  // Check if the file is an image
  if (imageExtensions.includes(path.extname(filePath).toLowerCase())) {
      // Check if the destination file exists and if their hashes are different
      if (!fs.existsSync(buildFilePath) || computeFileHash(filePath) !== computeFileHash(buildFilePath)) {
          fs.copySync(filePath, buildFilePath); // Copy the image if it's different or if it doesn't exist in the destination
      }
  } else {
      let content = fs.readFileSync(filePath, 'utf8');

      // Replace illegal subfolder paths in file paths enclosed in quotes
      content = content.replace(/['"]([^'"]+\/[^'"]+)['"]/g, (match, p1) => {
          const segments = p1.split('/');
          if (segments.length > 2 && coreFolders.includes(segments[0])) {
              return `'${segments[0]}/${segments.slice(1).join('_')}'`; // Convert illegal subfolder paths
          }
          return match; // Return the original match if the path is legal
      });

      content = components.replaceComponents(content); // Replace component tags
      fs.writeFileSync(buildFilePath, content, 'utf8');
  }
}

/**
 * Converts a file path from the src directory to a corresponding path in the build directory.
 * @function
 * @param {string} filePath - The path to the file in the src directory.
 * @returns {?string} - The corresponding path in the build directory, or null if the file is in a non-core folder.
 */
function getBuildFilePath(filePath) {
  const relativePath = path.relative(srcDir, filePath);
  const segments = relativePath.split(path.sep);

  // If the file is within a core folder, preserve the folder structure
  if (coreFolders.includes(segments[0])) {
      // For non-core subfolders, flatten the structure
      if (segments.length > 2) {
          return path.join(buildDir, segments[0], segments.slice(1).join('_'));
      }
      return path.join(buildDir, ...segments);
  }

  // Do not copy files in non-core folders to the build directory
  return null;
}


console.log('Build tool is running...');
