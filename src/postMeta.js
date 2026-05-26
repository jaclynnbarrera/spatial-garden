export const TYPE_LABELS = {
  link: 'Link',
  image: 'Image',
  text: 'Text',
};

export function formatAddedDate(value) {
  if (!value) return '';

  const parsed = value.includes('T')
    ? new Date(value)
    : new Date(`${value.replace(' ', 'T')}Z`);

  if (Number.isNaN(parsed.getTime())) return '';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

export function formatAddedLabel(value) {
  const formatted = formatAddedDate(value);
  return formatted ? `Added ${formatted}` : '';
}
