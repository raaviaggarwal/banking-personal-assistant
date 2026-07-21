export function extractArticles(data) {
  const articles = [];

  if (data.sections) {
    for (const [, section] of Object.entries(data.sections)) {
      if (section.articles) {
        for (const article of section.articles) {
          articles.push({
            sectionTitle: section.title,
            articleTitle: article.title,
            keywords: article.keywords || [],
            content: article.content,
            lastUpdated: article.lastUpdated,
            documentRef: data.documentRef || '',
          });
        }
      }
    }
  } else if (data.articles) {
    for (const article of data.articles) {
      articles.push({
        sectionTitle: data.title,
        articleTitle: article.title,
        keywords: article.keywords || [],
        content: article.content,
        lastUpdated: article.lastUpdated,
        documentRef: data.documentRef,
      });
    }
  }

  return articles;
}

export function chunkLongContent(text, maxLen = 800) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLen - 100) {
    chunks.push(text.slice(i, i + maxLen));
  }
  return chunks;
}
