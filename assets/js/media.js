const fallbackBindings = new WeakSet();

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character]);
}

function isLocalPath(value) {
  const path = typeof value === 'string' ? value.trim() : '';
  return Boolean(path) && !path.startsWith('//') && !/^[a-z][a-z\d+.-]*:/i.test(path);
}

function assetPath(path, basePath) {
  return path.startsWith('/') ? path : `${basePath}${path}`;
}

export function shouldAutoplayMedia({ reducedMotion, narrowViewport }) {
  return !reducedMotion && !narrowViewport;
}

export function mediaMarkup(project, options = {}) {
  const title = escapeHtml(project.title);
  const basePath = options.basePath || '';
  const cover = escapeHtml(assetPath(String(project.cover || '').trim(), basePath));
  const video = typeof project.video === 'string' ? project.video.trim() : '';

  if (!isLocalPath(video)) {
    return `<img data-media src="${cover}" alt="${title}">`;
  }

  const source = escapeHtml(assetPath(video, basePath));
  return `<video data-media aria-label="${title}"${options.autoplay ? ' autoplay' : ''}${options.controls || options.autoplay ? ' controls' : ''} muted loop playsinline preload="metadata" poster="${cover}" src="${source}"></video>`;
}

export function applyMediaFallbacks(root) {
  root?.querySelectorAll?.('[data-media]').forEach((media) => {
    if (fallbackBindings.has(media)) return;

    fallbackBindings.add(media);
    media.addEventListener('error', () => {
      const label = media.getAttribute('aria-label') || media.getAttribute('alt') || 'MVAS media';
      const fallback = media.ownerDocument.createElement('div');
      const mark = media.ownerDocument.createElement('span');

      fallback.className = 'media-fallback';
      fallback.setAttribute('role', 'img');
      fallback.setAttribute('aria-label', label);
      mark.textContent = 'MVAS';
      fallback.append(mark);
      media.replaceWith(fallback);
    }, { once: true });
  });
}
