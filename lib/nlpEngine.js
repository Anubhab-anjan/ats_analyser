/**
 * NLP Processing Engine
 * Provides tokenization, TF-IDF calculation, cosine similarity,
 * contact information extraction, action verb analysis, and quantifiable metric extraction.
 */

const {
  ALL_SKILLS_FLAT,
  SKILL_TO_CATEGORY_MAP,
  ACTION_VERBS,
  ATS_STANDARD_SECTIONS
} = require('./skillsDatabase');

// Standard English stop words
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot', 'could',
  'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down',
  'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has',
  'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her',
  'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s',
  'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it',
  'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
  'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she',
  'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such',
  'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was',
  'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what',
  'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s',
  'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d',
  'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Tokenize string into cleaned lowercase alphanumeric terms (stop words removed)
 */
function tokenize(text) {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+#.-]/g, ' ')
    .split(/\s+/)
    .map(w => w.replace(/^[.-]+|[.-]+$/g, ''))
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
  return words;
}

/**
 * Compute Term Frequency (TF) for a token list
 */
function computeTermFrequency(tokens) {
  const tf = {};
  if (tokens.length === 0) return tf;

  tokens.forEach(token => {
    tf[token] = (tf[token] || 0) + 1;
  });

  const total = tokens.length;
  Object.keys(tf).forEach(key => {
    tf[key] = tf[key] / total;
  });

  return tf;
}

/**
 * Compute Cosine Similarity using TF-IDF representation between two documents
 * @param {string} docA - Text of resume
 * @param {string} docB - Text of job description
 * @returns {number} Cosine similarity between 0 and 1
 */
function computeCosineSimilarity(docA, docB) {
  const tokensA = tokenize(docA);
  const tokensB = tokenize(docB);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const tfA = computeTermFrequency(tokensA);
  const tfB = computeTermFrequency(tokensB);

  // Vocabulary of union of both documents
  const vocab = new Set([...Object.keys(tfA), ...Object.keys(tfB)]);

  // IDF: Document frequency in this 2-doc corpus
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  vocab.forEach(term => {
    let df = 0;
    if (tfA[term]) df++;
    if (tfB[term]) df++;

    // IDF smoothing: log(1 + (N / df))
    const idf = Math.log(1 + (2 / df));

    const weightA = (tfA[term] || 0) * idf;
    const weightB = (tfB[term] || 0) * idf;

    dotProduct += weightA * weightB;
    normA += weightA * weightA;
    normB += weightB * weightB;
  });

  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.min(1, Math.max(0, similarity));
}

/**
 * Extract structured contact information from resume text
 */
function extractContactInformation(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Email extraction
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatches = text.match(emailRegex) || [];
  const email = emailMatches.length > 0 ? emailMatches[0] : null;

  // Phone number extraction
  const phoneRegex = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/gi;
  const internationalPhoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/g;
  const phoneMatches = text.match(phoneRegex) || text.match(internationalPhoneRegex) || [];
  const phone = phoneMatches.length > 0 ? phoneMatches[0].trim() : null;

  // LinkedIn URL extraction
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|profile)\/([a-zA-Z0-9_-]+)/gi;
  const linkedinMatches = text.match(linkedinRegex) || [];
  const linkedin = linkedinMatches.length > 0 ? linkedinMatches[0] : null;

  // GitHub URL extraction
  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/gi;
  const githubMatches = text.match(githubRegex) || [];
  const github = githubMatches.length > 0 ? githubMatches[0] : null;

  // Candidate Name extraction heuristic (first non-empty line that doesn't contain contact info)
  let candidateName = 'Candidate';
  for (const line of lines.slice(0, 5)) {
    if (
      line.length > 2 &&
      line.length < 40 &&
      !emailRegex.test(line) &&
      !line.includes('http') &&
      !line.includes('@') &&
      !/resume|curriculum|cv|contact/i.test(line)
    ) {
      candidateName = line;
      break;
    }
  }

  return {
    candidateName,
    email,
    phone,
    linkedin,
    github
  };
}

/**
 * Identify presence and position of standard ATS sections
 */
