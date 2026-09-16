export function filterPublications(publications, query = '', year = '', type = '') {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return publications.filter((publication) => {
    const text = `${publication.title} ${publication.summary} ${publication.venue}`.toLocaleLowerCase();
    return (!normalizedQuery || text.includes(normalizedQuery))
      && (!year || String(publication.year) === String(year))
      && (!type || publication.type === type);
  });
}
