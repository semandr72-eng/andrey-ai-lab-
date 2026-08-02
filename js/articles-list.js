(function () {
  let allArticles = [];
  let activeTag = 'all';

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/articles/')) {
      return '../';
    }
    return './';
  }

  function createArticleCard(article, index) {
    const basePath = getBasePath();
    const tagsHtml = article.tags
      .map((tag) => `<span class="article-card__tag">${tag}</span>`)
      .join('');

    return `
      <article class="article-card" data-tilt data-reveal style="transition-delay: ${index * 80}ms">
        <div class="article-card__glow"></div>
        <div class="article-card__meta">
          <time datetime="${article.date}">${formatDate(article.date)}</time>
          ${tagsHtml}
        </div>
        <h3 class="article-card__title">${article.title}</h3>
        <p class="article-card__description">${article.description}</p>
        <a href="${basePath}articles/${article.slug}/index.html" class="article-card__link">Читать полностью</a>
      </article>
    `;
  }

  function getUniqueTags(articles) {
    const tags = new Set();
    articles.forEach((article) => {
      article.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  function renderTagFilter(container, articles) {
    if (!container) return;

    const tags = getUniqueTags(articles);
    const basePath = getBasePath();

    let html = `
      <button class="tag-filter ${activeTag === 'all' ? 'tag-filter--active' : ''}" data-tag="all">
        Все
      </button>
    `;

    tags.forEach((tag) => {
      html += `
        <button class="tag-filter ${activeTag === tag ? 'tag-filter--active' : ''}" data-tag="${tag}">
          ${tag}
        </button>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.tag-filter').forEach((button) => {
      button.addEventListener('click', () => {
        activeTag = button.dataset.tag;
        renderArticlesList();
      });
    });
  }

  function renderArticlesList() {
    const containers = document.querySelectorAll('[data-articles]');

    containers.forEach((container) => {
      const mode = container.dataset.articles;
      let articles = allArticles.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

      if (mode === 'featured') {
        articles = articles.filter((article) => article.featured).slice(0, 4);
      }

      if (activeTag !== 'all') {
        articles = articles.filter((article) => article.tags.includes(activeTag));
      }

      container.innerHTML = articles.map((article, index) => createArticleCard(article, index)).join('');

      // Re-initialize tilt and glow for new cards
      if (window.initCardEffects) {
        window.initCardEffects();
      }

      // Re-initialize reveal observer
      if (window.initRevealObserver) {
        window.initRevealObserver();
      }
    });

    const filterContainer = document.querySelector('[data-tag-filter]');
    if (filterContainer && allArticles.length > 0) {
      renderTagFilter(filterContainer, allArticles);
    }
  }

  async function loadArticles() {
    const basePath = getBasePath();
    try {
      const response = await fetch(`${basePath}data/articles.json`);
      if (!response.ok) throw new Error('Failed to load articles');
      const data = await response.json();
      allArticles = data.articles || [];
      renderArticlesList();
    } catch (error) {
      console.error('Articles load error:', error);
      document.querySelectorAll('[data-articles]').forEach((container) => {
        container.innerHTML = '<p class="articles__error">Не удалось загрузить статьи.</p>';
      });
    }
  }

  document.addEventListener('DOMContentLoaded', loadArticles);
})();
