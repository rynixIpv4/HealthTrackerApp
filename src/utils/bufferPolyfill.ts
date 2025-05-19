import { Buffer as BufferPolyfill } from 'buffer';

// Make Buffer available globally
global.Buffer = global.Buffer || BufferPolyfill;

/**
 * Safely converts a value to a Buffer
 * 
 * @param value The value to convert to Buffer
 * @param encoding The encoding to use (default: 'base64')
 * @returns The Buffer or null if conversion fails
 */
export const safeBufferFrom = (value: any, encoding: BufferEncoding = 'base64'): Buffer | null => {
  if (!value) return null;
  
  try {
    return Buffer.from(value, encoding);
  } catch (error) {
    console.error(`Error creating Buffer from value: ${error}`);
    return null;
  }
};

export default BufferPolyfill; 