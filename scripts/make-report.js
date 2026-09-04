#!/usr/bin/env node
/**
 * make-report.js — 경쟁사 분석 JSON → .pptx 보고서
 *
 * 사용법:
 *   node scripts/make-report.js outputs/research/<YYYY-MM-DD>_competitor-report.json
 *   → 같은 이름의 .pptx 가 옆에 생성된다
 *
 * 입력 JSON 스키마 (에이전트 ig-competitor-scout 가 작성):
 * {
 *   "brand": "분독 BOONDOG",
 *   "period": { "from": "2026-08-05", "to": "2026-09-04" },
 *   "generatedAt": "2026-09-04",
 *   "accounts": [
 *     {
 *       "handle": "ruffwear",
 *       "profileUrl": "https://www.instagram.com/ruffwear/",
 *       "followers": 123456,          // 미확보면 null
 *       "postCount": 18,              // 기간 내 게시물 수
 *       "likesMedian": 812,
 *       "commentsMedian": 21,
 *       "formatMix": { "Video": 10, "Sidecar": 5, "Image": 3 },
 *       "summary": "한 줄 평",
 *       "top": [                      // 좋아요 상위 5건
 *         { "shortCode": "C_xxx", "url": "https://www.instagram.com/p/C_xxx/",
 *           "timestamp": "2026-08-12T09:10:00Z", "type": "Video",
 *           "likes": 3120, "comments": 88, "image": "research/ruffwear/2026-08/C_xxx.jpg",
 *           "note": "후킹: 첫 컷에 강아지 클로즈업 + 텍스트 오버레이" }
 *       ]
 *     }
 *   ],
 *   "patterns": [ { "title": "패턴명", "why": "왜 작동하는가", "evidence": ["url1","url2"] } ],
 *   "takeaways": [ "우리가 가져올 것 1", "2", "3" ],
 *   "unavailable": [ "미확보 데이터 메모" ]
 * }
 */
const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");

const input = process.argv[2];
if (!input) {
  console.error("usage: node scripts/make-report.js <competitor-report.json>");
  process.exit(1);
}
const R = JSON.parse(fs.readFileSync(input, "utf8"));
const out = input.replace(/\.json$/, ".pptx");

// ---------- 스타일 ----------
const C = {
  ink: "111111", sub: "666666", line: "DDDDDD", bg: "FFFFFF", accent: "FF5A36", soft: "F5F5F5",
};
const FONT = "Pretendard"; // 없으면 시스템 기본으로 대체됨
const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_16x9"; // 10 x 5.625 in
pptx.author = "ig-competitor-scout";
pptx.title = `${R.brand} 경쟁사 인스타 분석`;

const fmtN = (n) => (n == null || n < 0 ? "비공개" : Number(n).toLocaleString("ko-KR"));
const fmtD = (iso) => (iso ? iso.slice(0, 10) : "-");
const period = `${R.period?.from ?? "?"} ~ ${R.period?.to ?? "?"}`;

function header(slide, title, kicker) {
  slide.background = { color: C.bg };
  if (kicker) slide.addText(kicker, { x: 0.5, y: 0.3, w: 9, h: 0.3, fontSize: 11, color: C.accent, fontFace: FONT, bold: true });
  slide.addText(title, { x: 0.5, y: 0.55, w: 9, h: 0.6, fontSize: 24, color: C.ink, fontFace: FONT, bold: true });
  slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 1.2, w: 9, h: 0, line: { color: C.line, width: 1 } });
  slide.addText(`${R.brand} · ${period}`, { x: 0.5, y: 5.2, w: 6, h: 0.3, fontSize: 9, color: C.sub, fontFace: FONT });
}

// ---------- 1. 표지 ----------
{
  const s = pptx.addSlide();
  s.background = { color: C.ink };
  s.addText("경쟁사 인스타그램 분석 보고서", { x: 0.6, y: 1.6, w: 8.8, h: 0.8, fontSize: 32, bold: true, color: "FFFFFF", fontFace: FONT });
  s.addText(R.brand, { x: 0.6, y: 2.5, w: 8.8, h: 0.5, fontSize: 18, color: "FFFFFF", fontFace: FONT });
  s.addText(`분석 기간 ${period}`, { x: 0.6, y: 3.0, w: 8.8, h: 0.4, fontSize: 13, color: "BBBBBB", fontFace: FONT });
  s.addText(`분석 계정 ${R.accounts.map((a) => "@" + a.handle).join("  ·  ")}`, { x: 0.6, y: 3.4, w: 8.8, h: 0.4, fontSize: 13, color: "BBBBBB", fontFace: FONT });
  s.addText(`작성 ${R.generatedAt ?? ""} · 데이터: Apify instagram-scraper (공개 게시물)`, { x: 0.6, y: 4.9, w: 8.8, h: 0.3, fontSize: 9, color: "888888", fontFace: FONT });
}

