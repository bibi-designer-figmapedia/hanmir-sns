// ig-content-maker B-1 — 게시물(캐러셀) 1건 = use_figma 1회. 맨 위 INPUT 블록만 채워서 use_figma 에 넣는다.
// 하는 일: 📥 Output 페이지에 한 줄(auto layout) 만들고, 장 순서대로 인스턴스 → txt-* 채움 → 액센트를 브랜드 컬러로 치환 → 스크린샷.

// ───────── INPUT (여기만 채운다) ─────────
const ROW_NAME = '[1회차] {제목} ({장수}장)';
const FONTS    = ['Inter/Regular', 'Inter/Semi Bold', 'Inter/Bold'];      // B-0 결과의 fonts 전부 (family/style)
const ACCENT   = '#007635';                                              // B-0 결과의 accent
const CORE     = null;                                                   // BRAND.md 1 브랜드 컬러 hex, 없으면 null
const BRAND    = '{BRAND.md 1 브랜드명}';                                 // txt-brand 레이어에 들어간다
const SLIDES   = [                                                       // 기획서 슬라이드 표 순서대로 (Cover → Body… → Ending)
  // { templateId: 'B-0의 id', text: { headline: '…', body: '…', cta: '…', option: 'A | B', caption: '… | …' } }
  // '—' 칸과 템플릿에 없는 레이어는 빼도 되고 두어도 된다(건너뛴다). 같은 칸이 여러 개인 템플릿(-2, -3)은 ' | '로 나눠 쓴다.
];
// ────────────────────────────────────────

let out = figma.root.children.find(p => p.name === '📥 Output');
if (!out) { out = figma.createPage(); out.name = '📥 Output'; }
await figma.setCurrentPageAsync(out);                                  // 호출당 1회만
for (const f of FONTS) await figma.loadFontAsync({ family: f.split('/')[0], style: f.split('/')[1] });

const right = Math.max(0, ...out.children.map(n => n.x + n.width));
const row = figma.createAutoLayout('HORIZONTAL', { name: ROW_NAME, itemSpacing: 40 });
row.x = right + 200; row.y = 0;
out.appendChild(row);

// ── 색 치환 도구 ──
const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const rgb = h => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const swap = ps => ps.map(p => (p.type === 'SOLID' && hex(p.color) === ACCENT) ? { ...p, color: rgb(CORE) } : p);
const recolor = inst => {
  if (!CORE || CORE.toUpperCase() === ACCENT) return 0;
  let n = 0;
  for (const node of inst.findAll()) {
    if (node.type === 'TEXT' && node.fills === figma.mixed) {
      for (const s of node.getStyledTextSegments(['fills'])) { const f = swap(s.fills); if (f !== s.fills) { node.setRangeFills(s.start, s.end, f); n++; } }
      continue;
    }
    if (Array.isArray(node.fills) && node.fills.some(p => p.type === 'SOLID' && hex(p.color) === ACCENT)) { node.fills = swap(node.fills); n++; }
    if (Array.isArray(node.strokes) && node.strokes.some(p => p.type === 'SOLID' && hex(p.color) === ACCENT)) { node.strokes = swap(node.strokes); n++; }
  }
  const c = rgb(CORE);                                                  // 밝은 브랜드 컬러면 그 위 흰 글자를 검정으로
  if (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b > 0.6)
    for (const t of inst.findAll(x => x.type === 'TEXT' && Array.isArray(x.fills) && x.fills.some(p => p.type === 'SOLID' && hex(p.color) === '#FFFFFF')))
      if (Array.isArray(t.parent?.fills) && t.parent.fills.some(p => p.type === 'SOLID' && hex(p.color) === CORE.toUpperCase())) t.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
  return n;
};

// ── 텍스트 넣기: 칸 하나 = 레이어 txt-{칸}, txt-{칸}-2, txt-{칸}-3 … (값은 ' | '로 나눔) ──
const put = (inst, key, value) => {
  if (value == null || value === '' || value === '—') return;
  const layers = inst.findAll(n => n.type === 'TEXT' && (n.name === 'txt-' + key || n.name.startsWith('txt-' + key + '-')))
                     .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const values = String(value).split(' | ');
  layers.forEach((t, i) => {
    const chars = values[i]; if (chars == null) return;
    const segs = t.fills === figma.mixed ? t.getStyledTextSegments(['fills']) : null;   // 두 줄 색 기억
    t.characters = chars;                                                                 // characters를 바꾸면 첫 글자 색으로 통일된다
    if (segs && segs.length > 1 && chars.includes('\n')) {                                // 둘째 줄에 원래 색(액센트) 복원
      const j = chars.indexOf('\n') + 1;
      t.setRangeFills(0, j, segs[0].fills); t.setRangeFills(j, chars.length, segs[segs.length - 1].fills);
    }
  });
};

const result = [];
for (const s of SLIDES) {
  const comp = await figma.getNodeByIdAsync(s.templateId);
  const inst = comp.createInstance();
  row.appendChild(inst);
  for (const [k, v] of Object.entries(s.text || {})) put(inst, k, v);
  put(inst, 'brand', BRAND);
  result.push({ instanceId: inst.id, swapped: recolor(inst) });         // 텍스트 넣은 뒤에 색 치환
}
await row.screenshot();
return { createdNodeIds: [row.id, ...result.map(r => r.instanceId)], rowId: row.id, swapped: result.map(r => r.swapped) };
