export default async function decorate(block) {
  // The block has one row with two cells:
  // Cell 1: heading, description, CTA buttons
  // Cell 2: icon feature items (emoji + label text in <p> tags)
  const rows = [...block.children];
  if (rows.length === 0) return;

  const row = rows[0];
  const cells = [...row.children];

  // Process icons cell - split emoji from label text
  if (cells.length > 1) {
    const iconsCell = cells[1];
    const items = [...iconsCell.querySelectorAll('p')];
    items.forEach((p) => {
      const text = p.textContent.trim();
      // Split emoji from label — emoji is first character(s)
      const parts = text.match(/^(\S+)\s+(.+)$/);
      if (parts) {
        const icon = document.createElement('span');
        icon.className = 'promo-icon';
        icon.textContent = parts[1];
        icon.setAttribute('aria-hidden', 'true');

        const label = document.createElement('span');
        label.className = 'promo-label';
        label.textContent = parts[2];

        p.textContent = '';
        p.appendChild(icon);
        p.appendChild(label);
      }
    });
  }
}
