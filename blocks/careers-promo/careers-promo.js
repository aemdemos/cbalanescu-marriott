export default async function decorate(block) {
  // Single row with image cell and text cell
  const row = block.children[0];
  if (!row) return;

  const cells = [...row.children];
  const imgCell = cells[0];
  const textCell = cells[1];

  // Make the entire block clickable by wrapping in a link
  const link = textCell?.querySelector('a');
  if (link) {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');

    // Wrap entire block content in the link for full-area click
    const wrapper = document.createElement('a');
    wrapper.href = link.href;
    wrapper.target = '_blank';
    wrapper.rel = 'noopener noreferrer';
    wrapper.style.display = 'contents';
    wrapper.setAttribute('aria-label', link.textContent.trim());

    // Move row content into wrapper
    while (block.firstChild) {
      wrapper.appendChild(block.firstChild);
    }
    block.appendChild(wrapper);
  }
}
