# hanmir-contents — 인스타 콘텐츠 파이프라인

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
BRAND.md                 브랜드·제약·이미지 프롬프트 가이드·경쟁사·피그마 템플릿 URL (사람이 관리)
CLAUDE.md                파이프라인 규칙·위임·게이트·함정
.mcp.json                apify + figma
.claude/agents/          ig-competitor-scout.md · ig-content-maker.md
.claude/commands/        /ig-research · /ig-make
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

BRAND.md의 `{…}` 칸을 채운 뒤 → `/ig-research` → pptx 확인 → `/ig-make` → 피그마에서 카피 확인 → Make an image로 이미지.

## 다음 클라이언트로 복제

폴더 복사 → `BRAND.md` 교체 → 피그마 템플릿 복제해 URL 교체. 에이전트 파일은 그대로.
