import { vi, describe, it, expect } from 'vitest';
import { parsePdfBuffer, parseWordBuffer, detectFileType, extractFields } from '../src/parser';

vi.mock('pdf-parse', () => ({
  default: vi.fn().mockResolvedValue({ text: 'extracted pdf text' }),
}));

describe('Resume Parser', () => {
  it('parsePdfBuffer extracts text from PDF buffer', async () => {
    const pdfBuffer = Buffer.from('dummy pdf content');
    const text = await parsePdfBuffer(pdfBuffer);
    expect(text).toBe('extracted pdf text');
    expect(typeof text).toBe('string');
  });

  it('parseWordBuffer throws on non-docx input', async () => {
    const notDocx = Buffer.from('not a word file');
    await expect(parseWordBuffer(notDocx)).rejects.toThrow();
  });

  it('detectFileType returns correct type', () => {
    expect(detectFileType('resume.pdf')).toBe('pdf');
    expect(detectFileType('resume.docx')).toBe('docx');
    expect(detectFileType('resume.jpg')).toBe('unknown');
    expect(detectFileType('RESUME.PDF')).toBe('pdf');
  });

  it('extractFields finds email and phone', () => {
    const text = `张三
    前端工程师 | 北京
    zhang@example.com
    手机: 13800138000
    技能: React, TypeScript, Node.js`;

    const fields = extractFields(text);
    expect(fields.email).toBe('zhang@example.com');
    expect(fields.phone).toBe('13800138000');
  });

  it('extractFields returns empty strings when nothing found', () => {
    const fields = extractFields('');
    expect(fields.email).toBe('');
    expect(fields.phone).toBe('');
    expect(fields.name).toBe('');
  });
});
