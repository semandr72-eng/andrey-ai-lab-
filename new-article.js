const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const SRC_DIR = path.join(__dirname, 'src', 'articles');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9а-яё\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function printUsage() {
  console.log(`
Usage:
  node new-article.js --slug my-article --title "My Article Title" --description "Short description" --tags "AI-архитектура, Агенты" [--featured] [--date 2026-08-10]

Options:
  --slug         Unique article identifier (used in URL). Required.
  --title        Article title. Required.
  --description  Short description for cards and RSS.
  --date         Publication date in YYYY-MM-DD format. Defaults to today.
  --tags         Comma-separated list of tags.
  --featured     Mark article as featured on the home page.

Examples:
  node new-article.js --slug ai-audit --title "AI аудит процессов" --description "Разбор кейса" --tags "AI-архитектура, Аудит" --featured
  npm run new-article -- --slug ai-audit --title "AI аудит процессов" --tags "AI-архитектура"
`);
}

function main() {
  const args = parseArgs(process.argv);

  if (!args.slug || !args.title || args.help) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }

  const slug = slugify(args.slug);
  if (!slug) {
    console.error('Error: slug is empty or invalid after slugification.');
    process.exit(1);
  }

  if (slug !== args.slug) {
    console.log(`Slug normalized: "${args.slug}" → "${slug}"`);
  }

  ensureDir(SRC_DIR);

  const filePath = path.join(SRC_DIR, `${slug}.md`);
  if (fs.existsSync(filePath)) {
    console.error(`Error: article already exists at ${filePath}`);
    process.exit(1);
  }

  const title = args.title.trim();
  const description = (args.description || '').trim();
  const date = args.date || today();
  const tags = (args.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const featured = args.featured === true || args.featured === 'true';

  const frontmatter = {
    slug,
    title,
    description,
    date,
    tags,
    featured,
  };

  const body = 'Начни писать статью здесь.\n';
  const fileContent = matter.stringify(body, frontmatter);

  fs.writeFileSync(filePath, fileContent, 'utf-8');
  console.log(`Created: ${filePath}`);
  console.log('Run "npm run build" to generate the site.');
}

main();
