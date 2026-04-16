/* eslint-disable */
/**
 * Converts AEM EDS .plain.html files to Word (.docx) format for SharePoint upload.
 *
 * Usage: node tools/html-to-docx.js
 *
 * Generates:
 *   output/en-gb-default.docx  (main page)
 *   output/nav.docx            (navigation)
 *   output/footer.docx         (footer)
 */

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ExternalHyperlink, HeadingLevel, WidthType, BorderStyle,
  AlignmentType, TableLayoutType, ImageRun,
} = require('docx');

// Simple HTML parser helpers
function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').trim();
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Parse inline HTML content into an array of TextRun / ExternalHyperlink objects.
 * Handles: <strong>, <em>, <a>, <h1>-<h6>, plain text, <img> alt text.
 */
function parseInlineContent(html) {
  const runs = [];
  if (!html) return runs;

  // Normalize whitespace
  let content = html.replace(/\s+/g, ' ').trim();

  // Process content token by token
  const regex = /<(strong|b|em|i|a|img|picture|br|span)\b([^>]*)>(.*?)<\/\1>|<(img|br|picture)\b([^>]*?)\/?>|([^<]+)/gs;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match[6]) {
      // Plain text
      const text = decodeEntities(match[6].trim());
      if (text) runs.push(new TextRun({ text }));
    } else if (match[4] === 'img') {
      // Self-closing img
      const altMatch = match[5]?.match(/alt="([^"]*)"/);
      if (altMatch && altMatch[1]) {
        runs.push(new TextRun({ text: `[image: ${altMatch[1]}]`, italics: true }));
      }
    } else if (match[4] === 'br') {
      runs.push(new TextRun({ break: 1 }));
    } else if (match[1] === 'picture') {
      // Picture element - extract img inside
      const imgMatch = match[3]?.match(/<img[^>]*alt="([^"]*)"[^>]*>/);
      if (imgMatch && imgMatch[1]) {
        runs.push(new TextRun({ text: `[image: ${imgMatch[1]}]`, italics: true }));
      }
    } else if (match[1] === 'strong' || match[1] === 'b') {
      const innerRuns = parseInlineContent(match[3]);
      innerRuns.forEach((r) => {
        if (r instanceof TextRun) {
          runs.push(new TextRun({ ...r, bold: true }));
        } else {
          runs.push(r);
        }
      });
    } else if (match[1] === 'em' || match[1] === 'i') {
      const innerRuns = parseInlineContent(match[3]);
      innerRuns.forEach((r) => {
        if (r instanceof TextRun) {
          runs.push(new TextRun({ ...r, italics: true }));
        } else {
          runs.push(r);
        }
      });
    } else if (match[1] === 'a') {
      const hrefMatch = match[2]?.match(/href="([^"]*)"/);
      const linkText = stripTags(match[3]);
      if (hrefMatch && linkText) {
        runs.push(
          new ExternalHyperlink({
            children: [new TextRun({ text: decodeEntities(linkText), style: 'Hyperlink' })],
            link: hrefMatch[1],
          }),
        );
      } else if (linkText) {
        runs.push(new TextRun({ text: decodeEntities(linkText) }));
      }
    } else if (match[1] === 'span') {
      const innerText = stripTags(match[3]);
      if (innerText) runs.push(new TextRun({ text: decodeEntities(innerText) }));
    }
  }

  return runs;
}

/**
 * Convert a cell's HTML content into an array of Paragraph objects.
 */
function cellHtmlToParagraphs(html) {
  const paragraphs = [];
  if (!html || !html.trim()) {
    paragraphs.push(new Paragraph({ children: [] }));
    return paragraphs;
  }

  // Split into block-level elements
  const blockRegex = /<(h[1-6]|p|ul|ol|li|picture|div)\b[^>]*>([\s\S]*?)<\/\1>|<(picture|img)\b[^>]*?\/?>|([^<]+)/gi;
  let blockMatch;
  const content = html.trim();

  // Check for heading tags
  const headingRegex = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const pRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  const ulRegex = /<ul\b[^>]*>([\s\S]*?)<\/ul>/gi;
  const pictureRegex = /<picture\b[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>[\s\S]*?<\/picture>/gi;
  const imgRegex = /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi;

  // Process headings
  let hMatch;
  const elements = [];

  // Collect all elements with their positions
  const allRegex = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>|<p\b[^>]*>([\s\S]*?)<\/p>|<ul\b[^>]*>([\s\S]*?)<\/ul>|<picture\b[^>]*>[\s\S]*?<img[^>]*alt="([^"]*)"[^>]*>[\s\S]*?<\/picture>/gi;
  let elMatch;

  while ((elMatch = allRegex.exec(content)) !== null) {
    if (elMatch[1]) {
      // Heading
      const level = parseInt(elMatch[1][1], 10);
      const headingLevels = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
      };
      elements.push(
        new Paragraph({
          heading: headingLevels[level] || HeadingLevel.HEADING_2,
          children: parseInlineContent(elMatch[2]),
        }),
      );
    } else if (elMatch[3] !== undefined) {
      // Paragraph
      const runs = parseInlineContent(elMatch[3]);
      if (runs.length > 0) {
        elements.push(new Paragraph({ children: runs }));
      }
    } else if (elMatch[4] !== undefined) {
      // Unordered list
      const liRegex = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch;
      while ((liMatch = liRegex.exec(elMatch[4])) !== null) {
        const runs = parseInlineContent(liMatch[1]);
        elements.push(
          new Paragraph({
            children: runs,
            bullet: { level: 0 },
          }),
        );
      }
    } else if (elMatch[5] !== undefined) {
      // Picture/Image
      elements.push(
        new Paragraph({
          children: [new TextRun({ text: `[image: ${elMatch[5]}]`, italics: true })],
        }),
      );
    }
  }

  if (elements.length > 0) return elements;

  // Fallback: just parse as inline
  const runs = parseInlineContent(content);
  if (runs.length > 0) {
    paragraphs.push(new Paragraph({ children: runs }));
  } else {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: decodeEntities(stripTags(content)) })] }));
  }
  return paragraphs;
}

