export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const row = rows[0];
  const cells = [...row.children];

  // Cell 0 = image, Cell 1 = text content
  const imageCell = cells[0];
  const textCell = cells[1];

  // Mark cells for CSS targeting
  if (imageCell) imageCell.classList.add('hero-banner-image');
  if (textCell) textCell.classList.add('hero-banner-content');
}
