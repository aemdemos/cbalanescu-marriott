export default async function decorate(block) {
  const row = block.children[0];
  if (!row) return;

  const cells = [...row.children];
  // cells[0] = destination, cells[1] = dates, cells[2] = CTA button

  // Build the search form structure
  const form = document.createElement('div');
  form.classList.add('search-bar-form');

  // Destination field
  const destField = document.createElement('div');
  destField.classList.add('search-bar-field', 'search-bar-destination');
  const destLabel = document.createElement('label');
  destLabel.textContent = 'Destination';
  const destIcon = document.createElement('span');
  destIcon.classList.add('search-bar-icon', 'search-bar-icon-location');
  destIcon.textContent = '📍';
  const destInput = document.createElement('input');
  destInput.type = 'text';
  destInput.placeholder = 'Where can we take you?';
  destInput.setAttribute('aria-label', 'Destination');
  destLabel.prepend(destIcon);
  destField.append(destLabel, destInput);

  // Dates field
  const datesField = document.createElement('div');
  datesField.classList.add('search-bar-field', 'search-bar-dates');
  const datesLabel = document.createElement('label');
  datesLabel.textContent = 'Dates';
  const datesIcon = document.createElement('span');
  datesIcon.classList.add('search-bar-icon', 'search-bar-icon-dates');
  datesIcon.textContent = '📅';
  const datesInput = document.createElement('input');
  datesInput.type = 'text';
  datesInput.placeholder = 'Add dates';
  datesInput.setAttribute('aria-label', 'Dates');
  datesLabel.prepend(datesIcon);
  datesField.append(datesLabel, datesInput);

  // CTA button
  const ctaCell = cells[2];
  const ctaField = document.createElement('div');
  ctaField.classList.add('search-bar-cta');
  const ctaLink = ctaCell?.querySelector('a');
  if (ctaLink) {
    ctaLink.classList.add('search-bar-button');
    ctaLink.textContent = ctaLink.textContent.trim();
    // Prepend search icon
    const searchIcon = document.createElement('span');
    searchIcon.classList.add('search-bar-icon', 'search-bar-icon-search');
    searchIcon.textContent = '🔍';
    ctaLink.prepend(searchIcon);
    ctaField.append(ctaLink);
  }

  form.append(destField, datesField, ctaField);

  // Replace block content
  block.textContent = '';
  block.append(form);
}
