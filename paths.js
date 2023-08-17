const path = require('path');

const srcDir = './src';
const destDir = './build';
const componentsPath = path.join(srcDir, 'components');

module.exports = {
  srcDir,
  destDir,
  componentsPath
};
