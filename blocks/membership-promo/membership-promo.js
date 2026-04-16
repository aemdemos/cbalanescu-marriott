export default async function decorate(block) {
  // The block has one row with two cells:
  // Cell 1: heading, description, CTA buttons
  // Cell 2: icon feature items (icon-name + label text in <p> tags)
  const rows = [...block.children];
  if (rows.length === 0) return;

  const row = rows[0];
  const cells = [...row.children];

  // Process icons cell
  if (cells.length > 1) {
    const iconsCell = cells[1];
    const items = [...iconsCell.querySelectorAll('p')];
    items.forEach((p) => {
      const text = p.textContent.trim();
      // Match :icon-name: LABEL or emoji LABEL patterns
      const iconMatch = text.match(/^:([a-z-]+):\s+(.+)$/);
      const emojiMatch = text.match(/^(\S+)\s+(.+)$/);

      if (iconMatch) {
        const [, iconName, labelText] = iconMatch;
        const icon = document.createElement('span');
        icon.className = 'promo-icon';
        icon.setAttribute('aria-hidden', 'true');

        const img = document.createElement('img');
        img.src = `/icons/${iconName}.svg`;
        img.alt = '';
        img.loading = 'lazy';
        img.width = 36;
        img.height = 36;
        icon.appendChild(img);

        const label = document.createElement('span');
        label.className = 'promo-label';
        label.textContent = labelText;

        p.textContent = '';
        p.appendChild(icon);
        p.appendChild(label);
      } else if (emojiMatch) {
        const icon = document.createElement('span');
        icon.className = 'promo-icon';
        const [, emojiIcon] = emojiMatch;
        icon.textContent = emojiIcon;
        icon.setAttribute('aria-hidden', 'true');

        const label = document.createElement('span');
        label.className = 'promo-label';
        const [,, emojiLabel] = emojiMatch;
        label.textContent = emojiLabel;

        p.textContent = '';
        p.appendChild(icon);
        p.appendChild(label);
      }
    });
  }
}
