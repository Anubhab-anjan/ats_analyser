/**
 * File Parser Module
 * Extracts raw textual data from PDF, DOCX, and TXT resume files.
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract text content from an uploaded resume buffer or filepath
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original filename with extension
 * @returns {Promise<{text: string, pageCount: number, format: string, wordCount: number}>}
 */
async function parseResumeDocument(buffer, originalName) {
  const extension = path.extname(originalName).toLowerCase();
  let extractedText = '';
  let pageCount = 1;

  if (extension === '.pdf') {
    const pdfData = await pdfParse(buffer);
    extractedText = pdfData.text || '';
    pageCount = pdfData.numpages || 1;
  } else if (extension === '.docx') {
    const docxResult = await mammoth.extractRawText({ buffer: buffer });
    extractedText = docxResult.value || '';
    // Approximate page count for docx (~450 words per standard page)
    const words = extractedText.trim().split(/\s+/).length;
    pageCount = Math.max(1, Math.ceil(words / 450));
  } else if (extension === '.txt') {
    extractedText = buffer.toString('utf-8');
    const words = extractedText.trim().split(/\s+/).length;
    pageCount = Math.max(1, Math.ceil(words / 450));
  } else {
    throw new Error(`Unsupported file format: ${extension}. Allowed formats are PDF, DOCX, and TXT.`);
  }

  // Normalize line endings and multiple spaces
  const cleanedText = cleanText(extractedText);
  const words = cleanedText.length > 0 ? cleanedText.trim().split(/\s+/).filter(Boolean).length : 0;

  return {
    text: cleanedText,
    rawText: extractedText,
    pageCount: pageCount,
    format: extension.replace('.', '').toUpperCase(),
    wordCount: words
  };
}

/**
 * Standardize text formatting for NLP extraction
 */
function cleanText(raw) {
  if (!raw) return '';
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\t\f\v]/g, ' ')
    .replace(/[ \u00A0]+/g, ' ')
    .trim();
}

module.exports = {
  parseResumeDocument,
  cleanText
};
