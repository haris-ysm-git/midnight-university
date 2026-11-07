import fs from 'fs';
import path from 'path';

function slugifyHeading(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function parseArticleZones(rawContent, articleId, fileName = 'unknown.md') {
  const result = {
    openingMatter: {
      h1Title: '',
      monoId: articleId,
      provenanceLines: [],
      introduction: [],
    },
    bodyMarkdown: '',
    backMatter: {
      footnotes: [],
      bibliography: [],
      furtherReading: [],
      hasBackMatter: false,
    },
    tableOfContents: [],
    isFellBack: false,
  };

  try {
    const lines = rawContent.split(/\r?\n/);
    let i = 0;

    // 1. Skip Frontmatter if present
    if (lines[0]?.trim() === '---') {
      i++;
      while (i < lines.length && lines[i].trim() !== '---') {
        i++;
      }
      i++;
    }

    // 2. Find H1
    let h1LineIndex = -1;
    for (let j = i; j < lines.length; j++) {
      if (lines[j].startsWith('# ')) {
        h1LineIndex = j;
        break;
      }
    }

    if (h1LineIndex !== -1) {
      const rawH1 = lines[h1LineIndex].replace(/^#\s+/, '').trim();
      const idMatch = rawH1.match(/^(\d{4}(?:-\d+)?)\s*(.*)$/);
      let cleanH1 = rawH1;
      if (idMatch) {
        result.openingMatter.monoId = idMatch[1];
        cleanH1 = idMatch[2];
      }

      const creditMatch = cleanH1.match(/^(.*?)\s*(\([^)]+(?::|แปล|เรียบเรียง|บรรยาย|วิจัย)[^)]*\))$/);
      if (creditMatch) {
        result.openingMatter.h1Title = creditMatch[1].trim();
        result.openingMatter.creditByline = creditMatch[2].trim();
      } else {
        result.openingMatter.h1Title = cleanH1;
      }

      i = h1LineIndex + 1;
    }

    // 3. Find Body Start
    let bodyStartIndex = -1;
    for (let j = i; j < lines.length; j++) {
      const line = lines[j].trim();
      if (/^###\s+/.test(line) || /^####\s+/.test(line)) {
        bodyStartIndex = j;
        break;
      }
      if (/^\*\*[^*]+\*\*\s*:/.test(line)) {
        bodyStartIndex = j;
        break;
      }
    }

    if (bodyStartIndex === -1) {
      for (let j = i; j < lines.length; j++) {
        if (lines[j].trim() === '---') {
          bodyStartIndex = j + 1;
          break;
        }
      }
    }

    if (bodyStartIndex === -1) {
      bodyStartIndex = i;
    }

    // Opening blocks
    const openingLines = lines.slice(i, bodyStartIndex);
    const openingBlocks = [];
    let currentBlock = [];

    for (const line of openingLines) {
      if (line.trim() === '' || line.trim() === '---') {
        if (currentBlock.length > 0) {
          openingBlocks.push(currentBlock.join('\n').trim());
          currentBlock = [];
        }
      } else {
        currentBlock.push(line);
      }
    }
    if (currentBlock.length > 0) {
      openingBlocks.push(currentBlock.join('\n').trim());
    }

    // Check first or second block for Epigraph (blockquote)
    let epigraphBlockIndex = -1;
    for (let b = 0; b < Math.min(3, openingBlocks.length); b++) {
      if (openingBlocks[b].startsWith('>')) {
        epigraphBlockIndex = b;
        const epigraphRaw = openingBlocks[b].replace(/^>\s?/gm, '').trim();
        const attributionMatch = epigraphRaw.match(/^(.*?)\s*(\([^)]+\))$/s);
        if (attributionMatch) {
          result.openingMatter.epigraph = {
            quote: attributionMatch[1].trim(),
            attribution: attributionMatch[2].trim(),
          };
        } else {
          result.openingMatter.epigraph = {
            quote: epigraphRaw,
          };
        }
        break;
      }
    }

    for (let b = 0; b < openingBlocks.length; b++) {
      if (b === epigraphBlockIndex) continue;
      const block = openingBlocks[b];
      if (block.length <= 140 && !block.startsWith('#')) {
        result.openingMatter.provenanceLines.push(block);
      } else {
        result.openingMatter.introduction.push(block);
      }
    }

    // 4. Extract Back Matter
    const remainingLines = lines.slice(bodyStartIndex);
    let backMatterStartIndex = -1;

    for (let j = 0; j < remainingLines.length; j++) {
      const line = remainingLines[j].trim();
      if (/^(?:>|#+)?\s*(เชิงอรรถ|Footnotes|บรรณานุกรม|เอกสารอ้างอิง|หนังสืออ่านเพิ่มเติม|Bibliography|References)/i.test(line)) {
        backMatterStartIndex = j;
        break;
      }
      if (line === '---' && j < remainingLines.length - 1) {
        const nextLines = remainingLines.slice(j + 1, j + 5).join(' ');
        if (/เชิงอรรถ|บรรณานุกรม|เอกสารอ้างอิง|หนังสืออ่านเพิ่มเติม|Bibliography|References/i.test(nextLines)) {
          backMatterStartIndex = j;
          break;
        }
      }
    }

    let bodyLines = [];
    let backMatterLines = [];

    if (backMatterStartIndex !== -1) {
      bodyLines = remainingLines.slice(0, backMatterStartIndex);
      backMatterLines = remainingLines.slice(backMatterStartIndex);
    } else {
      bodyLines = remainingLines;
    }

    while (backMatterLines.length > 0 && (backMatterLines[backMatterLines.length - 1].trim() === '---' || backMatterLines[backMatterLines.length - 1].trim() === '')) {
      backMatterLines.pop();
    }
    while (bodyLines.length > 0 && (bodyLines[bodyLines.length - 1].trim() === '---' || bodyLines[bodyLines.length - 1].trim() === '')) {
      bodyLines.pop();
    }

    if (backMatterLines.length > 0) {
      result.backMatter.hasBackMatter = true;
      const backMatterText = backMatterLines.join('\n');

      const fnRegex = />?\s*\(([0-9]+)\)\s+(.+?)(?=(?:>?\s*\([0-9]+\)|$))/gs;
      let fnMatch;
      while ((fnMatch = fnRegex.exec(backMatterText)) !== null) {
        const fnNum = parseInt(fnMatch[1], 10);
        const fnText = fnMatch[2].replace(/^>\s?/gm, '').trim();
        result.backMatter.footnotes.push({ number: fnNum, text: fnText });
      }

      if (/บรรณานุกรม|เอกสารอ้างอิง|Bibliography|References/i.test(backMatterText)) {
        const bibLines = backMatterText
          .split('\n')
          .map((l) => l.replace(/^>\s?/, '').trim())
          .filter((l) => l.length > 15 && !/^(บรรณานุกรม|เอกสารอ้างอิง|Bibliography|References|#|---)/i.test(l));
        result.backMatter.bibliography = bibLines;
      }

      if (/หนังสืออ่านเพิ่มเติม|Further Reading/i.test(backMatterText)) {
        const readingLines = backMatterText
          .split('\n')
          .map((l) => l.replace(/^>\s?/, '').trim())
          .filter((l) => l.length > 15 && !/^(หนังสืออ่านเพิ่มเติม|Further Reading|#|---)/i.test(l));
        result.backMatter.furtherReading = readingLines;
      }
    }

    let processedBodyText = bodyLines.join('\n');

    const headingRegex = /^(#{3,4})\s+(.+)$/gm;
    let headingMatch;
    while ((headingMatch = headingRegex.exec(processedBodyText)) !== null) {
      const depth = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const slug = slugifyHeading(text);
      result.tableOfContents.push({ depth, text, slug });
    }

    if (result.backMatter.footnotes.length > 0) {
      const availableFootnotes = new Set(result.backMatter.footnotes.map((f) => f.number));
      processedBodyText = processedBodyText.replace(
        /(?<=[^\n])\s*\(([0-9]+)\)(?!\))/g,
        (match, numStr) => {
          const num = parseInt(numStr, 10);
          if (availableFootnotes.has(num)) {
            return ` <sup id="fnref-${num}"><a href="#fn-${num}" class="footnote-ref" data-fn="${num}">[${num}]</a></sup>`;
          }
          return match;
        }
      );
    }

    result.bodyMarkdown = processedBodyText;
  } catch (err) {
    result.isFellBack = true;
    result.bodyMarkdown = rawContent;
  }

  return result;
}

const cwd = process.cwd();
const sampleArticles = [
  {
    name: 'Transcript',
    id: '0002',
    path: path.join(cwd, 'md_archive', '01.RAW MD', '0000-0200', '0002 วิธีคิด.md'),
    assert: (zones) => {
      console.log(`[0002 Transcript] Title: "${zones.openingMatter.h1Title}", Provenance: ${zones.openingMatter.provenanceLines.length}`);
      if (!zones.bodyMarkdown.includes('**อ.สมเกียรติ**')) {
        throw new Error('0002 body should contain speaker turn for อ.สมเกียรติ');
      }
      return true;
    },
  },
  {
    name: 'Translation with Footnotes & Reading List',
    id: '0187',
    path: path.join(cwd, 'md_archive', '01.RAW MD', '0000-0200', '0187 ปรัชญาการรื้อสร้างของเดอริดา.md'),
    assert: (zones) => {
      console.log(`[0187 Translation] Title: "${zones.openingMatter.h1Title}", Credit: "${zones.openingMatter.creditByline}", Epigraph: ${Boolean(zones.openingMatter.epigraph)}`);
      if (!zones.openingMatter.epigraph) {
        throw new Error('0187 should detect epigraph blockquote');
      }
      if (!zones.backMatter.hasBackMatter) {
        throw new Error('0187 should detect back matter');
      }
      return true;
    },
  },
  {
    name: 'Multi-section Essay with Preface',
    id: '1146',
    path: path.join(cwd, 'md_archive', '01.RAW MD', '1001-1200', '1146 ความเป็นมาของทฤษฎีแบ่งแยกดินแดนในภาคใต้ไทย (1).md'),
    assert: (zones) => {
      console.log(`[1146 Essay] TOC items: ${zones.tableOfContents.length}, Footnotes detected: ${zones.backMatter.footnotes.length}`);
      if (zones.tableOfContents.length === 0) {
        throw new Error('1146 should have TOC entries');
      }
      if (zones.backMatter.footnotes.length === 0) {
        throw new Error('1146 should have parsed footnotes');
      }
      if (!zones.bodyMarkdown.includes('href="#fn-17"')) {
        throw new Error('1146 should have linked footnote (17) to #fn-17');
      }
      return true;
    },
  },
  {
    name: 'Article with Bibliography',
    id: '0410',
    path: path.join(cwd, 'md_archive', '01.RAW MD', '0401-0600', '0410 ระเบียบวิธีวิจัยการสื่อสารเพื่อสุขภาพ.md'),
    assert: (zones) => {
      console.log(`[0410 Bibliography] Bibliography items: ${zones.backMatter.bibliography.length}`);
      if (zones.backMatter.bibliography.length === 0) {
        throw new Error('0410 should detect bibliography entries');
      }
      return true;
    },
  },
];

console.log('--- Running Zone Detection Unit Tests on 4 Sample Articles ---');
let allPassed = true;

for (const sample of sampleArticles) {
  try {
    if (!fs.existsSync(sample.path)) {
      throw new Error(`File not found: ${sample.path}`);
    }
    const content = fs.readFileSync(sample.path, 'utf8');
    const zones = parseArticleZones(content, sample.id, path.basename(sample.path));
    sample.assert(zones);
    console.log(`✓ ${sample.name} (${sample.id}): PASSED\n`);
  } catch (err) {
    console.error(`✗ ${sample.name} (${sample.id}): FAILED:`, err.message);
    allPassed = false;
  }
}

if (!allPassed) {
  process.exit(1);
} else {
  console.log('ALL 4 SAMPLE ARTICLE ZONE TESTS PASSED CLEANLY!');
}
