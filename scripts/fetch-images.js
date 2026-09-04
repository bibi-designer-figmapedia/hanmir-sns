#!/usr/bin/env node
/**
 * fetch-images.js — Apify 결과(posts.json)의 displayUrl 이미지를 즉시 다운로드한다.
 *
 * 사용법:
 *   node scripts/fetch-images.js research/<핸들>/<YYYY-MM>/posts.json
 *
 * 규칙:
 *   - Apify displayUrl은 몇 시간 안에 만료된다 → 수집 직후 반드시 실행
 *   - 저장 경로: posts.json 옆에 <shortCode>.jpg
 *   - 이미 존재하면 건너뜀(재실행 안전)
 *   - 다운로드 성공한 항목은 posts.json의 image 필드에 상대경로를 기록한다
 */
const fs = require("fs");
const path = require("path");

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/fetch-images.js <posts.json>");
  process.exit(1);
}

const dir = path.dirname(file);
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const posts = Array.isArray(data) ? data : data.posts;

(async () => {
  let ok = 0, skip = 0, fail = 0;
  for (const p of posts) {
    const code = p.shortCode || p.shortcode || p.id;
    const url = p.displayUrl || p.display_url;
    if (!code || !url) { fail++; continue; }
    const out = path.join(dir, `${code}.jpg`);
    if (fs.existsSync(out)) { p.image = path.relative(process.cwd(), out); skip++; continue; }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
      p.image = path.relative(process.cwd(), out);
      ok++;
    } catch (e) {
      p.image = null;
      p.imageError = String(e.message || e);
      fail++;
    }
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(JSON.stringify({ downloaded: ok, skipped: skip, failed: fail, dir }));
})();
