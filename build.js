const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const SRC_DIR = path.join(__dirname, 'src', 'articles');
const TEMPLATE_PATH = path.join(__dirname, 'src', 'templates', 'article.html');
const SERIES_PATH = path.join(__dirname, 'src', 'series.json');
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

function loadSeriesRegistry() {
  if (!fs.existsSync(SERIES_PATH)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(SERIES_PATH, 'utf-8'));
}

function buildSeriesMap(articles, registry) {
  const map = {};

  for (const article of articles) {
    if (!article.series) continue;

    const meta = registry[article.series];
    if (!meta) {
      console.warn(`Unknown series "${article.series}" in article "${article.slug}" - добавьте её в src/series.json`);
      continue;
    }

    if (!map[article.series]) {
      map[article.series] = { ...meta, articles: [] };
    }
    map[article.series].articles.push(article);
  }

  for (const series of Object.values(map)) {
    series.articles.sort((a, b) => {
      const orderA = a.seriesOrder ?? 999;
      const orderB = b.seriesOrder ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.date) - new Date(b.date);
    });
  }

  return map;
}

function renderSeriesBlock(article, seriesMap) {
  const series = article.series && seriesMap[article.series];
  if (!series) return '';

  const count = series.articles.length;
  const index = series.articles.findIndex((a) => a.slug === article.slug);
  const order = article.seriesOrder ?? index + 1;

  const links = [];
  if (index > 0) {
    links.push(`<a class="article-series__link" href="../${series.articles[index - 1].slug}/">← Предыдущая статья</a>`);
  }
  if (index < count - 1) {
    links.push(`<a class="article-series__link" href="../${series.articles[index + 1].slug}/">Следующая статья →</a>`);
  }

  const nav = links.length > 0 ? `\n          <nav class="article-series__nav">${links.join('\n          ')}</nav>` : '';

  return `
      <div class="article-series">
        <div class="article-series__label">Рубрика «${escapeHtml(series.title)}» · статья ${order} из ${count}</div>${nav}
      </div>`;
}

function generateDataJson(articles, seriesMap) {
  const payload = {
    site: SITE,
    series: Object.fromEntries(
      Object.entries(seriesMap).map(([slug, series]) => [slug, {
        title: series.title,
        description: series.description,
        count: series.articles.length,
        articles: series.articles.map((a) => a.slug),
      }])
    ),
    articles: articles.map((article) => {
      const series = article.series && seriesMap[article.series];
      return {
        slug: article.slug,
        title: article.title,
        description: article.description,
        date: article.date,
        tags: article.tags,
        featured: article.featured === true,
        ...(series ? {
          series: article.series,
          seriesTitle: series.title,
          seriesOrder: article.seriesOrder ?? null,
          seriesCount: series.articles.length,
        } : {}),
      };
    }),
  };

  ensureDir(path.dirname(DATA_PATH));
  fs.writeFileSync(DATA_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
  console.log(`Data written: ${DATA_PATH} (${payload.articles.length} articles)`);
}

function renderArticlePage(article, template, seriesMap) {
  const formattedDate = formatDate(article.date);
  const tagsHtml = article.tags
    .map((tag) => `<span class="article-card__tag">${escapeHtml(tag)}</span>`)
    .join('\n            ');

  const contentHtml = marked.parse(article.content, { async: false });
  const seriesBlock = renderSeriesBlock(article, seriesMap);

  return template
    .replace(/\{\{title\}\}/g, escapeHtml(article.title))
    .replace(/\{\{description\}\}/g, escapeHtml(article.description))
    .replace(/\{\{date\}\}/g, article.date)
    .replace(/\{\{formattedDate\}\}/g, formattedDate)
    .replace(/\{\{tags\}\}/g, tagsHtml)
    .replace(/\{\{seriesBlock\}\}/g, seriesBlock)
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

function generateArticlePages(articles, template, seriesMap) {
  for (const article of articles) {
    const articleDir = path.join(OUTPUT_DIR, article.slug);
    ensureDir(articleDir);

    const html = renderArticlePage(article, template, seriesMap);
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

  const seriesMap = buildSeriesMap(articles, loadSeriesRegistry());

  generateDataJson(articles, seriesMap);
  generateArticlePages(articles, template, seriesMap);
  generateRss();

  console.log('Build complete.');
}

build();
