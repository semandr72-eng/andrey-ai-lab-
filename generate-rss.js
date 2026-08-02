const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data', 'articles.json');
const OUTPUT_PATH = path.join(__dirname, 'rss.xml');

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatRssDate(dateString) {
  const date = new Date(dateString);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = days[date.getUTCDay()];
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${dayName}, ${day} ${month} ${year} ${hours}:${minutes}:${seconds} +0000`;
}

function generateRss() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error(`File not found: ${DATA_PATH}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const site = data.site;
  const articles = data.articles
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const lastBuildDate = articles.length > 0
    ? formatRssDate(articles[0].date)
    : formatRssDate(new Date().toISOString());

  const items = articles.map((article) => {
    const link = `${site.url}/articles/${article.slug}/`;
    const tags = article.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('\n        ');

    return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${formatRssDate(article.date)}</pubDate>
      <description>${escapeXml(article.description)}</description>
      ${tags}
    </item>`;
  }).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${site.url}</link>
    <description>${escapeXml(site.description)}</description>
    <language>ru</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <managingEditor>${site.email} (${site.author})</managingEditor>
    <webMaster>${site.email} (${site.author})</webMaster>
    <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  fs.writeFileSync(OUTPUT_PATH, rss.trim() + '\n', 'utf-8');
  console.log(`RSS generated: ${OUTPUT_PATH} (${articles.length} articles)`);
}

generateRss();
