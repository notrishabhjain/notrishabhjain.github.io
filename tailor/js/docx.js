// Minimal, dependency-free DOCX writer and reader.
// Output is deliberately plain for applicant tracking systems: one column, real paragraphs and list
// bullets, standard headings, contact details in the body. No tables, text boxes, images, headers or footers.

import { glue } from './grammar.js';

const enc = new TextEncoder();

// ---- zip (stored, no compression) ------------------------------------------------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(d) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

export function zip(files, when = new Date()) {
  const { time, date } = dosDateTime(when);
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const [name, content] of files) {
    const nameB = enc.encode(name);
    const data = typeof content === 'string' ? enc.encode(content) : content;
    const crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true);
    h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nameB.length, true); h.setUint16(28, 0, true);
    chunks.push(new Uint8Array(h.buffer), nameB, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint16(10, 0, true); c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true);
    c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, nameB.length, true);
    c.setUint16(30, 0, true); c.setUint16(32, 0, true); c.setUint16(34, 0, true); c.setUint16(36, 0, true);
    c.setUint32(38, 0, true); c.setUint32(42, offset, true);
    central.push(new Uint8Array(c.buffer), nameB);
    offset += 30 + nameB.length + data.length;
  }
  const cdSize = central.reduce((a, b) => a + b.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
  e.setUint32(12, cdSize, true); e.setUint32(16, offset, true);
  const all = [...chunks, ...central, new Uint8Array(e.buffer)];
  const out = new Uint8Array(all.reduce((a, b) => a + b.length, 0));
  let p = 0;
  for (const a of all) { out.set(a, p); p += a.length; }
  return out;
}

/** Read entries from a zip written with stored entries (what zip() produces). */
export function unzipStored(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const out = new Map();
  let p = 0;
  const dec = new TextDecoder();
  while (p + 30 <= bytes.length && dv.getUint32(p, true) === 0x04034b50) {
    const method = dv.getUint16(p + 8, true);
    const size = dv.getUint32(p + 18, true);
    const nlen = dv.getUint16(p + 26, true), xlen = dv.getUint16(p + 28, true);
    const name = dec.decode(bytes.subarray(p + 30, p + 30 + nlen));
    const start = p + 30 + nlen + xlen;
    if (method !== 0) throw new Error('compressed entries are not supported by this reader');
    out.set(name, bytes.subarray(start, start + size));
    p = start + size;
  }
  return out;
}

// ---- document -------------------------------------------------------------------

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const esc = (s) => glue(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function run(text, { b, i, sz, color } = {}) {
  const pr = [b ? '<w:b/>' : '', i ? '<w:i/>' : '', color ? `<w:color w:val="${color}"/>` : '', sz ? `<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>` : ''].join('');
  return `<w:r>${pr ? `<w:rPr>${pr}</w:rPr>` : ''}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
}

function para(style, runs, extra = '') {
  return `<w:p><w:pPr><w:pStyle w:val="${style}"/>${extra}</w:pPr>${runs}</w:p>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="${W}">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="252" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Name"><w:name w:val="Name"/><w:basedOn w:val="Normal"/><w:qFormat/><w:rPr><w:b/><w:sz w:val="34"/><w:szCs w:val="34"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Headline"><w:name w:val="Headline"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="20"/></w:pPr><w:rPr><w:sz w:val="21"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Contact"><w:name w:val="Contact"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="40"/></w:pPr><w:rPr><w:sz w:val="19"/><w:color w:val="333333"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="60"/><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="888888"/></w:pBdr><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:caps/><w:spacing w:val="10"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="RoleTitle"><w:name w:val="Role Title"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="140"/></w:pPr><w:rPr><w:b/><w:sz w:val="21"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="RoleMeta"><w:name w:val="Role Meta"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:after="40"/></w:pPr><w:rPr><w:color w:val="333333"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListBullet"><w:name w:val="List Bullet"/><w:basedOn w:val="Normal"/><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:spacing w:after="30"/><w:ind w:left="300" w:hanging="200"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Body"><w:name w:val="Body"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="40"/></w:pPr></w:style>
</w:styles>`;

const NUMBERING = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="${W}"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="300" w:hanging="200"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;

export const HEADINGS = ['Professional Summary', 'Core Competencies', 'Professional Experience', 'Education', 'Certifications'];

/** Build the .docx bytes for a composed resume. */
export function buildDocx(r, when = new Date()) {
  const p = r.person;
  const body = [];
  body.push(para('Name', run(p.name)));
  body.push(para('Headline', run(r.headline)));
  body.push(para('Contact', run([p.location, p.email, p.phone, p.linkedin, p.website].filter(Boolean).join(' | '))));
  body.push(para('Heading1', run(HEADINGS[0])));
  body.push(para('Body', run(r.summary)));
  body.push(para('Heading1', run(HEADINGS[1])));
  for (const g of r.skills) body.push(para('Body', run(g.label + ': ', { b: true }) + run(g.items.map(i => i.label).join(', '))));
  body.push(para('Heading1', run(HEADINGS[2])));
  for (const role of r.roles) {
    if (!role.bullets.length) continue;
    body.push(para('RoleTitle', run(role.title)));
    body.push(para('RoleMeta', run([role.company, role.location, role.dates].filter(Boolean).join(' | ')) +
      (role.client ? run(' | Client: ' + role.client, { i: true }) : '')));
    for (const b of role.bullets) body.push(para('ListBullet', run(b.text)));
  }
  body.push(para('Heading1', run(HEADINGS[3])));
  for (const e of r.education) body.push(para('Body', run(e.degree, { b: true }) + run(`, ${e.school}, ${e.year}`)));
  body.push(para('Heading1', run(HEADINGS[4])));
  for (const c of r.certifications) body.push(para('Body', run(c.name) + run(`, ${c.issuer}`, { color: '333333' })));

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W}"><w:body>${body.join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="820" w:right="900" w:bottom="820" w:left="900" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const iso = when.toISOString().replace(/\.\d+Z$/, 'Z');
  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(p.name)} Resume</dc:title><dc:creator>${esc(p.name)}</dc:creator><cp:lastModifiedBy>${esc(p.name)}</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${iso}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${iso}</dcterms:modified></cp:coreProperties>`;
  const app = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Tailor</Application></Properties>`;
  const types = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;
  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>`;
  return zip([
    ['[Content_Types].xml', types],
    ['_rels/.rels', rels],
    ['word/document.xml', document],
    ['word/_rels/document.xml.rels', docRels],
    ['word/styles.xml', STYLES],
    ['word/numbering.xml', NUMBERING],
    ['docProps/core.xml', core],
    ['docProps/app.xml', app]
  ], when);
}

/** Plain text of a .docx produced by buildDocx, paragraph per line, the way a parser would read it. */
export function docxText(bytes) {
  const files = unzipStored(bytes);
  const xml = new TextDecoder().decode(files.get('word/document.xml'));
  const unesc = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  const paras = xml.split('</w:p>').map(chunk => {
    let t = '';
    chunk.replace(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>/g, (m, txt) => { t += txt != null ? unesc(txt) : '\t'; return m; });
    const isBullet = /<w:pStyle w:val="ListBullet"\/>/.test(chunk);
    return t ? (isBullet ? '• ' + t : t) : null;
  }).filter(x => x != null);
  return { text: paras.join('\n'), xml, files: [...files.keys()] };
}
