/**
 * ATS Scoring Engine
 * Evaluates resumes against a target job description across multiple dimensions:
 * 1. Skill Match & Coverage (35%)
 * 2. Semantic Similarity / Cosine TF-IDF (25%)
 * 3. Quantifiable Impact & Action Verbs (20%)
 * 4. Structural Formatting & ATS Compliance (20%)
 */

const {
  computeCosineSimilarity,
  extractContactInformation,
  analyzeSections,
  extractSkills,
  extractActionVerbs,
  extractQuantifiableMetrics
} = require('./nlpEngine');

/**
 * Perform end-to-end ATS evaluation
 * @param {string} resumeText - Parsed text of resume
 * @param {string} jobDescriptionText - Text of job description
 * @param {object} meta - Metadata (filename, pageCount, wordCount, format)
 * @returns {object} Detailed ATS score and diagnostic feedback
 */
function evaluateResume(resumeText, jobDescriptionText, meta = {}) {
  // 1. Contact Information Extraction
  const contactInfo = extractContactInformation(resumeText);

  // 2. Section Analysis
  const sectionAnalysis = analyzeSections(resumeText);

  // 3. Skill Extraction for Resume and Job Description
  const resumeSkillsData = extractSkills(resumeText);
  const jdSkillsData = extractSkills(jobDescriptionText);

  const resumeSkillsSet = new Set(resumeSkillsData.skills);
  const jdSkillsSet = new Set(jdSkillsData.skills);

  // Identify Matched, Missing, and Additional skills
  const matchedSkills = [];
  const missingSkills = [];
  const additionalSkills = [];

  jdSkillsSet.forEach(skill => {
    if (resumeSkillsSet.has(skill)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  resumeSkillsSet.forEach(skill => {
    if (!jdSkillsSet.has(skill)) {
      additionalSkills.push(skill);
    }
  });

  // Calculate Skill Coverage
  const totalJdSkills = jdSkillsSet.size;
  const skillCoverageRatio = totalJdSkills > 0 ? (matchedSkills.length / totalJdSkills) : 0.8;
  const skillScore = Math.min(100, Math.round(skillCoverageRatio * 100));

  // 4. Semantic Similarity (TF-IDF Cosine Similarity)
  const cosineSim = computeCosineSimilarity(resumeText, jobDescriptionText);
  // Scale cosine similarity: realistic resumes score between 0.25 and 0.75, so normalize
  let semanticScore = Math.round(cosineSim * 125);
  semanticScore = Math.max(10, Math.min(100, semanticScore));

  // 5. Action Verbs and Quantifiable Impact
  const actionVerbsData = extractActionVerbs(resumeText);
  const metricsData = extractQuantifiableMetrics(resumeText);

  // Score action verbs (ideal: at least 8-12 distinct action verbs)
  const verbScore = Math.min(100, Math.round((actionVerbsData.distinctCount / 10) * 100));

  // Score quantifiable metrics (ideal: at least 4-6 measurable outcome bullets)
  const metricsScore = Math.min(100, Math.round((metricsData.count / 5) * 100));

  const impactScore = Math.round((verbScore * 0.5) + (metricsScore * 0.5));

  // 6. ATS Structural & Format Compliance
  let structurePoints = 0;

  // Contact points (max 25)
  if (contactInfo.email) structurePoints += 10;
  if (contactInfo.phone) structurePoints += 10;
  if (contactInfo.linkedin || contactInfo.github) structurePoints += 5;

  // Sections completeness (max 50)
  structurePoints += Math.round((sectionAnalysis.presentCount / sectionAnalysis.totalSections) * 50);

  // Word count & length sanity check (max 25)
  const wordCount = meta.wordCount || resumeText.split(/\s+/).length;
  if (wordCount >= 300 && wordCount <= 1200) {
    structurePoints += 25; // Optimal length (1-2 pages)
  } else if (wordCount > 1200 && wordCount <= 1800) {
    structurePoints += 15; // Slightly too long
  } else if (wordCount > 150 && wordCount < 300) {
    structurePoints += 12; // A bit sparse
  } else {
    structurePoints += 5; // Too short or excessive
  }

  const structureScore = Math.min(100, structurePoints);

  // 7. Weighted Composite ATS Score Calculation
  // Weights:
  // - Skills Match: 35%
  // - Semantic Match: 25%
  // - Quantifiable Impact: 20%
  // - Structural Compliance: 20%
  const compositeScore = Math.round(
    (skillScore * 0.35) +
    (semanticScore * 0.25) +
    (impactScore * 0.20) +
    (structureScore * 0.20)
  );

  // 8. Qualitative Rating and Level
  let ratingLevel = 'Poor Match';
  let ratingColor = '#d9534f'; // Red
  let interviewReadiness = 'Low probability of passing automated screening';

  if (compositeScore >= 80) {
    ratingLevel = 'High Match';
    ratingColor = '#28a745'; // Green
    interviewReadiness = 'Strong candidate profile, ready for interview consideration';
  } else if (compositeScore >= 65) {
    ratingLevel = 'Good Match';
    ratingColor = '#17a2b8'; // Cyan
    interviewReadiness = 'Moderate match, minor skill alignment and formatting recommended';
  } else if (compositeScore >= 50) {
    ratingLevel = 'Average Match';
    ratingColor = '#ffc107'; // Amber
    interviewReadiness = 'Borderline match, requires significant keyword optimization';
  }

  // 9. Generate Actionable Recommendations
  const recommendations = [];

  if (missingSkills.length > 0) {
    const topMissing = missingSkills.slice(0, 6).join(', ');
    recommendations.push({
      category: 'Keywords & Skills',
      priority: 'High',
      recommendation: `Incorporate missing critical keywords from the job description: ${topMissing}.`
    });
  }

  if (metricsData.count < 3) {
    recommendations.push({
      category: 'Quantifiable Results',
      priority: 'High',
      recommendation: 'Add specific quantitative metrics (percentages, dollar amounts, time saved, server counts) to demonstrate measurable impact in past roles.'
    });
  }

  if (actionVerbsData.distinctCount < 6) {
    recommendations.push({
      category: 'Action Verbs',
      priority: 'Medium',
      recommendation: 'Begin bullet points with powerful action verbs such as "Architected", "Spearheaded", "Optimized", or "Automated" instead of passive phrases like "Responsible for".'
    });
  }

  const missingSections = sectionAnalysis.sections.filter(s => !s.present).map(s => s.section);
  if (missingSections.length > 0) {
    recommendations.push({
      category: 'ATS Structure',
      priority: 'High',
      recommendation: `Add explicit standard section headers for: ${missingSections.join(', ')} to ensure ATS parsers do not miss crucial information.`
    });
  }

  if (!contactInfo.phone || !contactInfo.email) {
    recommendations.push({
      category: 'Contact Info',
      priority: 'Critical',
      recommendation: 'Ensure both an email address and a contact phone number are clearly visible in the header.'
    });
  }

  if (wordCount < 350) {
    recommendations.push({
      category: 'Content Depth',
      priority: 'Medium',
      recommendation: 'The resume content is relatively sparse (under 350 words). Expand on project technical details, methodologies, and achievements.'
    });
  } else if (wordCount > 1300) {
    recommendations.push({
      category: 'Resume Length',
      priority: 'Medium',
      recommendation: 'The resume exceeds 1,300 words. Consider condensing older positions to maintain a crisp 1 to 2 page limit.'
    });
  }

  // Formatting Checklist
  const formatChecklist = [
    {
      check: 'Email Address Present',
      passed: Boolean(contactInfo.email),
      detail: contactInfo.email || 'Missing email address'
    },
    {
      check: 'Phone Number Present',
      passed: Boolean(contactInfo.phone),
      detail: contactInfo.phone || 'Missing phone number'
    },
    {
      check: 'LinkedIn or Portfolio Link',
      passed: Boolean(contactInfo.linkedin || contactInfo.github),
      detail: contactInfo.linkedin || contactInfo.github || 'No portfolio or profile URL detected'
    },
    {
      check: 'Standard Section Headers',
      passed: sectionAnalysis.completenessRate >= 70,
      detail: `${sectionAnalysis.presentCount} of ${sectionAnalysis.totalSections} standard sections identified`
    },
    {
      check: 'Action-Oriented Language',
      passed: actionVerbsData.distinctCount >= 5,
      detail: `${actionVerbsData.distinctCount} distinct action verbs detected`
    },
    {
      check: 'Quantifiable Metrics & Data',
      passed: metricsData.count >= 2,
      detail: `${metricsData.count} quantifiable outcome statements detected`
    },
    {
      check: 'Word Count & Length Compliance',
      passed: wordCount >= 300 && wordCount <= 1200,
      detail: `${wordCount} words (${meta.pageCount || 1} page est.)`
    }
  ];

  return {
    overallScore: compositeScore,
    ratingLevel,
    ratingColor,
    interviewReadiness,
    scores: {
      skillScore,
      semanticScore,
      impactScore,
      structureScore
    },
    weights: {
      skillScore: 35,
      semanticScore: 25,
      impactScore: 20,
      structureScore: 20
    },
    contactInfo,
    skillsAnalysis: {
      matchedSkills,
      matchedCount: matchedSkills.length,
      missingSkills,
      missingCount: missingSkills.length,
      additionalSkills,
      additionalCount: additionalSkills.length,
      totalJdSkills,
      candidateSkillCount: resumeSkillsData.totalCount
    },
    actionVerbs: actionVerbsData,
    quantifiableMetrics: metricsData,
    sectionAnalysis,
    formatChecklist,
    recommendations,
    meta: {
      ...meta,
      analyzedAt: new Date().toISOString()
    }
  };
}

module.exports = {
  evaluateResume
};
