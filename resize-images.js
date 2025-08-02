// resize-images.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Argument definitions with metadata
const ARGUMENT_DEFINITIONS = {
  input: {
    variants: ['-i', '-input'],
    description: 'Input folder containing images to resize',
    errorMessage: 'Input folder is required. Use -i or -input to specify input folder.'
  },
  output: {
    variants: ['-o', '-output'],
    description: 'Output folder where resized images will be saved',
    errorMessage: 'Output folder is required. Use -o or -output to specify output folder.'
  }
};

// Parse command line arguments
function parseArguments(args = process.argv.slice(2)) {
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Check each argument definition
    for (const [key, definition] of Object.entries(ARGUMENT_DEFINITIONS)) {
      if (definition.variants.includes(arg)) {
        options[key] = args[i + 1];
        i++; // Skip next argument as it's the value
        break;
      }
    }
  }

  return options;
}

// Validate arguments and throw error if missing
function validateArguments(options) {
  for (const [key, definition] of Object.entries(ARGUMENT_DEFINITIONS)) {
    if (!options[key]) {
      throw new Error(definition.errorMessage);
    }
  }
}

// Generate help text from argument definitions
function generateHelpText() {
  let helpText = 'Usage: node resize-images.js [options]\n\n';
  helpText += 'Options:\n';

  for (const [key, definition] of Object.entries(ARGUMENT_DEFINITIONS)) {
    const variants = definition.variants.join(', ');
    helpText += `  ${variants} <value>    ${definition.description}\n`;
  }

  return helpText;
}

// Main resize function
function resizeImages(inputFolder, outputFolder, outputWidth = 350) {
  // Ensure output folder exists
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    fs.readdir(inputFolder, (err, files) => {
      if (err) {
        reject(new Error(`Error reading folder: ${err.message}`));
        return;
      }

      // Match JPG, JPEG, PNG (case-insensitive)
      const imageFiles = files.filter(f => /\.(jpe?g|png)$/i.test(f));

      if (imageFiles.length === 0) {
        resolve('No JPG or PNG images found in folder.');
        return;
      }

      const resizePromises = imageFiles.map(file => {
        return new Promise((resolveFile, rejectFile) => {
          const inputPath = path.join(inputFolder, file);
          const outputPath = path.join(outputFolder, file);

          const cmd = `ffmpeg -y -i "${inputPath}" -vf "scale=${outputWidth}:-1" "${outputPath}"`;
          exec(cmd, (error, stdout, stderr) => {
            if (error) {
              rejectFile(new Error(`Error resizing ${file}: ${error.message}`));
              return;
            }
            resolveFile(`Resized ${file} -> ${outputPath}`);
          });
        });
      });

      Promise.all(resizePromises)
        .then(results => resolve(results))
        .catch(error => reject(error));
    });
  });
}

// Main execution (only if this file is run directly)
if (require.main === module) {
  try {
    const options = parseArguments();
    validateArguments(options);

    const inputFolder = options.input;
    const outputFolder = options.output;
    const outputWidth = 350; // Change this to your desired width

    resizeImages(inputFolder, outputFolder, outputWidth)
      .then(results => {
        if (Array.isArray(results)) {
          results.forEach(result => console.log(result));
        } else {
          console.log(results);
        }
      })
      .catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
      });
  } catch (error) {
    console.error('Error:', error.message);
    console.error(generateHelpText());
    process.exit(1);
  }
}

// Export functions for testing
module.exports = {
  parseArguments,
  validateArguments,
  resizeImages,
  ARGUMENT_DEFINITIONS,
  generateHelpText
};