// ---------- 2. 계정 비교 요약 ----------
{
  const s = pptx.addSlide();
  header(s, "계정 비교 요약", "OVERVIEW");
  const rows = [
    ["계정", "팔로워", "기간 내 게시물", "좋아요 중앙값", "댓글 중앙값", "형식 비중", "한 줄 평"].map((t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: C.ink } } })),
    ...R.accounts.map((a) => [
      "@" + a.handle, fmtN(a.followers), fmtN(a.postCount), fmtN(a.likesMedian), fmtN(a.commentsMedian),
      Object.entries(a.formatMix || {}).map(([k, v]) => `${k} ${v}`).join(" / ") || "-",
      a.summary || "-",
    ]),
  ];
  s.addTable(rows, {
    x: 0.5, y: 1.4, w: 9, fontSize: 10, fontFace: FONT, color: C.ink, border: { type: "solid", color: C.line, pt: 0.5 },
    colW: [1.3, 1.0, 1.1, 1.1, 1.0, 1.5, 2.0], rowH: 0.4, valign: "middle",
  });
}

// ---------- 3. 계정별 상위 게시물 그리드 ----------
for (const a of R.accounts) {
  const s = pptx.addSlide();
  header(s, `@${a.handle} — 좋아요 상위 ${Math.min(5, (a.top || []).length)}`, "TOP POSTS");
  s.addText(a.profileUrl || "", { x: 0.5, y: 1.25, w: 9, h: 0.25, fontSize: 9, color: C.sub, fontFace: FONT, hyperlink: a.profileUrl ? { url: a.profileUrl } : undefined });
  const top = (a.top || []).slice(0, 5);
  const cellW = 1.7, gap = 0.125, x0 = 0.5, yImg = 1.6, imgH = 1.7;
  top.forEach((p, i) => {
    const x = x0 + i * (cellW + gap);
    const img = p.image && fs.existsSync(p.image) ? p.image : null;
    if (img) {
      s.addImage({ path: img, x, y: yImg, w: cellW, h: imgH, sizing: { type: "cover", w: cellW, h: imgH } });
    } else {
      s.addShape(pptx.ShapeType.rect, { x, y: yImg, w: cellW, h: imgH, fill: { color: C.soft }, line: { color: C.line } });
      s.addText("이미지 미확보", { x, y: yImg + 0.7, w: cellW, h: 0.3, fontSize: 9, align: "center", color: C.sub, fontFace: FONT });
    }
    s.addText(`♥ ${fmtN(p.likes)}   💬 ${fmtN(p.comments)}`, { x, y: yImg + imgH + 0.05, w: cellW, h: 0.28, fontSize: 10, bold: true, color: C.ink, fontFace: FONT });
    s.addText(`${fmtD(p.timestamp)} · ${p.type || ""}`, { x, y: yImg + imgH + 0.3, w: cellW, h: 0.25, fontSize: 8, color: C.sub, fontFace: FONT });
    s.addText(p.note || "", { x, y: yImg + imgH + 0.55, w: cellW, h: 0.7, fontSize: 8, color: C.ink, fontFace: FONT, valign: "top" });
    s.addText("게시물 열기 ↗", { x, y: yImg + imgH + 1.25, w: cellW, h: 0.22, fontSize: 8, color: C.accent, fontFace: FONT, hyperlink: p.url ? { url: p.url } : undefined });
  });
}

// ---------- 4. 반복 패턴 ----------
if (R.patterns?.length) {
  const s = pptx.addSlide();
  header(s, "반복 패턴", "PATTERNS");
  const items = R.patterns.slice(0, 5).flatMap((p, i) => [
    { text: `${i + 1}. ${p.title}`, options: { bold: true, fontSize: 13, color: C.ink, breakLine: true } },
    { text: `${p.why}`, options: { fontSize: 11, color: C.ink, breakLine: true } },
    { text: `근거: ${(p.evidence || []).join("  ")}`, options: { fontSize: 8, color: C.sub, breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
  ]);
  s.addText(items, { x: 0.5, y: 1.4, w: 9, h: 3.7, fontFace: FONT, valign: "top" });
}

// ---------- 5. 우리가 가져올 것 + 미확보 ----------
{
  const s = pptx.addSlide();
  header(s, "우리가 가져올 것", "TAKEAWAYS");
  const tk = (R.takeaways || []).map((t, i) => ({ text: `${i + 1}. ${t}`, options: { fontSize: 14, color: C.ink, breakLine: true, paraSpaceAfter: 8 } }));
  s.addText(tk.length ? tk : "-", { x: 0.5, y: 1.4, w: 9, h: 2.6, fontFace: FONT, valign: "top" });
  if (R.unavailable?.length) {
    s.addText([{ text: "미확보 데이터", options: { bold: true, fontSize: 10, color: C.sub, breakLine: true } },
      ...R.unavailable.map((u) => ({ text: `· ${u}`, options: { fontSize: 9, color: C.sub, breakLine: true } }))],
      { x: 0.5, y: 4.1, w: 9, h: 1.0, fontFace: FONT, valign: "top" });
  }
}

pptx.writeFile({ fileName: out }).then((f) => {
  const kb = Math.round(fs.statSync(f).size / 1024);
  console.log(JSON.stringify({ pptx: f, sizeKB: kb, slides: 4 + R.accounts.length }));
});