function analyzeSections(text) {
  const lower = text.toLowerCase();
  const results = [];

  ATS_STANDARD_SECTIONS.forEach(section => {
    let found = false;
    let matchedPattern = null;

    for (const pattern of section.patterns) {
      // Look for pattern as a standalone line or followed by colon/linebreak
      const regex = new RegExp(`(^|\\n|\\r)\\s*${pattern}\\s*(:|$|\\n|\\r)`, 'i');
      if (regex.test(lower)) {
        found = true;
        matchedPattern = pattern;
        break;
      }
    }

    results.push({
      section: section.name,
      present: found,
      matchedHeader: matchedPattern || null
    });
  });

  const presentCount = results.filter(r => r.present).length;
  const completenessRate = Math.round((presentCount / results.length) * 100);

  return {
    sections: results,
    presentCount,
    totalSections: results.length,
    completenessRate
  };
}

/**
 * Extract technical and soft skills present in the text using skills database
 */
function extractSkills(text) {
  if (!text) return { skills: [], categorized: {}, totalCount: 0 };

  const lower = text.toLowerCase();
  const matched = new Set();
  const categorized = {};

  ALL_SKILLS_FLAT.forEach(skill => {
    // Regex boundary matching: check for exact token boundary to prevent false positives
    // e.g. avoid matching 'c' in 'cloud'
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9+#.-])${escaped}(?:$|[^a-zA-Z0-9+#.-])`, 'i');

    if (regex.test(lower)) {
      matched.add(skill);
      const category = SKILL_TO_CATEGORY_MAP[skill] || 'other';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(skill);
    }
  });

  const skillsList = Array.from(matched);

  return {
    skills: skillsList,
    categorized: categorized,
    totalCount: skillsList.length
  };
}

/**
 * Detect action verbs used in experience bullet points
 */
function extractActionVerbs(text) {
  if (!text) return { found: [], count: 0, distinctCount: 0 };

  const lower = text.toLowerCase();
  const foundMap = {};

  ACTION_VERBS.forEach(verb => {
    const regex = new RegExp(`\\b${verb}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      foundMap[verb] = matches.length;
    }
  });

  const foundList = Object.keys(foundMap).map(verb => ({
    verb,
    frequency: foundMap[verb]
  }));

  foundList.sort((a, b) => b.frequency - a.frequency);

  const totalOccurrences = foundList.reduce((acc, item) => acc + item.frequency, 0);

  return {
    found: foundList,
    count: totalOccurrences,
    distinctCount: foundList.length
  };
}

/**
 * Detect quantifiable metrics and measurable business outcomes
 * (percentages, dollar amounts, metrics, scale indicators)
 */
function extractQuantifiableMetrics(text) {
  if (!text) return { metrics: [], count: 0, hasMetrics: false };

  const lines = text.split('\n');
  const metricFindings = [];

  // Regex patterns for quantitative achievements
  const patterns = [
    /\b\d+(?:\.\d+)?%\b/g, // Percentages: 45%, 12.5%
    /\$\s?\d+(?:,\d+)*(?:\.\d+)?(?:\s?(?:k|m|b|million|billion|thousand))?\b/gi, // Currency: $50k, $1.2M
    /\b\d+\s?(?:ms|sec|seconds|minutes|hours|days|x|fold|tb|gb|mb)\b/gi, // Performance: 200ms, 4x, 50GB
    /\b(?:increased|decreased|reduced|saved|improved|boosted|cut|scaled)\s+(?:by\s+)?(?:\d+(?:\.\d+)?%|\$\d+)/gi, // Outcome phrases
    /\b(?:over|more than|exceeding)\s+\d+(?:,\d+)*\b/gi // Scale counts: over 10,000
  ];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 15) return;

    let matchedInLine = false;
    patterns.forEach(pattern => {
      const matches = trimmed.match(pattern);
      if (matches) {
        matchedInLine = true;
      }
    });

    if (matchedInLine && !metricFindings.includes(trimmed)) {
      metricFindings.push(trimmed);
    }
  });

  return {
    metrics: metricFindings.slice(0, 10), // Top 10 quantifiable bullet points
    count: metricFindings.length,
    hasMetrics: metricFindings.length > 0
  };
}

module.exports = {
  tokenize,
  computeTermFrequency,
  computeCosineSimilarity,
  extractContactInformation,
  analyzeSections,
  extractSkills,
  extractActionVerbs,
  extractQuantifiableMetrics
};
