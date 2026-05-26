import * as cheerio from 'cheerio';

const USER_AGENT =
  'Mozilla/5.0 (compatible; SpatialGarden/1.0; +https://github.com/jaclynnbarrera/spatial-garden)';

function resolveUrl(base, value) {
  if (!value) return null;
  try {
    return new URL(value, base).href;
  } catch {
    return null;
  }
}

export async function fetchLinkPreview(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Could not fetch link (${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('meta[name="twitter:title"]').attr('content')?.trim() ||
    $('title').text()?.trim() ||
    url;

  const excerpt =
    $('meta[property="og:description"]').attr('content')?.trim() ||
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[name="twitter:description"]').attr('content')?.trim() ||
    '';

  const image =
    resolveUrl(url, $('meta[property="og:image"]').attr('content')) ||
    resolveUrl(url, $('meta[name="twitter:image"]').attr('content'));

  return { title, excerpt, image, url };
}