/**
 * Build a Word Table for an EDS block.
 */
function buildBlockTable(blockName, rows) {
  const noBorder = { style: BorderStyle.SINGLE, size: 1, color: '999999' };
  const borders = {
    top: noBorder, bottom: noBorder, left: noBorder, right: noBorder,
  };

  const tableRows = [];

  // Header row with block name
  tableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: blockName, bold: true })],
          })],
          columnSpan: Math.max(1, rows.length > 0 ? (rows[0]?.length || 1) : 1),
          borders,
          shading: { fill: 'E2EFDA' },
        }),
      ],
    }),
  );

  // Content rows
  rows.forEach((cells) => {
    tableRows.push(
      new TableRow({
        children: cells.map((cellHtml) => new TableCell({
          children: cellHtmlToParagraphs(cellHtml),
          borders,
          width: { size: Math.floor(100 / cells.length), type: WidthType.PERCENTAGE },
        })),
      }),
    );
  });

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
  });
}

/**
 * Parse a .plain.html file into sections, each containing default content and blocks.
 */
function parsePlainHtml(html) {
  const sections = [];

  // Split into top-level divs (sections)
  const sectionRegex = /<div>\s*([\s\S]*?)\s*<\/div>\s*(?=<div>|$)/gi;
  // Better approach: split by top-level divs
  const topDivs = [];
  let depth = 0;
  let currentDiv = '';
  let inTag = false;
  let i = 0;

  while (i < html.length) {
    if (html[i] === '<') {
      inTag = true;
      if (html.substring(i, i + 4) === '<div') {
        if (depth === 0) {
          if (currentDiv.trim()) topDivs.push(currentDiv.trim());
          currentDiv = '';
        }
        depth++;
      } else if (html.substring(i, i + 6) === '</div>') {
        depth--;
        if (depth === 0) {
          currentDiv += '</div>';
          topDivs.push(currentDiv.trim());
          currentDiv = '';
          i += 6;
          continue;
        }
      }
    }
    if (html[i] === '>') inTag = false;
    currentDiv += html[i];
    i++;
  }
  if (currentDiv.trim()) topDivs.push(currentDiv.trim());

  // Process each top-level div as a section
  topDivs.forEach((sectionHtml) => {
    const section = { defaultContent: [], blocks: [] };

    // Find blocks (divs with class attributes)
    const blockRegex = /<div class="([^"]+)">\s*([\s\S]*?)\s*<\/div>\s*(?=<div class=|<\/div>|$)/gi;

    // Extract content before any block div, and block divs
    // Remove outer <div> wrapper
    let inner = sectionHtml.replace(/^<div>\s*/, '').replace(/\s*<\/div>\s*$/, '');

    // Find all block divs
    const blockDivRegex = /<div class="([^"]+)">([\s\S]*?)<\/div>(?=\s*(?:<div class=|$))/gi;

    // Simpler approach: manually find blocks
    const blocks = [];
    const classBlockRegex = /<div class="([^"]+)">/g;
    let bMatch;
    const blockPositions = [];

    while ((bMatch = classBlockRegex.exec(inner)) !== null) {
      blockPositions.push({ name: bMatch[1], start: bMatch.index });
    }

    // Extract block content
    blockPositions.forEach((bp, idx) => {
      // Find the matching closing div
      let bDepth = 0;
      let bEnd = bp.start;
      for (let j = bp.start; j < inner.length; j++) {
        if (inner.substring(j, j + 4) === '<div') bDepth++;
        if (inner.substring(j, j + 6) === '</div>') {
          bDepth--;
          if (bDepth === 0) {
            bEnd = j + 6;
            break;
          }
        }
      }

      const blockHtml = inner.substring(bp.start, bEnd);
      // Extract rows: direct child divs of the block
      const blockInner = blockHtml
        .replace(/^<div class="[^"]+">/, '')
        .replace(/<\/div>$/, '')
        .trim();

      // Parse rows (each direct child <div> of the block)
      const rowsData = [];
      let rDepth = 0;
      let rowStart = -1;
      for (let j = 0; j < blockInner.length; j++) {
        if (blockInner.substring(j, j + 4) === '<div') {
          if (rDepth === 0) rowStart = j;
          rDepth++;
        }
        if (blockInner.substring(j, j + 6) === '</div>') {
          rDepth--;
          if (rDepth === 0 && rowStart >= 0) {
            const rowHtml = blockInner.substring(rowStart, j + 6);
            // Parse cells within row
            const rowInner = rowHtml.replace(/^<div>/, '').replace(/<\/div>$/, '').trim();

            // Find cell divs
            const cells = [];
            let cDepth = 0;
            let cellStart = -1;
            let hasChildDivs = false;

            for (let k = 0; k < rowInner.length; k++) {
              if (rowInner.substring(k, k + 4) === '<div') {
                if (cDepth === 0) { cellStart = k; hasChildDivs = true; }
                cDepth++;
              }
              if (rowInner.substring(k, k + 6) === '</div>') {
                cDepth--;
                if (cDepth === 0 && cellStart >= 0) {
                  const cellHtml = rowInner.substring(cellStart, k + 6)
                    .replace(/^<div>/, '').replace(/<\/div>$/, '').trim();
                  cells.push(cellHtml);
                  cellStart = -1;
                }
              }
            }

            if (!hasChildDivs) {
              // Single-cell row
              cells.push(rowInner);
            }

            rowsData.push(cells);
            rowStart = -1;
          }
        }
      }

      blocks.push({ name: bp.name, rows: rowsData });
    });

    // Extract default content (before the first block)
    if (blockPositions.length > 0) {
      const beforeBlocks = inner.substring(0, blockPositions[0].start).trim();
      if (beforeBlocks) {
        section.defaultContent = cellHtmlToParagraphs(beforeBlocks);
      }
    } else {
      // No blocks, all default content
      if (inner.trim()) {
        section.defaultContent = cellHtmlToParagraphs(inner);
      }
    }

    section.blocks = blocks;
    sections.push(section);
  });

  return sections;
}

