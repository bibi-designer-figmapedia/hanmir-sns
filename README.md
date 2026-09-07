# hanmir-sns — 인스타 콘텐츠 파이프라인

경쟁사 인스타를 긁어 보고서를 만들고 → 우리 콘텐츠를 기획해 → 피그마 템플릿에 카피를 채운 게시물 틀을 만든다.
이미지는 기획서의 프롬프트로 사람이 피그마 **Make an image**에서 생성해 넣는다.
Claude Code 서브 에이전트 2개 + MCP 2개(Apify·Figma) + Google Drive 커넥터.

```
BRAND.md ──▶ ig-competitor-scout ──▶ 보고서 .pptx (+ Drive 업로드 → 구글 슬라이드)
                    │ 게이트 ①
                    ▼
             ig-content-maker ──▶ content-plan.md(카피 + 이미지 프롬프트) → 피그마 📥 Output 틀
                    │ 게이트 ②
                    ▼
             사람: image 레이어 선택 → Make an image → 프롬프트 붙여넣기
```

## 폴더

```
BRAND.md                 브랜드 설명서 7칸 (빈 템플릿) — 자기 브랜드로 쓴다 (★ 제품·제약·경쟁사 필수 · 1번 브랜드 컬러를 적으면 피그마 버튼·강조색이 그 색으로)
BRAND.example.md         분독으로 채운 예시
CLAUDE.md                파이프라인 규칙·위임·게이트·함정
.mcp.json                (없음 — claude mcp add --scope project 로 각자 생성: apify · figma)
.claude/agents/          ig-content-maker.md (완성본) · ig-competitor-scout.md (완성본 — 수업에서는 이 파일을 지우고 빈칸 카드로 직접 만든다)
scripts/fetch-images.js  Apify 이미지 즉시 다운로드
scripts/make-report.js   보고서 JSON → pptx
research/                수집 원문 (이미지는 git 제외)
outputs/research/        보고서 json·md·pptx
outputs/planning/        기획서
```

## 시작

```bash
npm install
claude            # /mcp 에서 apify · figma · Google Drive connected 확인
```

BRAND.md를 자기 브랜드로 채운 뒤 → "템플릿 스타일 가이드 읽어서 BRAND.md 7번에 정리해줘 {URL}" → "경쟁사 분석해줘" → pptx 확인 → "콘텐츠 기획해줘" → "피그마로 뽑아줘 {URL}" → 피그마에서 카피 확인 → Make an image로 이미지. 슬래시 커맨드는 없다 — 전부 자연어.

## 다음 클라이언트로 복제

폴더 복사 → `BRAND.md` 새로 쓰기 (피그마 템플릿 복제해 7번 URL). 에이전트 파일은 그대로.
