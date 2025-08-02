// resize-images.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Color utility functions
const colorize = {
  error: (text) => `${colors.bright}${colors.white}${colors.bgRed}${text}${colors.reset}`,
  success: (text) => `${colors.bright}${colors.green}${text}${colors.reset}`,
  info: (text) => `${colors.bright}${colors.blue}${text}${colors.reset}`,
  warning: (text) => `${colors.bright}${colors.yellow}${text}${colors.reset}`
};

// Helper function to strip ANSI color codes for testing
const stripColors = (text) => {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
};

// Argument definitions with metadata
const ARGUMENT_DEFINITIONS = {
  input: {
    variants: ['-i', '-input'],
    description: 'Input folder containing images to resize',
    errorMessage: 'Input folder is required. Use -i or -input to specify input folder.',
    required: true
  },
  output: {
    variants: ['-o', '-output'],
    description: 'Output folder where resized images will be saved',
    errorMessage: 'Output folder is required. Use -o or -output to specify output folder.',
    required: true
  },
  size: {
    variants: ['-s', '-size'],
    description: 'Output width for resized images (default: 350)',
    errorMessage: 'Size must be a valid number. Use -s or -size to specify output width.',
    required: false,
    defaultValue: 350
  },
  format: {
    variants: ['-f', '-format'],
    description: 'Output format for images (jpg, png, webp)',
    errorMessage: 'Format must be jpg, png, or webp. Use -f or -format to specify output format.',
    required: false,
    defaultValue: null
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
    if (definition.required && !options[key]) {
      throw new Error(definition.errorMessage);
    }

    // Validate size argument if provided
    if (key === 'size' && options[key]) {
      const sizeValue = parseInt(options[key]);
      if (isNaN(sizeValue) || sizeValue <= 0) {
        throw new Error('Size must be a positive number.');
      }
    }

    // Validate format argument if provided
    if (key === 'format' && options[key] !== undefined) {
      const validFormats = ['jpg', 'png', 'webp'];
      if (!validFormats.includes(options[key].toLowerCase())) {
        throw new Error('Format must be jpg, png, or webp.');
      }
    }
  }
}

// Generate help text from argument definitions
function generateHelpText() {
  let helpText = `${colorize.info('Usage: node resize-images.js [options]')}\n\n`;
  helpText += `${colorize.info('Options:')}\n`;

  for (const [key, definition] of Object.entries(ARGUMENT_DEFINITIONS)) {
    const variants = definition.variants.join(', ');
    const requiredText = definition.required ? ' (required)' : ' (optional)';
    const defaultValueText = definition.defaultValue ? ` [default: ${definition.defaultValue}]` : '';
    helpText += `  ${colorize.success(variants)} <value>    ${definition.description}${requiredText}${defaultValueText}\n`;
  }

  return helpText;
}

// Main resize function
function resizeImages(inputFolder, outputFolder, outputWidth = 350, outputFormat = null) {
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

          // Determine output filename and extension
          let outputFilename = file;
          if (outputFormat) {
            const nameWithoutExt = path.parse(file).name;
            outputFilename = `${nameWithoutExt}.${outputFormat}`;
          }
          const outputPath = path.join(outputFolder, outputFilename);

          // Build ffmpeg command with format conversion if specified
          let cmd = `ffmpeg -y -i "${inputPath}" -vf "scale=${outputWidth}:-1"`;
          if (outputFormat) {
            cmd += ` -f ${outputFormat}`;
          }
          cmd += ` "${outputPath}"`;

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
    const outputWidth = options.size ? parseInt(options.size) : ARGUMENT_DEFINITIONS.size.defaultValue;
    const outputFormat = options.format ? options.format.toLowerCase() : null;

    resizeImages(inputFolder, outputFolder, outputWidth, outputFormat)
      .then(results => {
        if (Array.isArray(results)) {
          results.forEach(result => console.log(colorize.success(result)));
        } else {
          console.log(colorize.info(results));
        }
      })
      .catch(error => {
        console.error(colorize.error('ERROR:'), error.message);
        process.exit(1);
      });
  } catch (error) {
    console.error(colorize.error('ERROR:'), error.message);
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
  generateHelpText,
  colors,
  colorize,
  stripColors
};
