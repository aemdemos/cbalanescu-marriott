export default async function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 2) return;

  // First row is the header (h3 + description) — leave as-is

  // Remaining rows are destination cards
  const cardRows = rows.slice(1);

  // Create carousel track
  const track = document.createElement('div');
  track.className = 'dc-track';

  cardRows.forEach((row) => {
    const cells = [...row.children];
    const card = document.createElement('div');
    card.className = 'dc-card';

    // Cell 0: image
    const imgCell = cells[0];
    const picture = imgCell?.querySelector('picture');
    if (picture) card.appendChild(picture);

    // Cell 1: text (h2 + link)
    const textCell = cells[1];
    const link = textCell?.querySelector('a');
    const h2 = textCell?.querySelector('h2');

    // Build card text overlay
    const cardText = document.createElement('div');
    cardText.className = 'dc-card-text';
    if (h2) cardText.appendChild(h2);
    card.appendChild(cardText);

    // Wrap the whole card in the link
    if (link) {
      const wrapper = document.createElement('a');
      wrapper.href = link.href;
      wrapper.setAttribute('aria-label', h2?.textContent || link.textContent);
      wrapper.append(...card.childNodes);
      card.appendChild(wrapper);
    }

    track.appendChild(card);
    row.remove();
  });

  // Wrap track in a relative container for arrow positioning
  const trackWrapper = document.createElement('div');
  trackWrapper.className = 'dc-track-wrapper';
  trackWrapper.appendChild(track);

  // Add next arrow button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'dc-next';
  nextBtn.setAttribute('aria-label', 'Next');
  nextBtn.textContent = '›';
  nextBtn.addEventListener('click', () => {
    const cardWidth = track.querySelector('.dc-card')?.offsetWidth || 0;
    const gap = 12;
    track.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
  });
  trackWrapper.appendChild(nextBtn);

  block.appendChild(trackWrapper);

  // Add pagination dots — one per scroll position (card count - visible + 1)
  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'dc-dots';
  const totalDots = Math.max(cardRows.length - 1, 1);
  for (let i = 0; i < totalDots; i += 1) {
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', `Page ${i + 1}`);
    if (i === 0) dot.className = 'active';
    dot.addEventListener('click', () => {
      const cardEl = track.querySelector('.dc-card');
      if (!cardEl) return;
      const cardWidth = cardEl.offsetWidth;
      const gap = 12;
      track.scrollTo({ left: i * (cardWidth + gap), behavior: 'smooth' });
      dotsContainer.querySelectorAll('button').forEach((d) => d.classList.remove('active'));
      dot.classList.add('active');
    });
    dotsContainer.appendChild(dot);
  }
  block.appendChild(dotsContainer);

  // Update dots on scroll
  track.addEventListener('scroll', () => {
    const cardEl = track.querySelector('.dc-card');
    if (!cardEl) return;
    const cardWidth = cardEl.offsetWidth;
    const gap = 12;
    const page = Math.round(track.scrollLeft / (cardWidth + gap));
    dotsContainer.querySelectorAll('button').forEach((d, idx) => {
      d.classList.toggle('active', idx === page);
    });
  });
}
