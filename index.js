#!/usr/bin/env node

const { ensureBuildDirectory, generateComponentMap } = require('./utils/fileSystem');
const { setupWatcher } = require('./watcher');
const path = require('path');

const currentDir = process.cwd();
const srcDir = `${currentDir}/src`;
const destDir = `${currentDir}/build`;
const componentsPath = path.join(srcDir, 'components');
let componentMap = {};

ensureBuildDirectory(destDir);
generateComponentMap(componentsPath, componentMap);
setupWatcher(srcDir, destDir, componentMap);