export default async function decorate(block) {
  const rows = [...block.children];
  const headingRow = rows[0];
  const categoryRows = rows.slice(1);

  // Mark heading
  headingRow.classList.add('brand-showcase-heading');

  // Create a flex container for all categories
  const categoriesContainer = document.createElement('div');
  categoriesContainer.classList.add('brand-showcase-categories');

  categoryRows.forEach((row) => {
    const cells = [...row.children];
    const card = document.createElement('div');
    card.classList.add('brand-showcase-card');

    if (cells.length >= 2) {
      // Info cell: title + description
      const infoCell = cells[0];
      const h3 = infoCell.querySelector('h3');
      const p = infoCell.querySelector('p');

      if (h3) card.appendChild(h3);
      if (p) {
        p.classList.add('brand-showcase-desc');
        card.appendChild(p);
      }

      // Logos cell: extract links
      const logosCell = cells[1];
      const logosDiv = document.createElement('div');
      logosDiv.classList.add('brand-showcase-logos');

      const links = [...logosCell.querySelectorAll('a')];
      links.forEach((link) => {
        logosDiv.appendChild(link);
      });

      card.appendChild(logosDiv);
    }

    categoriesContainer.appendChild(card);
  });

  // Remove original category rows and append restructured content
  categoryRows.forEach((row) => row.remove());
  block.appendChild(categoriesContainer);
}
