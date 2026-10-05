// RAG-specific vector settings and helper functions.


export const getVectorConfig = () => {
  const thresholdText = process.env.RAG_SEARCH_THRESHOLD;
  const kText = process.env.RAG_SEARCH_K;
  const threshold = thresholdText?.trim() ? Number(thresholdText) : 0.45;
  const k = kText?.trim() ? Number(kText) : 10;

  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    throw new RangeError('RAG_SEARCH_THRESHOLD must be a number between 0 and 1');
  }
  if (!Number.isInteger(k) || k < 1 || k > 50) {
    throw new RangeError('RAG_SEARCH_K must be an integer between 1 and 50');
  }
  return { ragThreshold: threshold, ragK: k };
};

const normalizeWhiteSpace = value => {
    return value.replace(/\s+/g, ' ').trim();
};

export const normalizeQueryText = ({ title }) => {
    return normalizeWhiteSpace(
        `${title || ''}`.normalize('NFKC').toLowerCase()
    );
};

export const calculateCosineSimilarity = (vecA, vecB) => {
    if (vecA.length !== vecB.length) {
        throw new Error('embedded vectors are not equal');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magnitudeA += vecA[i] * vecA[i];
        magnitudeB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);

    if (denominator === 0) {
        return 0;
    }

    return dotProduct / denominator;
};
