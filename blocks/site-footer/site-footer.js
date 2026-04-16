export default async function decorate(block) {
  const rows = [...block.children];

  // Rows 0-2: accordion sections (Top Destinations, For Guests, Our Company)
  // Row 3: social links (Follow us)
  // Row 4: copyright
  // Row 5: legal links

  // Group accordion rows into a container for desktop layout
  const accordionRows = rows.slice(0, 3);
  const socialRow = rows[3];
  const copyrightRow = rows[4];
  const legalRow = rows[5];

  // Create accordion group wrapper
  const accordionGroup = document.createElement('div');
  accordionGroup.className = 'accordion-group';
  accordionRows.forEach((row) => {
    const cell = row.querySelector(':scope > div');
    if (cell) {
      const h2 = cell.querySelector('h2');
      const ul = cell.querySelector('ul');
      if (h2 && ul) {
        h2.addEventListener('click', () => {
          // Only toggle on mobile
          if (window.innerWidth < 900) {
            h2.classList.toggle('open');
            ul.classList.toggle('open');
          }
        });
      }
      accordionGroup.append(cell);
    }
  });

  // Add semantic classes to social, copyright, legal rows
  if (socialRow) {
    const cell = socialRow.querySelector(':scope > div');
    if (cell) cell.classList.add('social-row');
  }
  if (copyrightRow) {
    const cell = copyrightRow.querySelector(':scope > div');
    if (cell) cell.classList.add('copyright-row');
  }
  if (legalRow) {
    const cell = legalRow.querySelector(':scope > div');
    if (cell) cell.classList.add('legal-row');
  }

  // Rebuild block structure
  block.textContent = '';

  // Accordion group as its own row
  const accordionWrapper = document.createElement('div');
  accordionWrapper.append(accordionGroup);
  block.append(accordionWrapper);

  // Social, copyright, legal as individual rows
  if (socialRow) block.append(socialRow);
  if (copyrightRow) block.append(copyrightRow);
  if (legalRow) block.append(legalRow);
}
