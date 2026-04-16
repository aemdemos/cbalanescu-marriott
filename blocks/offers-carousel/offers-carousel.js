export default async function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 2) return;

  // First row is the header
  const headerRow = rows[0];
  headerRow.classList.add('offers-carousel-header');
  const headerCell = headerRow.querySelector(':scope > div');
  if (headerCell) {
    headerCell.classList.add('offers-carousel-header-content');
  }

  // Remaining rows are cards
  const cardRows = rows.slice(1);

  // Build carousel track
  const track = document.createElement('div');
  track.classList.add('offers-carousel-track');

  const slidesContainer = document.createElement('div');
  slidesContainer.classList.add('offers-carousel-slides');

  cardRows.forEach((row) => {
    const cells = [...row.children];
    const card = document.createElement('div');
    card.classList.add('offers-carousel-card');

    // Cell 0 = image, Cell 1 = text content
    const imgCell = cells[0];
    const textCell = cells[1];

    if (imgCell) {
      const imgWrapper = document.createElement('div');
      imgWrapper.classList.add('offers-carousel-card-image');
      imgWrapper.append(...imgCell.childNodes);
      card.append(imgWrapper);
    }

    if (textCell) {
      const overlay = document.createElement('div');
      overlay.classList.add('offers-carousel-card-overlay');

      // Parse text cell content
      const children = [...textCell.children];
      let badge = null;

      children.forEach((child) => {
        const text = child.textContent.trim();
        if (text === 'MEMBER EXCLUSIVE') {
          badge = document.createElement('span');
          badge.classList.add('offers-carousel-badge');
          badge.textContent = text;
        } else if (child.tagName === 'P' && !child.querySelector('a') && text !== 'MEMBER EXCLUSIVE') {
          const loc = document.createElement('span');
          loc.classList.add('offers-carousel-location');
          loc.textContent = text;
          overlay.append(loc);
        } else if (child.tagName === 'H4') {
          const title = document.createElement('h4');
          title.classList.add('offers-carousel-title');
          title.textContent = child.textContent;
          overlay.append(title);
        } else if (child.tagName === 'P' && child.querySelector('a')) {
          // Link is the card link - wrap entire card
          const link = child.querySelector('a');
          card.dataset.href = link.href;
        }
      });

      if (badge) {
        overlay.prepend(badge);
      }

      card.append(overlay);
    }

    // Make entire card clickable
    card.addEventListener('click', () => {
      if (card.dataset.href) {
        window.location.href = card.dataset.href;
      }
    });
    card.style.cursor = 'pointer';

    slidesContainer.append(card);
    row.remove();
  });

  track.append(slidesContainer);

  // Navigation arrows
  const nav = document.createElement('div');
  nav.classList.add('offers-carousel-nav');

  const prevBtn = document.createElement('button');
  prevBtn.classList.add('offers-carousel-prev');
  prevBtn.setAttribute('aria-label', 'Previous');
  prevBtn.innerHTML = '&#8249;';

  const nextBtn = document.createElement('button');
  nextBtn.classList.add('offers-carousel-next');
  nextBtn.setAttribute('aria-label', 'Next');
  nextBtn.innerHTML = '&#8250;';

  nav.append(prevBtn, nextBtn);

  // Dots
  const dots = document.createElement('div');
  dots.classList.add('offers-carousel-dots');

  const cards = slidesContainer.querySelectorAll('.offers-carousel-card');
  const totalCards = cards.length;
  let currentIndex = 0;
  const visibleCards = 3;
  const totalPages = Math.max(1, totalCards - visibleCards + 1);

  function updateDots() {
    dots.innerHTML = '';
    for (let i = 0; i < totalPages; i += 1) {
      const dot = document.createElement('button');
      dot.classList.add('offers-carousel-dot');
      if (i === currentIndex) dot.classList.add('active');
      dot.setAttribute('aria-label', `Page ${i + 1}`);
      dot.addEventListener('click', () => {
        currentIndex = i;
        updateCarousel();
      });
      dots.append(dot);
    }
  }

  function updateCarousel() {
    const cardWidth = cards[0]?.offsetWidth || 364;
    const gap = 16;
    const offset = currentIndex * (cardWidth + gap);
    slidesContainer.style.transform = `translateX(-${offset}px)`;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= totalPages - 1;
    updateDots();
  }

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      updateCarousel();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentIndex < totalPages - 1) {
      currentIndex += 1;
      updateCarousel();
    }
  });

  block.append(track, nav, dots);
  updateCarousel();
}
