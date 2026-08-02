const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const SRC_DIR = path.join(__dirname, 'src', 'articles');
const TEMPLATE_PATH = path.join(__dirname, 'src', 'templates', 'article.html');
const DATA_PATH = path.join(__dirname, 'data', 'articles.json');
const OUTPUT_DIR = path.join(__dirname, 'articles');

const DEFAULT_URL = 'https://andrey-ai-lab.com';

const SITE = {
  title: 'Andrey AI Lab',
  description: 'Эксперименты с AI-архитектурой и оптимизацией бизнес-процессов',
  url: process.env.BASE_URL ? process.env.BASE_URL.replace(/\/$/, '') : DEFAULT_URL,
  author: 'Andrey',
  email: 'hello@andrey-ai-lab.com',
};

function pad(n) {
  return String(n).padStart(2, '0');
}

function toISODate(value) {
  if (value instanceof Date) {
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }
  return String(value).slice(0, 10);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function validateArticle(article, filePath) {
  const required = ['slug', 'title', 'description', 'date', 'tags'];
  for (const key of required) {
    if (article[key] === undefined || article[key] === null) {
      throw new Error(`Missing frontmatter field "${key}" in ${filePath}`);
    }
  }

  if (!Array.isArray(article.tags) || article.tags.length === 0) {
    throw new Error(`Field "tags" must be a non-empty array in ${filePath}`);
  }

  if (Number.isNaN(Date.parse(article.date))) {
    throw new Error(`Invalid date "${article.date}" in ${filePath}`);
  }
}

function loadArticles() {
  if (!fs.existsSync(SRC_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(SRC_DIR)
    .filter((file) => file.endsWith('.md'));

  const articles = [];

  for (const file of files) {
    const filePath = path.join(SRC_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(raw);
    const data = parsed.data;

    if (data.draft === true) {
      console.log(`Skipping draft: ${file}`);
      continue;
    }

    validateArticle(data, filePath);

    articles.push({
      ...data,
      date: toISODate(data.date),
      content: parsed.content,
    });
  }

  return articles.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function generateDataJson(articles) {
  const payload = {
    site: SITE,
    articles: articles.map((article) => ({
      slug: article.slug,
      title: article.title,
      description: article.description,
      date: article.date,
      tags: article.tags,
      featured: article.featured === true,
    })),
  };

  ensureDir(path.dirname(DATA_PATH));
  fs.writeFileSync(DATA_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
  console.log(`Data written: ${DATA_PATH} (${payload.articles.length} articles)`);
}

function renderArticlePage(article, template) {
  const formattedDate = formatDate(article.date);
  const tagsHtml = article.tags
    .map((tag) => `<span class="article-card__tag">${escapeHtml(tag)}</span>`)
    .join('\n            ');

  const contentHtml = marked.parse(article.content, { async: false });

  return template
    .replace(/\{\{title\}\}/g, escapeHtml(article.title))
    .replace(/\{\{description\}\}/g, escapeHtml(article.description))
    .replace(/\{\{date\}\}/g, article.date)
    .replace(/\{\{formattedDate\}\}/g, formattedDate)
    .replace(/\{\{tags\}\}/g, tagsHtml)
    .replace(/\{\{content\}\}/g, contentHtml);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateArticlePages(articles, template) {
  for (const article of articles) {
    const articleDir = path.join(OUTPUT_DIR, article.slug);
    ensureDir(articleDir);

    const html = renderArticlePage(article, template);
    const outputPath = path.join(articleDir, 'index.html');
    fs.writeFileSync(outputPath, html, 'utf-8');
    console.log(`Article built: ${outputPath}`);
  }
}

function generateRss() {
  // generate-rss.js runs its logic on require, using the freshly written data/articles.json
  require('./generate-rss.js');
}

function build() {
  console.log('Building site...');

  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`Template not found: ${TEMPLATE_PATH}`);
    process.exit(1);
  }

  const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  const articles = loadArticles();

  if (articles.length === 0) {
    console.warn('No articles found.');
  }

  generateDataJson(articles);
  generateArticlePages(articles, template);
  generateRss();

  console.log('Build complete.');
}

build();
