import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const expectedRepos = [
  'a-i-chat--exporter',
  'card-trade-social',
  'classroom-rpg-aetheria',
  'fetch-familiar-friends',
  'hokage-chess',
  'life-my--midst--in',
  'multi-camera--livestream--framework',
  'my--father-mother',
  'my-block-warfare',
  'peer-audited--behavioral-blockchain',
  'search-local--happy-hour',
  'sovereign-ecosystem--real-estate-luxury',
  'tab-bookmark-manager',
  'the-actual-news',
  'trade-perpetual-future',
  'universal-mail--automation',
  'your-fit-tailored',
];

function extractTag(name) {
  const match = html.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'));
  assert.ok(match, `Expected <${name}> to exist`);
  return match[1];
}

function extractElements(tagName, className) {
  const pattern = new RegExp(
    `<${tagName}\\b([^>]*)class="[^"]*\\b${className}\\b[^"]*"([^>]*)>([\\s\\S]*?)<\\/${tagName}>`,
    'gi',
  );
  return [...html.matchAll(pattern)].map((match) => ({
    attrs: `${match[1]} ${match[2]}`,
    body: match[3],
  }));
}

function getAttr(attrs, name) {
  const match = attrs.match(new RegExp(`\\b${name}="([^"]*)"`));
  assert.ok(match, `Expected ${name} attribute in ${attrs}`);
  return match[1];
}

function textOf(fragment) {
  return fragment
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&middot;/g, '·')
    .replace(/\s+/g, ' ')
    .trim();
}

function repoName(cardBody) {
  const match = cardBody.match(/<div class="repo-name">([^<]+)<\/div>/);
  assert.ok(match, 'Expected repo card to include a repo-name');
  return match[1].trim();
}

test('publishes Ergon metadata for the GitHub Pages landing page', () => {
  assert.match(html, /^<!DOCTYPE html>/i);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1\.0">/);
  assert.match(html, /<title>ORGAN-III: Ergon — Commerce &amp; Products<\/title>/);
  assert.match(
    html,
    /<meta name="description" content="ORGAN-III: Ergon — Commerce &amp; Products — part of the ORGANVM eight-organ system">/,
  );

  assert.equal(
    textOf(extractTag('header')),
    'ORGAN-III: Ergon — Commerce & Products Part of the ORGANVM eight-organ system',
  );
});

test('marks only the Ergon organ as active in the ecosystem navigation', () => {
  const nav = extractTag('nav');
  const organLinks = [...nav.matchAll(/<a\b([^>]*)>([^<]+)<\/a>/g)]
    .filter((match) => /^[IVX]+ · /.test(textOf(match[2])))
    .map((match) => ({
      attrs: match[1],
      label: textOf(match[2]),
      href: getAttr(match[1], 'href'),
      isActive: /\bclass="[^"]*\bactive\b/.test(match[1]),
    }));

  assert.deepEqual(
    organLinks.map((link) => link.label),
    [
      'I · Theoria',
      'II · Poiesis',
      'III · Ergon',
      'IV · Taxis',
      'V · Logos',
      'VI · Koinonia',
      'VII · Kerygma',
    ],
  );

  assert.deepEqual(
    organLinks.filter((link) => link.isActive).map((link) => [link.label, link.href]),
    [['III · Ergon', 'https://organvm-iii-ergon.github.io/']],
  );
});

test('keeps the published repository count synchronized with the cards', () => {
  const cards = extractElements('a', 'repo-card');
  const count = html.match(/<p class="count">(\d+) repository cards<\/p>/);

  assert.ok(count, 'Expected visible repository count');
  assert.equal(Number(count[1]), expectedRepos.length);
  assert.equal(cards.length, expectedRepos.length);
});

test('lists the expected Ergon repositories with stable GitHub links', () => {
  const cards = extractElements('a', 'repo-card');
  const repos = cards.map((card) => repoName(card.body));

  assert.deepEqual(repos, expectedRepos);

  for (const card of cards) {
    const name = repoName(card.body);
    assert.equal(getAttr(card.attrs, 'href'), `https://github.com/organvm-iii-ergon/${name}`);
    assert.equal(getAttr(card.attrs, 'target'), '_blank');
    assert.equal(getAttr(card.attrs, 'rel'), 'noopener');
    assert.match(card.body, /<span class="tag">GitHub Pages<\/span>/);
  }
});

test('surfaces hub links for the broader ORGANVM system', () => {
  const expectedHubLinks = new Map([
    ['Portfolio', 'https://4444j99.github.io/portfolio/'],
    ['System Directory', 'https://4444j99.github.io/portfolio/directory/'],
    ['Knowledge Base', 'https://organvm-i-theoria.github.io/my-knowledge-base/'],
    ['Essays', 'https://organvm-v-logos.github.io/public-process/'],
  ]);

  for (const [label, href] of expectedHubLinks) {
    assert.match(
      html,
      new RegExp(`<a href="${href}" class="hub-link">${label} <span class="hub-arrow">↗<\\/span><\\/a>`),
    );
  }
});
