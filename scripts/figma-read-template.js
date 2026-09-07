// ig-content-maker B-0 — 템플릿 읽기 (read-only). 이 파일 내용을 그대로 use_figma 에 넣는다.
// 돌려주는 것: templates[] { name, id, role(Cover/Body/Ending), text[], sizes, twoTone[], images, fonts, imageSuffix } + accent(액센트 hex)

const set = figma.root.findOne(n => n.type === 'COMPONENT_SET');
const comps = set ? set.children.filter(n => n.type === 'COMPONENT')
                  : figma.root.findAll(n => n.type === 'COMPONENT' && /cover|body|ending|post|template/i.test(n.name));

// 한 노드의 단색 페인트 전부 (줄마다 색이 다른 텍스트 = figma.mixed 포함)
const paints = n => {
  const ps = [];
  if (n.type === 'TEXT' && n.fills === figma.mixed) { for (const s of n.getStyledTextSegments(['fills'])) ps.push(...s.fills); }
  else if (Array.isArray(n.fills)) ps.push(...n.fills);
  if (Array.isArray(n.strokes)) ps.push(...n.strokes);
  return ps.filter(p => p.type === 'SOLID' && p.visible !== false);
};
const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const lum = n => { const f = paints(n)[0]; if (!f) return 0.5; const { r, g, b } = f.color; return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const sat = c => { const m = Math.max(c.r, c.g, c.b), n = Math.min(c.r, c.g, c.b); return m ? (m - n) / m : 0; };

// 액센트 = 템플릿 전체에서 가장 많이 쓰인 "채도 있는" 단색 (검정·흰색·회색 제외)
const count = {};
for (const c of comps) for (const n of [c, ...c.findAll()]) for (const p of paints(n)) if (sat(p.color) > 0.3) { const h = hex(p.color); count[h] = (count[h] || 0) + 1; }
const accent = Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

const templates = comps.map(c => {
  const H = c.height;
  const texts = c.findAll(n => n.type === 'TEXT' && n.name.startsWith('txt-')).map(t => {
    const top = (t.absoluteTransform[1][2] - c.absoluteTransform[1][2]) / H;   // 0=위, 1=아래
    return { name: t.name, size: t.fontSize, lum: lum(t), top, font: t.fontName.family + '/' + t.fontName.style, twoTone: t.fills === figma.mixed };
  });
  const light = texts.length && texts.reduce((a, t) => a + t.lum, 0) / texts.length > 0.6;
  const tops = texts.map(t => t.top);
  const hasTop = tops.some(v => v < 0.4), hasBottom = tops.some(v => v > 0.7);
  const bigTwo = texts.length <= 3 && texts.filter(t => t.size >= 80).length >= 2;

  // 역할: 배리언트 이름 우선 (cover / body / ending — 썸네일·본문·엔딩도 인식), 없으면 구조로 추정
  const nm = c.name.toLowerCase();
  const role = /cover|thumb|썸네일|표지/.test(nm) ? 'Cover'
             : /end|엔딩/.test(nm) ? 'Ending'
             : /body|본문/.test(nm) ? 'Body'
             : texts.some(t => t.name === 'txt-cta') ? 'Ending'
             : bigTwo ? 'Cover' : 'Body';

  const bg = light ? 'rich mid-to-dark tones behind the text area (foliage, shadow, soft bokeh) so light text stays legible'
                   : 'bright clean simple background (white, light grey, or soft pastel) behind the text area so dark text stays legible';
  const comp = (hasTop && hasBottom) ? 'subject centered in the middle third of the frame, top and bottom kept plain'
             : hasTop ? 'subject in the lower two-thirds of the frame, upper third kept plain for text'
             : hasBottom ? 'subject in the upper two-thirds of the frame, lower third kept plain for text'
             : 'subject filling the frame';
  const images = c.findAll(n => n.name === 'image' || (n.type === 'FRAME' && Array.isArray(n.fills) && n.fills.some(f => f.type === 'IMAGE'))).length;
  const names = texts.map(t => t.name);
  return { name: c.name.replace(/^.*=/, ''), id: c.id, role,
           text: names, sizes: Object.fromEntries(texts.map(t => [t.name, t.size])),
           twoTone: texts.filter(t => t.twoTone).map(t => t.name),
           list: names.some(n => /-2$/.test(n)),          // option-2/caption-2가 있으면 리스트형 Body
           images, fonts: [...new Set(texts.map(t => t.font))],
           imageSuffix: `${bg}, ${comp}, vertical 4:5` };
});
const out = figma.root.children.find(p => p.name === '📥 Output');
return { templates, accent, outputPageId: out?.id ?? null };
