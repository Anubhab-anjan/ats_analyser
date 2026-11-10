/**
 * Comprehensive Skills Taxonomy and Knowledge Base for ATS Resume Analysis
 * Categorized technical skills, tools, frameworks, and methodologies.
 */

const SKILLS_TAXONOMY = {
  programmingLanguages: [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'c', 'golang', 'go',
    'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'dart', 'shell',
    'bash', 'powershell', 'perl', 'sql', 'html', 'css', 'sass', 'less'
  ],

  frontend: [
    'react', 'react.js', 'reactjs', 'vue', 'vue.js', 'vuejs', 'angular', 'angularjs',
    'next.js', 'nextjs', 'nuxt.js', 'svelte', 'sveltekit', 'redux', 'mobx', 'zustand',
    'tailwind', 'tailwind css', 'bootstrap', 'material ui', 'mui', 'chakra ui',
    'webpack', 'vite', 'esbuild', 'babel', 'html5', 'css3', 'responsive design',
    'web accessibility', 'wcag', 'single page application', 'spa', 'pwa'
  ],

  backend: [
    'node.js', 'nodejs', 'express', 'express.js', 'fastapi', 'django', 'flask',
    'spring', 'spring boot', 'asp.net', '.net core', 'ruby on rails', 'rails',
    'laravel', 'symfony', 'nest.js', 'nestjs', 'graphql', 'rest api', 'restful api',
    'grpc', 'microservices', 'websocket', 'socket.io', 'message queue', 'celery',
    'middleware', 'api gateway', 'event-driven architecture'
  ],

  cloudAndVirtualization: [
    'aws', 'amazon web services', 'ec2', 's3', 'lambda', 'dynamodb', 'rds',
    'cloudwatch', 'iam', 'ecs', 'eks', 'sqs', 'sns', 'route 53', 'vpc', 'cloudfront',
    'elastic beanstalk', 'fargate', 'cloudformation', 'azure', 'azure devops',
    'azure functions', 'azure blob storage', 'azure cosmos db', 'google cloud platform',
    'gcp', 'google compute engine', 'google cloud storage', 'bigquery', 'cloud run',
    'cloud functions', 'terraform', 'ansible', 'serverless', 'openstack', 'vmware'
  ],

  devopsAndCiCd: [
    'docker', 'docker compose', 'kubernetes', 'k8s', 'jenkins', 'github actions',
    'gitlab ci', 'bitbucket pipelines', 'circleci', 'travis ci', 'helm', 'argocd',
    'prometheus', 'grafana', 'elk stack', 'logstash', 'kibana', 'datadog', 'new relic',
    'nginx', 'apache', 'caddy', 'linux', 'unix', 'ubuntu', 'centos', 'debian',
    'ci/cd', 'continuous integration', 'continuous deployment', 'infrastructure as code', 'iac'
  ],

  databases: [
    'postgresql', 'postgres', 'mysql', 'mariadb', 'mongodb', 'redis', 'elasticsearch',
    'cassandra', 'sqlite', 'oracle', 'sql server', 'mssql', 'dynamodb', 'neo4j',
    'firebase', 'firestore', 'couchdb', 'snowflake', 'redshift', 'clickhouse',
    'prisma', 'mongoose', 'typeorm', 'hibernate', 'sqlalchemy'
  ],

  aiAndDataScience: [
    'machine learning', 'deep learning', 'artificial intelligence', 'nlp',
    'natural language processing', 'computer vision', 'data science', 'pytorch',
    'tensorflow', 'keras', 'scikit-learn', 'pandas', 'numpy', 'scipy', 'matplotlib',
    'seaborn', 'huggingface', 'transformers', 'large language models', 'llm',
    'generative ai', 'genai', 'rag', 'vector database', 'langchain', 'llamaindex',
    'opencv', 'spark', 'apache spark', 'hadoop', 'kafka', 'apache kafka', 'airflow',
    'etl', 'data pipeline', 'tableau', 'power bi'
  ],

  testingAndQuality: [
    'unit testing', 'integration testing', 'end-to-end testing', 'e2e testing',
    'test driven development', 'tdd', 'jest', 'mocha', 'chai', 'pytest', 'unittest',
    'selenium', 'cypress', 'playwright', 'postman', 'swagger', 'junit', 'sonarqube'
  ],

  architectureAndEngineering: [
    'system design', 'distributed systems', 'object-oriented programming', 'oop',
    'functional programming', 'design patterns', 'data structures', 'algorithms',
    'concurrency', 'multithreading', 'caching', 'load balancing', 'high availability',
    'fault tolerance', 'scalability', 'security', 'oauth', 'jwt', 'rbac', 'encryption'
  ],

  methodologiesAndSoftSkills: [
    'agile', 'scrum', 'kanban', 'jira', 'confluence', 'git', 'github', 'gitlab',
    'bitbucket', 'code review', 'pair programming', 'technical documentation',
    'project management', 'cross-functional collaboration', 'problem solving',
    'critical thinking', 'leadership', 'mentoring', 'team leadership', 'communication'
  ]
};

