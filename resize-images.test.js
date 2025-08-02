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

      // Check input argument structure
      expect(ARGUMENT_DEFINITIONS.input).toHaveProperty('variants');
      expect(ARGUMENT_DEFINITIONS.input).toHaveProperty('description');
      expect(ARGUMENT_DEFINITIONS.input).toHaveProperty('errorMessage');
      expect(ARGUMENT_DEFINITIONS.input.variants).toEqual(['-i', '-input']);

      // Check output argument structure
      expect(ARGUMENT_DEFINITIONS.output).toHaveProperty('variants');
      expect(ARGUMENT_DEFINITIONS.output).toHaveProperty('description');
      expect(ARGUMENT_DEFINITIONS.output).toHaveProperty('errorMessage');
      expect(ARGUMENT_DEFINITIONS.output.variants).toEqual(['-o', '-output']);
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
      expect(plainText).toContain('Input folder containing images to resize');
      expect(plainText).toContain('Output folder where resized images will be saved');
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

    it('should throw error when parsing and validating incomplete arguments', () => {
      const args = ['-i', '/input/folder']; // Missing output
      const options = parseArguments(args);

      expect(() => validateArguments(options)).toThrow('Output folder is required. Use -o or -output to specify output folder.');
    });
  });
});
