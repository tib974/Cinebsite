import { marked } from 'marked';

const markdownFiles = import.meta.glob('../../docs/content/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

marked.setOptions({ mangle: false, headerIds: false });

function parseFrontmatter(raw) {
  const frontmatterRegex = /^---\n([\s\S]+?)\n---\n?/;
  const match = raw.match(frontmatterRegex);
  const frontmatter = {};
  let body = raw;

  if (match) {
    body = raw.slice(match[0].length);
    match[1].split('\n').forEach((line) => {
      const [key, ...rest] = line.split(':');
      if (!key) return;
      frontmatter[key.trim()] = rest.join(':').trim();
    });
  }

  return { frontmatter, body };
}

function filenameToSlug(filePath) {
  return filePath
    .split('/')
    .pop()
    .replace(/\.md$/i, '')
    .trim();
}

const guides = Object.entries(markdownFiles)
  .map(([filePath, raw]) => {
    const { frontmatter, body } = parseFrontmatter(raw);
    const slug = frontmatter.slug || filenameToSlug(filePath);
    const order = Number(frontmatter.order ?? 99);

    return {
      slug,
      title: frontmatter.title || slug,
      excerpt: frontmatter.excerpt || '',
      order,
      content: body.trim(),
      html: marked.parse(body.trim()),
    };
  })
  .sort((a, b) => {
    if (a.order === b.order) {
      return a.title.localeCompare(b.title);
    }
    return a.order - b.order;
  });

export function getGuides() {
  return guides;
}

export function getGuide(slug) {
  return guides.find((guide) => guide.slug === slug);
}
