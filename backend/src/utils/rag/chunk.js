// Split document text into small overlapping chunks for RAG.
export const chunkText = (text, chunkSize, overlap) => {
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
