// Generated: 2026-01-25 06:40:00 KST

import { validateFile, sanitizeFilename, getMimeType, getExtension } from '@/lib/file-utils';

describe('file-utils', () => {
  describe('validateFile', () => {
    function createMockFile(name: string, size: number, type: string): File {
      const blob = new Blob(['x'.repeat(size)], { type });
      return new File([blob], name, { type });
    }

    it('should accept valid PDF file', () => {
      const file = createMockFile('report.pdf', 1024, 'application/pdf');
      expect(validateFile(file)).toEqual({ valid: true });
    });

    it('should accept valid DOCX file', () => {
      const file = createMockFile('doc.docx', 1024, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(validateFile(file)).toEqual({ valid: true });
    });

    it('should accept valid XLSX file', () => {
      const file = createMockFile('data.xlsx', 1024, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(validateFile(file)).toEqual({ valid: true });
    });

    it('should accept valid JPG file', () => {
      const file = createMockFile('photo.jpg', 1024, 'image/jpeg');
      expect(validateFile(file)).toEqual({ valid: true });
    });

    it('should accept valid PNG file', () => {
      const file = createMockFile('image.png', 1024, 'image/png');
      expect(validateFile(file)).toEqual({ valid: true });
    });

    it('should reject file over 10MB', () => {
      const file = createMockFile('big.pdf', 11 * 1024 * 1024, 'application/pdf');
      expect(validateFile(file)).toEqual({ valid: false, error: 'File size exceeds 10MB limit' });
    });

    it('should reject .exe extension', () => {
      const file = createMockFile('virus.exe', 1024, 'application/x-msdownload');
      expect(validateFile(file)).toEqual({ valid: false, error: 'File type not allowed' });
    });

    it('should reject file with no extension', () => {
      const file = createMockFile('noext', 1024, 'application/octet-stream');
      expect(validateFile(file)).toEqual({ valid: false, error: 'File type not allowed' });
    });

    it('should reject MIME type mismatch', () => {
      const file = createMockFile('fake.pdf', 1024, 'image/png');
      expect(validateFile(file)).toEqual({ valid: false, error: 'MIME type mismatch' });
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove ../ from filename', () => {
      expect(sanitizeFilename('../../etc/passwd.pdf')).toBe('etcpasswd.pdf');
    });

    it('should remove forward slashes', () => {
      expect(sanitizeFilename('path/to/file.pdf')).toBe('pathtofile.pdf');
    });

    it('should remove backslashes', () => {
      expect(sanitizeFilename('path\\to\\file.pdf')).toBe('pathtofile.pdf');
    });

    it('should remove XSS characters', () => {
      expect(sanitizeFilename('<script>alert("xss")</script>.pdf')).toBe('scriptalert(xss)script.pdf');
    });

    it('should remove & character', () => {
      expect(sanitizeFilename('file&name.pdf')).toBe('filename.pdf');
    });

    it('should trim whitespace', () => {
      expect(sanitizeFilename('  file.pdf  ')).toBe('file.pdf');
    });

    it('should handle normal filenames unchanged', () => {
      expect(sanitizeFilename('report_2026.pdf')).toBe('report_2026.pdf');
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME for pdf', () => {
      expect(getMimeType('pdf')).toBe('application/pdf');
    });

    it('should return correct MIME for docx', () => {
      expect(getMimeType('docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    it('should return correct MIME for xlsx', () => {
      expect(getMimeType('xlsx')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should return correct MIME for jpg', () => {
      expect(getMimeType('jpg')).toBe('image/jpeg');
    });

    it('should return correct MIME for png', () => {
      expect(getMimeType('png')).toBe('image/png');
    });

    it('should return octet-stream for unknown extension', () => {
      expect(getMimeType('xyz')).toBe('application/octet-stream');
    });
  });

  describe('getExtension', () => {
    it('should extract extension from filename', () => {
      expect(getExtension('file.pdf')).toBe('pdf');
    });

    it('should return lowercase extension', () => {
      expect(getExtension('FILE.PDF')).toBe('pdf');
    });

    it('should return last extension for multiple dots', () => {
      expect(getExtension('archive.tar.gz')).toBe('gz');
    });

    it('should return empty string for no extension', () => {
      expect(getExtension('noext')).toBe('noext');
    });
  });
});
