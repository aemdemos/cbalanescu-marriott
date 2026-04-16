export default async function decorate(block) {
  const rows = [...block.children];
  if (rows.length === 0) return;

  const row = rows[0];
  const cells = [...row.children];

  // Find the link in the last cell and extract the href
  const linkCell = cells[cells.length - 1];
  const link = linkCell ? linkCell.querySelector('a') : null;

  if (link) {
    // Make the entire card clickable via click handler (preserving DOM structure)
    const href = link.href;
    block.style.cursor = 'pointer';
    block.addEventListener('click', (e) => {
      if (!e.defaultPrevented) {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    });
    block.setAttribute('role', 'link');
    block.setAttribute('aria-label', 'Unlock extraordinary experiences with the Marriott Bonvoy™ app.');
    block.tabIndex = 0;
    block.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    });
  }
}
