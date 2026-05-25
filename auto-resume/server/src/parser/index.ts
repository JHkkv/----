import { parsePdfBuffer } from './pdf';
import { parseWordBuffer } from './word';

export { parsePdfBuffer, parseWordBuffer };

export type FileType = 'pdf' | 'docx' | 'unknown';

export function detectFileType(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  return 'unknown';
}

export async function parseResumeFile(buffer: Buffer, filename: string): Promise<string> {
  const type = detectFileType(filename);
  switch (type) {
    case 'pdf':
      return parsePdfBuffer(buffer);
    case 'docx':
      return parseWordBuffer(buffer);
    default:
      throw new Error(`Unsupported file type: ${filename}. Supported: .pdf, .docx`);
  }
}

export function extractFields(text: string): {
  name: string;
  phone: string;
  email: string;
} {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/1[3-9]\d{9}/);
  const email = emailMatch ? emailMatch[0] : '';
  const phone = phoneMatch ? phoneMatch[0] : '';

  // Assume first non-empty line that's not contact info is the name
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let name = '';
  for (const line of lines) {
    if (!line.includes('@') && !line.match(/^1[3-9]\d{9}$/) && line.length <= 10 && !line.startsWith('http')) {
      name = line;
      break;
    }
  }

  return { name, phone, email };
}
