// Split document text into small overlapping chunks for RAG.
export const chunkText = (text, chunkSize, overlap) => {
  if (typeof text !== 'string') {
    throw new TypeError('Text must be a string');
  }
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new RangeError('Chunk size must be a positive integer');
  }
  if (!Number.isInteger(overlap) || overlap < 0 || overlap >= chunkSize) {
    throw new RangeError('Overlap must be an integer between zero and chunk size minus one');
  }

    const chunks = [];
    let start = 0;

    while (start < text.length) {
        const end = start + chunkSize;
        const chunk = text.slice(start, end);

        chunks.push(chunk);
        start = end - overlap;
    }

    return chunks;
};
