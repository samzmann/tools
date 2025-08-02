// resize-images.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const inputFolder = process.argv[2]; // input folder
const outputFolder = process.argv[3]; // output folder
const outputWidth = 350; // Change this to your desired width

if (!inputFolder || !outputFolder) {
  console.error('Usage: node resize-images.js <input-folder> <output-folder>');
  process.exit(1);
}

// Ensure output folder exists
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

fs.readdir(inputFolder, (err, files) => {
  if (err) {
    console.error('Error reading folder:', err);
    process.exit(1);
  }

  // Match JPG, JPEG, PNG (case-insensitive)
  const imageFiles = files.filter(f => /\.(jpe?g|png)$/i.test(f));

  if (imageFiles.length === 0) {
    console.log('No JPG or PNG images found in folder.');
    return;
  }

  imageFiles.forEach(file => {
    const inputPath = path.join(inputFolder, file);
    const outputPath = path.join(outputFolder, file);

    const cmd = `ffmpeg -y -i "${inputPath}" -vf "scale=${outputWidth}:-1" "${outputPath}"`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error resizing ${file}:`, error);
        return;
      }
      console.log(`Resized ${file} -> ${outputPath}`);
    });
  });
});
