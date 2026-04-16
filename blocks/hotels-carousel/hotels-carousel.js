export default async function decorate(block) {
  const rows = [...block.children];

  // Build carousel track
  const track = document.createElement('div');
  track.className = 'carousel-track';

  rows.forEach((row) => {
    const cells = [...row.children];
    const imageCell = cells[0];
    const textCell = cells[1];

    const card = document.createElement('div');
    card.className = 'card';

    // Extract link from text cell
    const link = textCell ? textCell.querySelector('a') : null;
    const href = link ? link.href : '#';

    // Build card link wrapper
    const a = document.createElement('a');
    a.href = href;

    // Move picture into the link
    const picture = imageCell ? imageCell.querySelector('picture') : null;
    if (picture) {
      a.appendChild(picture);
    }

    // Build text overlay
    const content = document.createElement('div');
    content.className = 'card-content';

    if (textCell) {
      const paragraphs = textCell.querySelectorAll('p');
      const heading = textCell.querySelector('h3');

      // First paragraph is the eyebrow (location)
      if (paragraphs[0] && !paragraphs[0].querySelector('a')) {
        const eyebrow = document.createElement('p');
        eyebrow.className = 'eyebrow';
        eyebrow.textContent = paragraphs[0].textContent;
        content.appendChild(eyebrow);
      }

      // Heading is the hotel name
      if (heading) {
        const h3 = document.createElement('h3');
        h3.textContent = heading.textContent;
        content.appendChild(h3);
      }
    }

    a.appendChild(content);
    card.appendChild(a);
    track.appendChild(card);
  });

  // Arrow button
  const arrow = document.createElement('button');
  arrow.className = 'carousel-arrow';
  arrow.setAttribute('aria-label', 'Next');
  arrow.innerHTML = '&#8250;';
  arrow.addEventListener('click', () => {
    const cardWidth = track.querySelector('.card')?.offsetWidth || 300;
    track.scrollBy({ left: cardWidth + 12, behavior: 'smooth' });
  });

  // Pagination dots
  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'carousel-dots';
  const totalPages = Math.ceil(rows.length / 3);
  for (let i = 0; i < totalPages; i += 1) {
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', `Page ${i + 1}`);
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
      const cardWidth = track.querySelector('.card')?.offsetWidth || 300;
      track.scrollTo({ left: i * (cardWidth + 12) * 3, behavior: 'smooth' });
      dotsContainer.querySelectorAll('button').forEach((d) => d.classList.remove('active'));
      dot.classList.add('active');
    });
    dotsContainer.appendChild(dot);
  }

  // Update dots on scroll
  track.addEventListener('scroll', () => {
    const cardWidth = track.querySelector('.card')?.offsetWidth || 300;
    const pageIndex = Math.round(track.scrollLeft / ((cardWidth + 12) * 3));
    dotsContainer.querySelectorAll('button').forEach((d, idx) => {
      d.classList.toggle('active', idx === pageIndex);
    });
  });

  // Clear block and assemble
  block.textContent = '';
  block.appendChild(track);
  block.appendChild(arrow);
  block.appendChild(dotsContainer);
}
