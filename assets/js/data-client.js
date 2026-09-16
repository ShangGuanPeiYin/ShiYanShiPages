export async function loadJson(path) {
  const response = await fetch(path, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Unable to load ${path}: HTTP ${response.status}`);
  return response.json();
}

export function validateCollection(name, records) {
  const slugs = new Set();

  for (const [index, record] of records.entries()) {
    for (const field of ['slug', 'title', 'summary', 'cover']) {
      if (!record[field]) throw new Error(`${name}[${index}] is missing ${field}`);
    }

    if (slugs.has(record.slug)) {
      throw new Error(`${name}[${index}] has duplicate slug "${record.slug}"`);
    }
    slugs.add(record.slug);
  }
  return records;
}

export function normalizeLinks(record) {
  const links = [];
  if (record.pdf?.startsWith('https://')) links.push({ label: 'PDF', href: record.pdf });
  if (record.video?.startsWith('https://')) links.push({ label: 'Video', href: record.video });
  if (record.code?.startsWith('https://')) links.push({ label: 'Code', href: record.code });
  if (record.doi) links.push({ label: 'DOI', href: `https://doi.org/${record.doi}` });
  return links;
}

export function showPageError(message) {
  document.querySelector('#page-status').textContent = message;
  document.querySelector('#page-status').hidden = false;
}