/**
 * Build a complete Word document from sections.
 */
function buildDocument(sections) {
  const children = [];

  sections.forEach((section, sIdx) => {
    // Section separator (horizontal rule) between sections
    if (sIdx > 0) {
      children.push(
        new Paragraph({
          children: [],
          thematicBreak: true,
        }),
      );
    }

    // Default content
    if (section.defaultContent.length > 0) {
      children.push(...section.defaultContent);
    }

    // Blocks
    section.blocks.forEach((block) => {
      // Normalize max columns
      let maxCols = 1;
      block.rows.forEach((row) => {
        if (row.length > maxCols) maxCols = row.length;
      });

      // Pad rows to same column count
      const paddedRows = block.rows.map((row) => {
        while (row.length < maxCols) row.push('');
        return row;
      });

      children.push(buildBlockTable(block.name, paddedRows));
      children.push(new Paragraph({ children: [] })); // spacer
    });
  });

  return new Document({
    sections: [{
      children,
    }],
  });
}

/**
 * Build nav document.
 */
function buildNavDocument(html) {
  const sections = parsePlainHtml(html);
  return buildDocument(sections);
}

async function main() {
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const files = [
    { src: 'content/en-gb-default.plain.html', out: 'en-gb-default.docx', label: 'Main page' },
    { src: 'content/nav.plain.html', out: 'nav.docx', label: 'Navigation' },
    { src: 'content/footer.plain.html', out: 'footer.docx', label: 'Footer' },
  ];

  for (const file of files) {
    const srcPath = path.join(__dirname, '..', file.src);
    if (!fs.existsSync(srcPath)) {
      console.log(`⚠ Skipping ${file.label}: ${file.src} not found`);
      continue;
    }

    const html = fs.readFileSync(srcPath, 'utf-8');
    const sections = parsePlainHtml(html);
    const doc = buildDocument(sections);
    const buffer = await Packer.toBuffer(doc);
    const outPath = path.join(outputDir, file.out);
    fs.writeFileSync(outPath, buffer);
    console.log(`✓ ${file.label} → ${file.out} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  console.log(`\nFiles saved to: ${outputDir}/`);
  console.log('Upload these to your SharePoint folder:');
  console.log('  https://adobe.sharepoint.com/:f:/r/sites/AEMDemos/Shared%20Documents/sites/esaas-demos/cbalanescu-marriott');
}

main().catch(console.error);
