const path = require('path');
const fs = require('fs');

copyRecursiveSync = function (src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach(function (childItemName) {
      copyRecursiveSync(path.join(src, childItemName),
        path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

rmDir = function (dirPath) {
  try { var files = fs.readdirSync(dirPath); }
  catch (e) { return; }
  if (files.length > 0)
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
      else
        rmDir(filePath);
    }
};


const src = path.join(__dirname, 'client', 'dist', 'client');
const dst = path.join(__dirname, 'lib', 'configurationsrv', 'client');

console.log(src);
console.log(dst);

rmDir(dst);
copyRecursiveSync(src, dst);
