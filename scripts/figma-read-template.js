// ig-content-maker B-0 — 템플릿 읽기 (read-only). 이 파일 내용을 그대로 use_figma 에 넣는다.
// 돌려주는 것: templates[] { name, id, role(Cover/Body/Ending), text[], sizes, twoTone[], images, fonts, imageSuffix } + accent(액센트 hex)

// 컴포넌트 세트가 여럿이면(예: 이미지 슬롯 세트 `image`) txt- 텍스트 레이어가 가장 많은 세트가 템플릿이다
const sets = figma.root.findAll(n => n.type === 'COMPONENT_SET');
const txtCount = n => n.findAll(x => x.type === 'TEXT' && x.name.startsWith('txt-')).length;
const set = sets.sort((a, b) => txtCount(b) - txtCount(a))[0];
const comps = set && txtCount(set) ? set.children.filter(n => n.type === 'COMPONENT')
                  : figma.root.findAll(n => n.type === 'COMPONENT' && txtCount(n) > 0);

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

  const imageNodes = c.findAll(n => n.name === 'image' || (n.type === 'FRAME' && Array.isArray(n.fills) && n.fills.some(f => f.type === 'IMAGE')));
  // 사진에 "여기는 비워라"를 시키지 않는다 — 모델이 띠를 그리거나 인물을 잘라서 맞춘다.
  // 글자 가독성은 사진이 아니라 템플릿이 보장한다(스크림·불투명 박스). 없으면 warn으로 알려준다.
  const img0 = imageNodes[0];
  const scrimOver = t => {                         // 글자와 이미지 사이에 반투명 판이 깔려 있나
    let n = t, top = null;
    while (n && n !== c) { top = n; n = n.parent; }
    const idx = c.children.indexOf(top);
    return c.children.slice(0, idx).some(sib => sib !== img0 && Array.isArray(sib.fills) &&
      sib.fills.some(f => (f.type === 'SOLID' || f.type.startsWith('GRADIENT')) && f.visible !== false) &&
      sib.absoluteBoundingBox && t.absoluteBoundingBox &&
      sib.absoluteBoundingBox.y <= t.absoluteBoundingBox.y &&
      sib.absoluteBoundingBox.y + sib.absoluteBoundingBox.height >= t.absoluteBoundingBox.y + t.absoluteBoundingBox.height);
  };
  const bare = !img0 ? [] : c.findAll(n => n.type === 'TEXT' && n.name.startsWith('txt-')).filter(tn => {
    const boxed = Array.isArray(tn.parent.fills) && tn.parent.fills.some(f => f.type === 'SOLID' && f.visible !== false && (f.opacity ?? 1) > 0.5);
    if (boxed || scrimOver(tn)) return false;
    const a = tn.absoluteBoundingBox, b = img0.absoluteBoundingBox; if (!a || !b) return false;
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }).map(t => t.name);
  const warn = bare.length ? `${bare.join(' · ')}이(가) 사진 위에 그대로 얹혀 있습니다. 이 배리언트는 기획서 슬라이드마다 photo(light/dark)를 정해 글자색을 맞추세요 — 어두운 사진이면 흰 글자. 아예 안 흔들리게 하려면 반투명 스크림을 깔아 두세요.` : null;
  const seamless = 'one continuous photograph edge to edge — no bands, borders, split panels, blur strips or added gradients';
  const images = imageNodes.length;
  // 비율은 슬롯 크기에서 읽는다 (커버 1080×1350 → 4:5, 원형 슬롯 744×744 → 1:1, 상품 슬롯 370×281 → 4:3). 슬롯과 다른 비율을 적으면 모델이 여백 띠를 그린다
  const ratioOf = n => { const r = n.width / n.height; return r > 1.15 ? 'landscape 4:3' : r < 0.87 ? 'vertical 4:5' : 'square 1:1'; };
  const ratio = imageNodes.length ? ratioOf(imageNodes[0]) : 'vertical 4:5';
  const names = texts.map(t => t.name);
  return { name: c.name.replace(/^.*=/, ''), id: c.id, role,
           text: names, sizes: Object.fromEntries(texts.map(t => [t.name, t.size])),
           twoTone: texts.filter(t => t.twoTone).map(t => t.name),
           list: names.some(n => /-2$/.test(n)),          // option-2/caption-2가 있으면 리스트형 Body
           images, fonts: [...new Set(texts.map(t => t.font))],
           textOnPhoto: bare, warn,
           imageSuffix: [seamless, ratio].join(', ') };
});
const out = figma.root.children.find(p => p.name === '📥 Output');
return { templates, accent, outputPageId: out?.id ?? null };