// Flattened set of all skills for rapid matching
const ALL_SKILLS_FLAT = [];
const SKILL_TO_CATEGORY_MAP = {};

Object.entries(SKILLS_TAXONOMY).forEach(([category, skills]) => {
  skills.forEach(skill => {
    const normalized = skill.toLowerCase();
    if (!ALL_SKILLS_FLAT.includes(normalized)) {
      ALL_SKILLS_FLAT.push(normalized);
    }
    SKILL_TO_CATEGORY_MAP[normalized] = category;
  });
});

// Sort skills by length descending so multi-word skills like 'amazon web services' match before 'aws'
ALL_SKILLS_FLAT.sort((a, b) => b.length - a.length);

// Action verbs strongly favored by ATS algorithms
const ACTION_VERBS = [
  'accelerated', 'achieved', 'administered', 'analyzed', 'architected', 'automated',
  'built', 'calculated', 'centralized', 'championed', 'collaborated', 'configured',
  'constructed', 'consolidated', 'converted', 'coordinated', 'created', 'decreased',
  'delivered', 'deployed', 'designed', 'developed', 'devised', 'diagnosed',
  'directed', 'documented', 'eliminated', 'engineered', 'enhanced', 'established',
  'evaluated', 'executed', 'expanded', 'expedited', 'formulated', 'generated',
  'governed', 'guided', 'headed', 'identified', 'implemented', 'improved',
  'increased', 'initiated', 'inspected', 'instituted', 'integrated', 'invented',
  'launched', 'led', 'maintained', 'managed', 'maximized', 'migrated', 'minimized',
  'modernized', 'monitored', 'negotiated', 'optimized', 'orchestrated', 'organized',
  'overhauled', 'oversaw', 'performed', 'piloted', 'pioneered', 'planned',
  'produced', 'programmed', 'published', 're-engineered', 'rebuilt', 'reduced',
  'refactored', 'resolved', 'restructured', 'revamped', 'scaled', 'simplified',
  'spearheaded', 'standardized', 'streamlined', 'strengthened', 'supervised',
  'tested', 'trained', 'transformed', 'upgraded', 'validated', 'yielded'
];

// Standard section headers recognized by ATS parsers
const ATS_STANDARD_SECTIONS = [
  { name: 'Contact Information', patterns: ['contact', 'email', 'phone', 'address', 'linkedin'] },
  { name: 'Professional Summary', patterns: ['summary', 'professional summary', 'profile', 'objective', 'about me', 'career objective'] },
  { name: 'Work Experience', patterns: ['experience', 'work experience', 'employment', 'work history', 'professional experience'] },
  { name: 'Education', patterns: ['education', 'academic background', 'qualifications', 'degrees', 'academics'] },
  { name: 'Skills & Competencies', patterns: ['skills', 'technical skills', 'core competencies', 'technologies', 'expertise', 'skills & abilities'] },
  { name: 'Projects', patterns: ['projects', 'personal projects', 'academic projects', 'key projects', 'selected projects'] },
  { name: 'Certifications', patterns: ['certifications', 'certificates', 'licenses', 'accreditations', 'credentials'] }
];

module.exports = {
  SKILLS_TAXONOMY,
  ALL_SKILLS_FLAT,
  SKILL_TO_CATEGORY_MAP,
  ACTION_VERBS,
  ATS_STANDARD_SECTIONS
};
