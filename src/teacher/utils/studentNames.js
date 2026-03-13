function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeNameToken(value) {
  return normalizeWhitespace(value)
    .split(' ')
    .filter(Boolean)
    .map((token) => {
      const cleaned = token.replace(/[^a-zA-Z'-]/g, '');

      if (!cleaned) {
        return '';
      }

      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    })
    .filter(Boolean)
    .join(' ');
}

export function normalizeLastInitial(value) {
  const cleaned = value.replace(/[^a-zA-Z]/g, '').trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() : '';
}

export function buildStudentRecord({ firstName, lastInitial = '' }) {
  const normalizedFirstName = normalizeNameToken(firstName);
  const normalizedLastInitial = normalizeLastInitial(lastInitial);

  if (!normalizedFirstName) {
    throw new Error('Student first name is required.');
  }

  return {
    displayName: normalizedLastInitial
      ? `${normalizedFirstName} ${normalizedLastInitial}.`
      : normalizedFirstName,
    sortName: normalizedLastInitial
      ? `${normalizedFirstName.toLowerCase()} ${normalizedLastInitial.toLowerCase()}`
      : normalizedFirstName.toLowerCase(),
  };
}

export function parseBulkStudentText(value) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  return lines.map((line) => {
    const tokens = line.split(' ').filter(Boolean);
    const firstName = tokens[0] || '';
    const lastInitial = tokens[1] || '';

    return buildStudentRecord({ firstName, lastInitial });
  });
}
