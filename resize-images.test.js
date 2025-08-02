import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the fs and child_process modules
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readdir: vi.fn()
  }
}));

vi.mock('child_process', () => ({
  exec: vi.fn()
}));

// Import the functions to test
const { parseArguments, validateArguments, ARGUMENT_DEFINITIONS, generateHelpText, colors, colorize, stripColors } = require('./resize-images.js');

describe('resize-images', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ARGUMENT_DEFINITIONS', () => {
    it('should have proper structure for each argument', () => {
      expect(ARGUMENT_DEFINITIONS).toHaveProperty('input');
      expect(ARGUMENT_DEFINITIONS).toHaveProperty('output');
      expect(ARGUMENT_DEFINITIONS).toHaveProperty('size');

      // Check input argument structure
      expect(ARGUMENT_DEFINITIONS.input).toHaveProperty('variants');
      expect(ARGUMENT_DEFINITIONS.input).toHaveProperty('description');
      expect(ARGUMENT_DEFINITIONS.input).toHaveProperty('errorMessage');
      expect(ARGUMENT_DEFINITIONS.input).toHaveProperty('required');
      expect(ARGUMENT_DEFINITIONS.input.variants).toEqual(['-i', '-input']);
      expect(ARGUMENT_DEFINITIONS.input.required).toBe(true);

      // Check output argument structure
      expect(ARGUMENT_DEFINITIONS.output).toHaveProperty('variants');
      expect(ARGUMENT_DEFINITIONS.output).toHaveProperty('description');
      expect(ARGUMENT_DEFINITIONS.output).toHaveProperty('errorMessage');
      expect(ARGUMENT_DEFINITIONS.output).toHaveProperty('required');
      expect(ARGUMENT_DEFINITIONS.output.variants).toEqual(['-o', '-output']);
      expect(ARGUMENT_DEFINITIONS.output.required).toBe(true);

      // Check size argument structure
      expect(ARGUMENT_DEFINITIONS.size).toHaveProperty('variants');
      expect(ARGUMENT_DEFINITIONS.size).toHaveProperty('description');
      expect(ARGUMENT_DEFINITIONS.size).toHaveProperty('errorMessage');
      expect(ARGUMENT_DEFINITIONS.size).toHaveProperty('required');
      expect(ARGUMENT_DEFINITIONS.size).toHaveProperty('defaultValue');
      expect(ARGUMENT_DEFINITIONS.size.variants).toEqual(['-s', '-size']);
      expect(ARGUMENT_DEFINITIONS.size.required).toBe(false);
      expect(ARGUMENT_DEFINITIONS.size.defaultValue).toBe(350);

      // Check format argument structure
      expect(ARGUMENT_DEFINITIONS).toHaveProperty('format');
      expect(ARGUMENT_DEFINITIONS.format).toHaveProperty('variants');
      expect(ARGUMENT_DEFINITIONS.format).toHaveProperty('description');
      expect(ARGUMENT_DEFINITIONS.format).toHaveProperty('errorMessage');
      expect(ARGUMENT_DEFINITIONS.format).toHaveProperty('required');
      expect(ARGUMENT_DEFINITIONS.format).toHaveProperty('defaultValue');
      expect(ARGUMENT_DEFINITIONS.format.variants).toEqual(['-f', '-format']);
      expect(ARGUMENT_DEFINITIONS.format.required).toBe(false);
      expect(ARGUMENT_DEFINITIONS.format.defaultValue).toBe(null);
    });
  });

  describe('parseArguments', () => {
    it('should parse -i and -o arguments correctly', () => {
      const args = ['-i', '/input/folder', '-o', '/output/folder'];
      const result = parseArguments(args);

      expect(result).toEqual({
        input: '/input/folder',
        output: '/output/folder'
      });
    });

    it('should parse -input and -output arguments correctly', () => {
      const args = ['-input', '/input/folder', '-output', '/output/folder'];
      const result = parseArguments(args);

      expect(result).toEqual({
        input: '/input/folder',
        output: '/output/folder'
      });
    });

    it('should handle mixed argument styles', () => {
      const args = ['-i', '/input/folder', '-output', '/output/folder'];
      const result = parseArguments(args);

      expect(result).toEqual({
        input: '/input/folder',
        output: '/output/folder'
      });
    });

    it('should return empty object when no arguments provided', () => {
      const result = parseArguments([]);
      expect(result).toEqual({});
    });

    it('should ignore unknown arguments', () => {
      const args = ['-i', '/input/folder', '-unknown', 'value', '-o', '/output/folder'];
      const result = parseArguments(args);

      expect(result).toEqual({
        input: '/input/folder',
        output: '/output/folder'
      });
    });

    it('should parse size argument with -s', () => {
      const args = ['-i', '/input/folder', '-o', '/output/folder', '-s', '500'];
      const result = parseArguments(args);

      expect(result).toEqual({
        input: '/input/folder',
        output: '/output/folder',
        size: '500'
      });
    });

    it('should parse size argument with -size', () => {
      const args = ['-i', '/input/folder', '-o', '/output/folder', '-size', '800'];
      const result = parseArguments(args);

      expect(result).toEqual({
        input: '/input/folder',
        output: '/output/folder',
        size: '800'
      });
    });

    it('should parse all arguments together', () => {
      const args = ['-input', '/input/folder', '-output', '/output/folder', '-size', '600'];
      const result = parseArguments(args);

      expect(result).toEqual({
        input: '/input/folder',
        output: '/output/folder',
        size: '600'
      });
    });

    it('should parse format argument with -f', () => {
      const args = ['-i', '/input/folder', '-o', '/output/folder', '-f', 'jpg'];
      const result = parseArguments(args);

      expect(result).toEqual({
        input: '/input/folder',
        output: '/output/folder',
        format: 'jpg'
      });
    });

    it('should parse format argument with -format', () => {
      const args = ['-i', '/input/folder', '-o', '/output/folder', '-format', 'png'];
      const result = parseArguments(args);

      expect(result).toEqual({
        input: '/input/folder',
        output: '/output/folder',
        format: 'png'
      });
    });

    it('should parse all arguments including format', () => {
      const args = ['-input', '/input/folder', '-output', '/output/folder', '-size', '600', '-format', 'webp'];
      const result = parseArguments(args);

      expect(result).toEqual({
        input: '/input/folder',
        output: '/output/folder',
        size: '600',
        format: 'webp'
      });
    });
  });

  describe('validateArguments', () => {
    it('should not throw error when both input and output are provided', () => {
      const options = {
        input: '/input/folder',
        output: '/output/folder'
      };

      expect(() => validateArguments(options)).not.toThrow();
    });

    it('should throw error when input is missing', () => {
      const options = {
        output: '/output/folder'
      };

      expect(() => validateArguments(options)).toThrow('Input folder is required. Use -i or -input to specify input folder.');
    });

    it('should throw error when output is missing', () => {
      const options = {
        input: '/input/folder'
      };

      expect(() => validateArguments(options)).toThrow('Output folder is required. Use -o or -output to specify output folder.');
    });

    it('should throw error when both input and output are missing', () => {
      const options = {};

      expect(() => validateArguments(options)).toThrow('Input folder is required. Use -i or -input to specify input folder.');
    });

    it('should throw error when input is empty string', () => {
      const options = {
        input: '',
        output: '/output/folder'
      };

      expect(() => validateArguments(options)).toThrow('Input folder is required. Use -i or -input to specify input folder.');
    });

    it('should throw error when output is empty string', () => {
      const options = {
        input: '/input/folder',
        output: ''
      };

      expect(() => validateArguments(options)).toThrow('Output folder is required. Use -o or -output to specify output folder.');
    });

    it('should not throw error when size is missing (optional argument)', () => {
      const options = {
        input: '/input/folder',
        output: '/output/folder'
      };

      expect(() => validateArguments(options)).not.toThrow();
    });

    it('should not throw error when size is provided with valid number', () => {
      const options = {
        input: '/input/folder',
        output: '/output/folder',
        size: '500'
      };

      expect(() => validateArguments(options)).not.toThrow();
    });

    it('should throw error when size is provided with invalid number', () => {
      const options = {
        input: '/input/folder',
        output: '/output/folder',
        size: 'invalid'
      };

      expect(() => validateArguments(options)).toThrow('Size must be a positive number.');
    });

    it('should throw error when size is provided with zero', () => {
      const options = {
        input: '/input/folder',
        output: '/output/folder',
        size: '0'
      };

      expect(() => validateArguments(options)).toThrow('Size must be a positive number.');
    });

    it('should throw error when size is provided with negative number', () => {
      const options = {
        input: '/input/folder',
        output: '/output/folder',
        size: '-100'
      };

      expect(() => validateArguments(options)).toThrow('Size must be a positive number.');
    });

    it('should not throw error when format is missing (optional argument)', () => {
      const options = {
        input: '/input/folder',
        output: '/output/folder'
      };

      expect(() => validateArguments(options)).not.toThrow();
    });

    it('should not throw error when format is provided with valid jpg', () => {
      const options = {
        input: '/input/folder',
        output: '/output/folder',
        format: 'jpg'
      };

      expect(() => validateArguments(options)).not.toThrow();
    });

    it('should not throw error when format is provided with valid png', () => {
      const options = {
        input: '/input/folder',
        output: '/output/folder',
        format: 'png'
      };

      expect(() => validateArguments(options)).not.toThrow();
    });

    it('should not throw error when format is provided with valid webp', () => {
      const options = {
        input: '/input/folder',
        output: '/output/folder',
        format: 'webp'
      };

      expect(() => validateArguments(options)).not.toThrow();
    });

    it('should not throw error when format is provided with valid uppercase format', () => {
      const options = {
        input: '/input/folder',
        output: '/output/folder',
        format: 'JPG'
      };

      expect(() => validateArguments(options)).not.toThrow();
    });

    it('should throw error when format is provided with invalid format', () => {
      const options = {
        input: '/input/folder',
        output: '/output/folder',
        format: 'gif'
      };

      expect(() => validateArguments(options)).toThrow('Format must be jpg, png, or webp.');
    });

    it('should throw error when format is provided with empty string', () => {
      const options = {
        input: '/input/folder',
        output: '/output/folder',
        format: ''
      };

      expect(() => validateArguments(options)).toThrow('Format must be jpg, png, or webp.');
    });
  });

  describe('generateHelpText', () => {
    it('should generate proper help text with all arguments', () => {
      const helpText = generateHelpText();
      const plainText = stripColors(helpText);

      // Test that the help text contains the expected content (without color codes)
      expect(plainText).toContain('Usage: node resize-images.js [options]');
      expect(plainText).toContain('Options:');
      expect(plainText).toContain('-i, -input <value>');
      expect(plainText).toContain('-o, -output <value>');
      expect(plainText).toContain('-s, -size <value>');
      expect(plainText).toContain('-f, -format <value>');
      expect(plainText).toContain('Input folder containing images to resize');
      expect(plainText).toContain('Output folder where resized images will be saved');
      expect(plainText).toContain('Output width for resized images (default: 350)');
      expect(plainText).toContain('Output format for images (jpg, png, webp)');
    });

    it('should include all argument variants in help text', () => {
      const helpText = generateHelpText();
      const plainText = stripColors(helpText);

      // Check that all variants are included (without color codes)
      for (const [key, definition] of Object.entries(ARGUMENT_DEFINITIONS)) {
        const variants = definition.variants.join(', ');
        expect(plainText).toContain(variants);
        expect(plainText).toContain(definition.description);
      }
    });

    it('should show required/optional status and default values in help text', () => {
      const helpText = generateHelpText();
      const plainText = stripColors(helpText);

      // Check that required arguments show as required
      expect(plainText).toContain('(required)');

      // Check that optional arguments show as optional and include default value
      expect(plainText).toContain('(optional)');
      expect(plainText).toContain('[default: 350]');
    });

    it('should contain ANSI color codes', () => {
      const helpText = generateHelpText();

      // Check that color codes are present
      expect(helpText).toContain(colors.bright);
      expect(helpText).toContain(colors.blue);
      expect(helpText).toContain(colors.green);
      expect(helpText).toContain(colors.reset);
    });

    it('should strip colors correctly', () => {
      const coloredText = colorize.success('test message');
      const strippedText = stripColors(coloredText);

      expect(strippedText).toBe('test message');
      expect(coloredText).not.toBe(strippedText); // Should be different
    });
  });

  describe('color utilities', () => {
    it('should have all required color codes', () => {
      expect(colors).toHaveProperty('reset');
      expect(colors).toHaveProperty('bright');
      expect(colors).toHaveProperty('red');
      expect(colors).toHaveProperty('green');
      expect(colors).toHaveProperty('blue');
      expect(colors).toHaveProperty('white');
      expect(colors).toHaveProperty('bgRed');
    });

    it('should have colorize functions', () => {
      expect(colorize).toHaveProperty('error');
      expect(colorize).toHaveProperty('success');
      expect(colorize).toHaveProperty('info');
      expect(colorize).toHaveProperty('warning');
    });

    it('should apply error styling correctly', () => {
      const errorText = colorize.error('ERROR:');
      expect(errorText).toContain(colors.bright);
      expect(errorText).toContain(colors.white);
      expect(errorText).toContain(colors.bgRed);
      expect(errorText).toContain(colors.reset);
    });

    it('should apply success styling correctly', () => {
      const successText = colorize.success('Success message');
      expect(successText).toContain(colors.bright);
      expect(successText).toContain(colors.green);
      expect(successText).toContain(colors.reset);
    });
  });

  describe('integration tests', () => {
    it('should parse and validate arguments successfully', () => {
      const args = ['-i', '/input/folder', '-o', '/output/folder'];
      const options = parseArguments(args);

      expect(() => validateArguments(options)).not.toThrow();
      expect(options.input).toBe('/input/folder');
      expect(options.output).toBe('/output/folder');
    });

    it('should parse and validate arguments with size successfully', () => {
      const args = ['-i', '/input/folder', '-o', '/output/folder', '-s', '500'];
      const options = parseArguments(args);

      expect(() => validateArguments(options)).not.toThrow();
      expect(options.input).toBe('/input/folder');
      expect(options.output).toBe('/output/folder');
      expect(options.size).toBe('500');
    });

    it('should throw error when parsing and validating incomplete arguments', () => {
      const args = ['-i', '/input/folder']; // Missing output
      const options = parseArguments(args);

      expect(() => validateArguments(options)).toThrow('Output folder is required. Use -o or -output to specify output folder.');
    });

    it('should throw error when size is invalid in complete argument set', () => {
      const args = ['-i', '/input/folder', '-o', '/output/folder', '-size', 'invalid'];
      const options = parseArguments(args);

      expect(() => validateArguments(options)).toThrow('Size must be a positive number.');
    });

    it('should parse and validate arguments with format successfully', () => {
      const args = ['-i', '/input/folder', '-o', '/output/folder', '-f', 'jpg'];
      const options = parseArguments(args);

      expect(() => validateArguments(options)).not.toThrow();
      expect(options.input).toBe('/input/folder');
      expect(options.output).toBe('/output/folder');
      expect(options.format).toBe('jpg');
    });

    it('should throw error when format is invalid in complete argument set', () => {
      const args = ['-i', '/input/folder', '-o', '/output/folder', '-format', 'gif'];
      const options = parseArguments(args);

      expect(() => validateArguments(options)).toThrow('Format must be jpg, png, or webp.');
    });
  });
});
