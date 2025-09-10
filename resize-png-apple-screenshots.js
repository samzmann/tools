#!/usr/bin/env node

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// --- Config ---
const WIDTH = 1320;
const HEIGHT = 2868;

// --- Input directory ---
const inputDir = process.argv[2];
if (!inputDir) {
  console.error("Usage: node resize-pngs.js <directory>");
  process.exit(1);
}

const absDir = path.resolve(inputDir);

// --- Ensure directory exists ---
if (!fs.existsSync(absDir) || !fs.lstatSync(absDir).isDirectory()) {
  console.error("Error: Provided path is not a directory.");
  process.exit(1);
}

// --- Process files ---
fs.readdirSync(absDir).forEach((file) => {
  if (file.toLowerCase().endsWith(".png")) {
    const inputPath = path.join(absDir, file);
    const outputPath = path.join(absDir, `resized_${file}`);

    const cmd = `ffmpeg -y -i "${inputPath}" -vf "scale=${WIDTH}:${HEIGHT}" "${outputPath}"`;

    console.log(`Resizing: ${file} -> resized_${file}`);
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error processing ${file}:`, error.message);
      } else {
        console.log(`✅ Done: ${outputPath}`);
      }
    });
  }
});
