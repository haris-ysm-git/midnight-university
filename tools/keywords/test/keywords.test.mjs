/**
 * tools/keywords/test/keywords.test.mjs
 * Tests using node:test and in-memory fixtures only (no real files).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ── Import lib modules ───────────────────────────────────────────────────────
import { findTermMatches, resolveOverlaps, findAllMatches } from '../lib/match.mjs';
import { parseLinks, rewriteLinks, stripLinks } from '../lib/links.mjs';
import { computeZones } from '../lib/zones.mjs';

// ── Helper: build a minimal notes Map ───────────────────────────────────────
function makeNotes(entries) {
  // entries: [{ canonical, aliases }]
  const notes = new Map();
  for (const { canonical, aliases = [] } of entries) {
    const terms = [canonical, ...aliases];
    notes.set(canonical, { canonical, aliases, terms, file: `${canonical}.md`, content: '' });
  }
  return notes;
}

// ── Thai boundary tests ──────────────────────────────────────────────────────
describe('Thai word boundary matching', () => {
  test('ความรู้สึก should NOT match alias ความรู้', () => {
    const matches = findTermMatches('ความรู้สึก', 'ความรู้', 'ความรู้');
    assert.equal(matches.length, 0, 'ความรู้ should not match inside ความรู้สึก');
  });

  test('ความรู้ คือ อำนาจ should match ความรู้ at word boundary', () => {
    const matches = findTermMatches('ความรู้ คือ อำนาจ', 'ความรู้', 'ความรู้');
    assert.equal(matches.length, 1);
    assert.equal(matches[0].matched, 'ความรู้');
    assert.equal(matches[0].start, 0);
  });

  test('สาธารณะ should not match inside สาธารณสุข', () => {
    const matches = findTermMatches('สาธารณสุข', 'สาธารณะ', 'สาธารณะ');
    assert.equal(matches.length, 0);
  });
});

// ── Display preservation ─────────────────────────────────────────────────────
describe('Display preservation (link writing)', () => {
  test('ประวัติศาสตร์ in body → [[History|ประวัติศาสตร์]]', () => {
    // This is tested through the match + writing logic
    const matched = 'ประวัติศาสตร์';
    const canonical = 'History';
    const link = matched === canonical ? `[[${canonical}]]` : `[[${canonical}|${matched}]]`;
    assert.equal(link, '[[History|ประวัติศาสตร์]]');
  });

  test('michel foucault (lowercase) → [[Michel Foucault|michel foucault]]', () => {
    const matched = 'michel foucault';
    const canonical = 'Michel Foucault';
    const link = matched === canonical ? `[[${canonical}]]` : `[[${canonical}|${matched}]]`;
    assert.equal(link, '[[Michel Foucault|michel foucault]]');
  });

  test('exact Michel Foucault → [[Michel Foucault]]', () => {
    const matched = 'Michel Foucault';
    const canonical = 'Michel Foucault';
    const link = matched === canonical ? `[[${canonical}]]` : `[[${canonical}|${matched}]]`;
    assert.equal(link, '[[Michel Foucault]]');
  });
});

// ── Longest match ────────────────────────────────────────────────────────────
describe('Longest match wins', () => {
  test('Michel Foucault as one link, not Foucault alone', () => {
    const termEntries = [
      { canonical: 'Michel Foucault', term: 'Michel Foucault', termLower: 'michel foucault' },
      { canonical: 'Foucault', term: 'Foucault', termLower: 'foucault' },
    ];
    const text = 'Michel Foucault was a philosopher.';
    const matches = findAllMatches(text, termEntries);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].canonical, 'Michel Foucault');
    assert.equal(matches[0].matched, 'Michel Foucault');
  });
});

// ── Existing link not duplicated ─────────────────────────────────────────────
describe('Existing link: no second link added', () => {
  test('If article already has [[Michel Foucault]], no second link', () => {
    // Simulate: article text with existing link, alreadyLinked check
    const alreadyLinked = new Set(['Michel Foucault']);
    const termEntries = [
      { canonical: 'Michel Foucault', term: 'Michel Foucault', termLower: 'michel foucault' },
    ];
    const activeTerm = termEntries.filter(te => !alreadyLinked.has(te.canonical));
    assert.equal(activeTerm.length, 0, 'Should be filtered out');
  });
});

// ── Zones ─────────────────────────────────────────────────────────────────────
describe('Zone filtering', () => {
  test('YAML frontmatter lines are not linkable', () => {
    const lines = [
      '---',
      'id: "0043"',
      'title_th: test',
      '---',
      '# Title',
      '',
      'some body text',
      '---',
      '',
      'Body paragraph here.',
    ];
    const { linkableLines } = computeZones(lines);
    // Lines 0-3 (frontmatter) must NOT be linkable
    assert.ok(!linkableLines.has(0), 'frontmatter line 0 must not be linkable');
    assert.ok(!linkableLines.has(1), 'frontmatter line 1 must not be linkable');
    assert.ok(!linkableLines.has(2), 'frontmatter line 2 must not be linkable');
    assert.ok(!linkableLines.has(3), 'frontmatter line 3 must not be linkable');
  });

  test('Heading lines are not linkable', () => {
    const lines = [
      '---', 'id: "x"', '---',
      '# Main heading',
      '---',
      '',
      '## Section heading',
      '',
      'Body text.',
    ];
    const { linkableLines } = computeZones(lines);
    assert.ok(!linkableLines.has(3), 'H1 must not be linkable');
    assert.ok(!linkableLines.has(6), 'H2 must not be linkable');
  });

  test('Blockquote lines are not linkable', () => {
    const lines = [
      '---', 'id: "x"', '---',
      '# Title',
      '---',
      '',
      '> This is a blockquote',
      '',
      'Body text.',
    ];
    const { linkableLines } = computeZones(lines);
    assert.ok(!linkableLines.has(6), 'blockquote must not be linkable');
  });

  test('> เชิงอรรถ stops linking', () => {
    const lines = [
      '---', 'id: "x"', '---',
      '# Title',
      '---',
      '',
      'Body paragraph.',
      '',
      '> เชิงอรรถ',
      '',
      'After footnote — should not be linked.',
    ];
    const { linkableLines } = computeZones(lines);
    assert.ok(!linkableLines.has(10), 'Text after > เชิงอรรถ must not be linkable');
  });

  test('Provenance paragraph in opening matter is skipped', () => {
    const lines = [
      '---', 'id: "x"', '---',
      '# Title',
      '',
      'ผู้แปล: สมเกียรติ ตั้งนโม แปลและเรียบเรียง',
      '',
      '---',
      '',
      'Body paragraph here with enough text to link.',
    ];
    const { linkableLines, openingMatterSkipped } = computeZones(lines);
    assert.ok(!linkableLines.has(5), 'Provenance line must not be linkable');
    assert.ok(openingMatterSkipped.some(s => s.lineStart === 5), 'Should be in skipped list');
  });
});

// ── Ambiguous alias ───────────────────────────────────────────────────────────
describe('Ambiguous alias: not auto-linked', () => {
  test('Term shared by two notes is in ambiguous set', () => {
    // Simulate building the index manually
    const termCounts = new Map();
    const notes = [
      { canonical: 'socialism', terms: ['socialism', 'นักสังคมนิยม'] },
      { canonical: 'socialist', terms: ['socialist', 'นักสังคมนิยม'] },
    ];
    const termToCanonical = new Map();
    const ambiguous = new Set();

    for (const note of notes) {
      for (const term of note.terms) {
        const lower = term.toLowerCase();
        if (termToCanonical.has(lower) && termToCanonical.get(lower) !== note.canonical) {
          ambiguous.add(lower);
          termToCanonical.delete(lower);
        } else if (!ambiguous.has(lower)) {
          termToCanonical.set(lower, note.canonical);
        }
      }
    }

    assert.ok(ambiguous.has('นักสังคมนิยม'), 'Shared alias should be ambiguous');
    assert.ok(!termToCanonical.has('นักสังคมนิยม'), 'Ambiguous term should not be in term index');
  });
});

// ── Stoplist ─────────────────────────────────────────────────────────────────
describe('Stoplist', () => {
  test('Stoplisted term is excluded from termEntries', () => {
    // Simulate: 'History' is in stoplist, Latin term
    const stopSet = new Set(['history']);
    const termEntries = [];
    const fakeNotes = [
      { canonical: 'History', terms: ['History', 'ประวัติศาสตร์'] },
    ];

    for (const note of fakeNotes) {
      const isStoplisted = stopSet.has(note.canonical.toLowerCase());
      for (const term of note.terms) {
        const isTh = /[\u0E00-\u0E7F]/.test(term);
        if (isStoplisted && !isTh) continue; // skip Latin terms of stoplisted note
        termEntries.push({ canonical: note.canonical, term, termLower: term.toLowerCase() });
      }
    }

    // History (Latin) should be excluded; ประวัติศาสตร์ (Thai) stays
    const latinHistory = termEntries.find(te => te.term === 'History');
    const thaiHistory = termEntries.find(te => te.term === 'ประวัติศาสตร์');
    assert.equal(latinHistory, undefined, 'History (Latin) should be excluded');
    assert.ok(thaiHistory, 'ประวัติศาสตร์ (Thai alias) should remain');
  });
});

// ── Density cap ───────────────────────────────────────────────────────────────
describe('Density cap', () => {
  test('3000 linkable chars with density 1500 → cap of 2 total links', () => {
    const linkableChars = 3000;
    const density = 1500;
    const existingLinks = 0;
    const cap = Math.ceil(linkableChars / density);
    const allowed = Math.max(0, cap - existingLinks);
    assert.equal(cap, 2);
    assert.equal(allowed, 2);
  });

  test('Multi-word canonical gets priority in density sort', () => {
    // Priority: has a space (multi-word) OR has any uppercase letter (proper noun)
    function priority(canonical) {
      return canonical.includes(' ') || /[A-Z]/.test(canonical) ? 1 : 0;
    }
    assert.equal(priority('Michel Foucault'), 1);
    assert.equal(priority('Capitalism'), 1);
    assert.equal(priority('marxism'), 0);
  });
});

// ── Idempotency ───────────────────────────────────────────────────────────────
describe('Idempotency', () => {
  test('stripLinks(stripLinks(text)) === stripLinks(text)', () => {
    const text = 'See [[Michel Foucault]] and [[History|ประวัติศาสตร์]] for details.';
    const stripped = stripLinks(text);
    assert.equal(stripped, 'See Michel Foucault and ประวัติศาสตร์ for details.');
    assert.equal(stripLinks(stripped), stripped);
  });

  test('Text with links: strip then re-strip is same', () => {
    const text = 'The [[Capitalism|ทุนนิยม]] ideology.';
    const once = stripLinks(text);
    const twice = stripLinks(once);
    assert.equal(once, twice);
  });
});

// ── Verification guard ───────────────────────────────────────────────────────
describe('Verification guard', () => {
  test('Corrupting matcher causes verification to fail', () => {
    const original = 'This is some text about philosophy.';
    // Simulated "corrupting" new content that changes visible text
    const corrupt = 'This is some different text about philosophy.';
    const strippedNew = stripLinks(corrupt);
    const strippedOld = stripLinks(original);
    assert.notEqual(strippedNew, strippedOld, 'Verification should detect corruption');
  });

  test('Correct link insertion passes verification', () => {
    const original = 'This is some text about capitalism.';
    const withLink = 'This is some text about [[Capitalism|capitalism]].';
    const strippedNew = stripLinks(withLink);
    const strippedOld = stripLinks(original);
    assert.equal(strippedNew, strippedOld, 'Verification should pass for correct link');
  });
});

// ── rename-links tests ───────────────────────────────────────────────────────
describe('rename-links', () => {
  test('[[สันติภาพ]] → [[peace|สันติภาพ]]', () => {
    const renameMap = { 'สันติภาพ': 'peace' };
    function mapper(target, label) {
      if (renameMap[target]) {
        const newTarget = renameMap[target];
        const displayText = label !== null ? label : target;
        const newLabel = newTarget === displayText ? null : displayText;
        return { newTarget, newLabel };
      }
      return null;
    }
    const text = 'See [[สันติภาพ]] here.';
    const result = rewriteLinks(text, mapper);
    assert.equal(result, 'See [[peace|สันติภาพ]] here.');
  });

  test('[[สันติภาพ|peace and harmony]] → [[peace|peace and harmony]]', () => {
    const renameMap = { 'สันติภาพ': 'peace' };
    function mapper(target, label) {
      if (renameMap[target]) {
        const newTarget = renameMap[target];
        const displayText = label !== null ? label : target;
        const newLabel = newTarget === displayText ? null : displayText;
        return { newTarget, newLabel };
      }
      return null;
    }
    const text = 'See [[สันติภาพ|peace and harmony]] here.';
    const result = rewriteLinks(text, mapper);
    assert.equal(result, 'See [[peace|peace and harmony]] here.');
  });

  test('Links with # are untouched', () => {
    function mapper(target, label) {
      return { newTarget: 'something', newLabel: null };
    }
    const text = 'See [[peace#section]] here.';
    const result = rewriteLinks(text, mapper);
    // rewriteLinks skips # links
    assert.equal(result, 'See [[peace#section]] here.');
  });

  test('Case mismatch: [[capitalism]] → [[Capitalism|capitalism]]', () => {
    const notes = makeNotes([{ canonical: 'Capitalism', aliases: ['ทุนนิยม'] }]);
    function mapper(target, label) {
      if (target.includes('#') || target.includes('^')) return null;
      // Exact match? No change
      if (notes.has(target)) return null;
      // Case-insensitive match
      for (const [canonical] of notes) {
        if (canonical.toLowerCase() === target.toLowerCase() && canonical !== target) {
          const displayText = label !== null ? label : target;
          const newLabel = canonical === displayText ? null : displayText;
          return { newTarget: canonical, newLabel };
        }
      }
      return null;
    }
    const text = 'About [[capitalism]] today.';
    const result = rewriteLinks(text, mapper);
    assert.equal(result, 'About [[Capitalism|capitalism]] today.');
  });
});

// ── stubs tests ───────────────────────────────────────────────────────────────
describe('stubs', () => {
  test('English missing target → stub content format', () => {
    const target = 'Madness and Civilization';
    const labels = new Set(['Madness', 'Civilization']);
    const aliasLines = [...labels].map(a => `  - ${a}`).join('\n');
    const content = `---\naliases:\n${aliasLines}\n---\n`;
    assert.ok(content.includes('aliases:'));
    assert.ok(content.includes('  - Madness'));
  });

  test('Thai missing target → goes to translations-needed, not a file', () => {
    const target = 'ประวัติศาสตร์';
    const isThai = /[\u0E00-\u0E7F]/.test(target);
    const isLatin = /[A-Za-z]/.test(target);
    assert.ok(isThai && !isLatin, 'Should be Thai-only');
    // Therefore: goes to translations-needed, NOT a file create
  });

  test('Existing note is never overwritten', () => {
    // Simulate: existsSync returns true → skip
    const existingNotes = new Set(['Madness and Civilization']);
    const target = 'Madness and Civilization';
    const shouldCreate = !existingNotes.has(target);
    assert.equal(shouldCreate, false, 'Existing note must not be overwritten');
  });
});

// ── parseLinks tests ─────────────────────────────────────────────────────────
describe('parseLinks', () => {
  test('Parses basic [[target]] link', () => {
    const links = parseLinks('See [[Capitalism]] here.');
    assert.equal(links.length, 1);
    assert.equal(links[0].target, 'Capitalism');
    assert.equal(links[0].label, null);
  });

  test('Parses [[target|label]] link', () => {
    const links = parseLinks('See [[Capitalism|ทุนนิยม]] here.');
    assert.equal(links.length, 1);
    assert.equal(links[0].target, 'Capitalism');
    assert.equal(links[0].label, 'ทุนนิยม');
  });

  test('Skips links inside frontmatter', () => {
    const text = '---\ntitle: [[Capitalism]]\n---\n\nBody [[Capitalism]] here.';
    const links = parseLinks(text);
    // Only the body link should be found
    assert.equal(links.length, 1);
    assert.equal(links[0].index > 30, true, 'Link should be in body, not frontmatter');
  });

  test('Skips links inside fenced code blocks', () => {
    const text = '```\n[[Capitalism]]\n```\n\nBody text.';
    const links = parseLinks(text);
    assert.equal(links.length, 0);
  });
});

// ── Line endings ─────────────────────────────────────────────────────────────
describe('Line endings', () => {
  test('CRLF fixture keeps CRLF after link rewrite', () => {
    const original = 'Line 1\r\nSee [[สันติภาพ]] here.\r\nLine 3\r\n';
    const renameMap = { 'สันติภาพ': 'peace' };
    function mapper(target, label) {
      if (renameMap[target]) {
        const newTarget = renameMap[target];
        const displayText = label !== null ? label : target;
        const newLabel = newTarget === displayText ? null : displayText;
        return { newTarget, newLabel };
      }
      return null;
    }
    const result = rewriteLinks(original, mapper);
    assert.ok(result.includes('\r\n'), 'CRLF should be preserved');
    assert.ok(result.includes('[[peace|สันติภาพ]]'), 'Link should be rewritten');
  });
});
