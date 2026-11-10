/**
 * Cloud AI ATS Resume Analyzer Frontend Application
 * Interacts with Express / AWS backend API without emojis.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const analyzeForm = document.getElementById('analyzeForm');
  const resumeFileInput = document.getElementById('resumeFile');
  const dropzone = document.getElementById('dropzone');
  const dropzoneContent = document.getElementById('dropzoneContent');
  const fileSelectedInfo = document.getElementById('fileSelectedInfo');
  const selectedFileName = document.getElementById('selectedFileName');
  const selectedFileSize = document.getElementById('selectedFileSize');
  const clearFileBtn = document.getElementById('clearFileBtn');

  const jobDescriptionInput = document.getElementById('jobDescription');
  const jdWordCount = document.getElementById('jdWordCount');
  const candidateNameInput = document.getElementById('candidateName');
  const submitBtn = document.getElementById('submitBtn');

  const loadStrongResumeBtn = document.getElementById('loadStrongResumeBtn');
  const loadPoorResumeBtn = document.getElementById('loadPoorResumeBtn');
  const loadSampleJdBtn = document.getElementById('loadSampleJdBtn');

  const loadingContainer = document.getElementById('loadingContainer');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  const resultsSection = document.getElementById('resultsSection');

  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');

  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const historyDrawer = document.getElementById('historyDrawer');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const historyList = document.getElementById('historyList');

  const printReportBtn = document.getElementById('printReportBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');

  let currentAnalysisData = null;
  let cachedSamples = null;

  // 1. Initial Health Check
  checkBackendHealth();
  loadSampleData();

  // 2. Drag & Drop Handling
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      resumeFileInput.files = e.dataTransfer.files;
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  resumeFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  clearFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resumeFileInput.value = '';
    dropzoneContent.style.display = 'block';
    fileSelectedInfo.style.display = 'none';
  });

  function handleFileSelected(file) {
    selectedFileName.textContent = file.name;
    selectedFileSize.textContent = formatBytes(file.size);
    dropzoneContent.style.display = 'none';
    fileSelectedInfo.style.display = 'flex';
  }

  // 3. Live Word Counter for Job Description
  jobDescriptionInput.addEventListener('input', () => {
    const text = jobDescriptionInput.value.trim();
    const count = text.length > 0 ? text.split(/\s+/).length : 0;
    jdWordCount.textContent = `${count} words`;
  });

  // 4. Sample Data Loading
  async function loadSampleData() {
    try {
      const res = await fetch('/api/samples');
      if (res.ok) {
        cachedSamples = await res.json();
      }
    } catch (e) {
      console.warn('Could not load samples cache:', e);
    }
  }

  loadSampleJdBtn.addEventListener('click', () => {
    if (cachedSamples && cachedSamples.jobDescriptions && cachedSamples.jobDescriptions.cloudEngineer) {
      jobDescriptionInput.value = cachedSamples.jobDescriptions.cloudEngineer;
      jobDescriptionInput.dispatchEvent(new Event('input'));
    }
  });

  loadStrongResumeBtn.addEventListener('click', () => {
    if (cachedSamples && cachedSamples.resumes && cachedSamples.resumes.strongCloudResume) {
      const blob = new Blob([cachedSamples.resumes.strongCloudResume], { type: 'text/plain' });
      const file = new File([blob], 'Alex_Morgan_Cloud_Engineer_Resume.txt', { type: 'text/plain' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      resumeFileInput.files = dataTransfer.files;
      handleFileSelected(file);
    }
  });

  loadPoorResumeBtn.addEventListener('click', () => {
    if (cachedSamples && cachedSamples.resumes && cachedSamples.resumes.poorResume) {
      const blob = new Blob([cachedSamples.resumes.poorResume], { type: 'text/plain' });
      const file = new File([blob], 'John_Doe_Unformatted_Resume.txt', { type: 'text/plain' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      resumeFileInput.files = dataTransfer.files;
      handleFileSelected(file);
    }
  });

  // 5. Form Submission & Analysis
  analyzeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const file = resumeFileInput.files[0];
    const jdText = jobDescriptionInput.value.trim();

    if (!file) {
      showError('Please select or upload a resume file (PDF, DOCX, or TXT).');
      return;
    }

    if (!jdText || jdText.length < 30) {
      showError('Please enter a target job description of at least 30 characters.');
      return;
    }

    // Prepare FormData
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jdText);
    if (candidateNameInput.value.trim()) {
      formData.append('candidateName', candidateNameInput.value.trim());
    }

    // UI state: loading
    loadingContainer.style.display = 'block';
    resultsSection.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing Document...';

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to process resume.');
      }

      currentAnalysisData = result.data;
      renderAnalysisResults(result.data);
      loadHistory();
    } catch (err) {
      showError(err.message);
    } finally {
      loadingContainer.style.display = 'none';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Analyze and Compute ATS Score';
    }
  });

  // 6. Render Results Function
  function renderAnalysisResults(data) {
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });

    // Overall Score Dial
    const overallScoreVal = document.getElementById('overallScoreVal');
    const scoreDial = document.getElementById('scoreDial');
    const ratingBadge = document.getElementById('ratingBadge');

    overallScoreVal.textContent = data.overallScore;
    ratingBadge.textContent = data.ratingLevel;
    ratingBadge.style.backgroundColor = `${data.ratingColor}20`;
    ratingBadge.style.color = data.ratingColor;
    scoreDial.style.borderColor = data.ratingColor;

    // Header Meta
    document.getElementById('resultCandidateName').textContent =
      (data.contactInfo && data.contactInfo.candidateName) || 'Candidate Profile';
    document.getElementById('resultDocFormat').textContent =
      (data.meta && data.meta.format) || 'FILE';
    document.getElementById('resultReadinessStatement').textContent =
      data.interviewReadiness;

    document.getElementById('resultWordCount').textContent =
      `${(data.meta && data.meta.wordCount) || 0} words`;
    document.getElementById('resultCandidateSkillCount').textContent =
      data.skillsAnalysis.candidateSkillCount;
    document.getElementById('resultSkillMatchRate').textContent =
      `${data.scores.skillScore}%`;
    document.getElementById('resultStorageType').textContent =
      (data.storage && data.storage.fileStorageType === 'AWS_S3') ? 'AWS S3 Cloud' : 'Local Volume';

    // Breakdown Bars
    setProgressBar('SkillScore', data.scores.skillScore, data.weights.skillScore);
    setProgressBar('SemanticScore', data.scores.semanticScore, data.weights.semanticScore);
    setProgressBar('ImpactScore', data.scores.impactScore, data.weights.impactScore);
    setProgressBar('StructureScore', data.scores.structureScore, data.weights.structureScore);

    // Recommendations List
    const recList = document.getElementById('recommendationsList');
    recList.innerHTML = '';
    if (data.recommendations && data.recommendations.length > 0) {
      data.recommendations.forEach(rec => {
        const item = document.createElement('div');
        const priorityClass = rec.priority.toLowerCase() === 'high' ? 'priority-high' : 'priority-medium';
        item.className = `recommendation-item ${priorityClass}`;
        item.innerHTML = `
          <span class="rec-priority">${rec.priority}</span>
          <div class="rec-body">
            <div class="rec-category">${rec.category}</div>
            <div class="rec-text">${rec.recommendation}</div>
          </div>
        `;
        recList.appendChild(item);
      });
    } else {
      recList.innerHTML = '<p class="text-muted">No high-priority recommendations. The resume meets all target criteria.</p>';
    }

    // Matched Skills
    const matchedList = document.getElementById('matchedSkillsList');
    matchedList.innerHTML = '';
    document.getElementById('matchedCountBadge').textContent = `${data.skillsAnalysis.matchedCount} Matched`;
    if (data.skillsAnalysis.matchedSkills.length > 0) {
      data.skillsAnalysis.matchedSkills.forEach(skill => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag matched';
        tag.textContent = skill;
        matchedList.appendChild(tag);
      });
    } else {
      matchedList.innerHTML = '<span class="text-muted">No direct technical skill matches found.</span>';
    }

    // Missing Skills
    const missingList = document.getElementById('missingSkillsList');
    missingList.innerHTML = '';
    document.getElementById('missingCountBadge').textContent = `${data.skillsAnalysis.missingCount} Missing`;
    if (data.skillsAnalysis.missingSkills.length > 0) {
      data.skillsAnalysis.missingSkills.forEach(skill => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag missing';
        tag.textContent = skill;
        missingList.appendChild(tag);
      });
    } else {
      missingList.innerHTML = '<span class="text-muted">All target job skills are covered in this resume.</span>';
    }

    // Formatting Checklist
    const checkList = document.getElementById('formatChecklist');
    checkList.innerHTML = '';
    if (data.formatChecklist) {
      data.formatChecklist.forEach(item => {
        const li = document.createElement('li');
        const passClass = item.passed ? 'check-pass' : 'check-fail';
        const label = item.passed ? '[PASS]' : '[FAIL]';
        li.className = `checklist-item ${passClass}`;
        li.innerHTML = `
          <span class="check-icon">${label}</span>
          <div class="check-content">
            <div class="check-name">${item.check}</div>
            <div class="check-detail">${item.detail}</div>
          </div>
        `;
        checkList.appendChild(li);
      });
    }

    // Action Verbs
    document.getElementById('distinctActionVerbsCount').textContent =
      data.actionVerbs.distinctCount;
    const verbsList = document.getElementById('verbsList');
    verbsList.innerHTML = '';
    if (data.actionVerbs.found && data.actionVerbs.found.length > 0) {
      data.actionVerbs.found.forEach(item => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag verb';
        tag.innerHTML = `${item.verb} <span class="verb-count">x${item.frequency}</span>`;
        verbsList.appendChild(tag);
      });
    } else {
      verbsList.innerHTML = '<span class="text-muted">No standard action verbs identified.</span>';
    }

    // Quantifiable Metrics
    document.getElementById('quantifiableOutcomesCount').textContent =
      data.quantifiableMetrics.count;
    const metricsList = document.getElementById('metricsList');
    metricsList.innerHTML = '';
    if (data.quantifiableMetrics.metrics && data.quantifiableMetrics.metrics.length > 0) {
      data.quantifiableMetrics.metrics.forEach(metric => {
        const li = document.createElement('li');
        li.textContent = metric;
        metricsList.appendChild(li);
      });
    } else {
      metricsList.innerHTML = '<li>No quantifiable metrics (percentages, dollar amounts, scale metrics) detected in work experience.</li>';
    }
  }

  function setProgressBar(key, score, weight) {
    const bar = document.getElementById(`bar${key}`);
    const fill = document.getElementById(`fill${key}`);
    if (bar && fill) {
      bar.textContent = `${score}/100`;
      fill.style.width = `${score}%`;
      if (score >= 80) {
        fill.style.backgroundColor = '#107c41';
      } else if (score >= 60) {
        fill.style.backgroundColor = '#0b4f6c';
      } else {
        fill.style.backgroundColor = '#c5221f';
      }
    }
  }

  // 7. Export / Print Handlers
  printReportBtn.addEventListener('click', () => {
    window.print();
  });

  exportJsonBtn.addEventListener('click', () => {
    if (!currentAnalysisData) return;
    const blob = new Blob([JSON.stringify(currentAnalysisData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ats_report_${currentAnalysisData.reportId || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // 8. Past Scans History Drawer
  historyToggleBtn.addEventListener('click', () => {
    historyDrawer.classList.toggle('open');
    loadHistory();
  });

  closeHistoryBtn.addEventListener('click', () => {
    historyDrawer.classList.remove('open');
  });

  async function loadHistory() {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const json = await res.json();
        renderHistoryList(json.data || []);
      }
    } catch (e) {
      console.warn('Failed to load scan history:', e);
    }
  }

  function renderHistoryList(items) {
    historyList.innerHTML = '';
    if (!items || items.length === 0) {
      historyList.innerHTML = '<p class="drawer-empty">No scan history recorded in current session.</p>';
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'history-card';
      const dateStr = item.analyzedAt ? new Date(item.analyzedAt).toLocaleDateString() : '';
      card.innerHTML = `
        <div class="history-card-header">
          <span>${item.candidateName || 'Candidate'}</span>
          <span style="color: ${item.ratingColor || '#0b4f6c'}">${item.overallScore}/100</span>
        </div>
        <div class="history-card-meta">
          <span>${item.ratingLevel || ''}</span> &bull; <span>${dateStr}</span>
        </div>
      `;
      card.addEventListener('click', async () => {
        try {
          const res = await fetch(`/api/report/${item.reportId}`);
          if (res.ok) {
            const reportJson = await res.json();
            currentAnalysisData = reportJson.data;
            renderAnalysisResults(reportJson.data);
            historyDrawer.classList.remove('open');
          }
        } catch (err) {
          showError('Failed to load past report.');
        }
      });
      historyList.appendChild(card);
    });
  }

  // 9. AWS Health Check
  async function checkBackendHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const health = await res.json();
        statusIndicator.className = 'status-indicator online';
        const storageLabel = health.storage.configuredType === 'AWS_S3'
          ? (health.storage.isS3Healthy ? 'AWS S3 Connected' : 'AWS S3 Configured')
          : 'Local Volume Mode';
        statusText.textContent = `Online: ${storageLabel}`;
      } else {
        throw new Error('API returned non-200');
      }
    } catch (e) {
      statusIndicator.className = 'status-indicator offline';
      statusText.textContent = 'Backend Offline';
    }
  }

  // Helper functions
  function showError(msg) {
    errorMessage.textContent = msg;
    errorAlert.style.display = 'block';
    errorAlert.scrollIntoView({ behavior: 'smooth' });
  }

  function hideError() {
    errorAlert.style.display = 'none';
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
});
