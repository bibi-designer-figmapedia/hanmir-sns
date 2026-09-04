---
description: 경쟁사 인스타 수집·분석 → pptx 보고서 (ig-competitor-scout 실행)
argument-hint: [핸들…] [기간 YYYY-MM-DD~YYYY-MM-DD]
---

ig-competitor-scout 에이전트를 호출해 경쟁사 분석을 실행한다.

인자: $ARGUMENTS
- 인자가 비어 있으면 `BRAND.md`의 `## 경쟁사` 표 전체 × 기본 기간(최근 30일)으로 진행한다.
- 핸들이 주어지면 그 계정만, 기간이 주어지면 그 기간으로.

완료되면 에이전트가 돌려준 요약(pptx 경로 · 핵심 발견 · 미확보 · 검수 요청)을 그대로 사용자에게 보여주고,
**게이트 ①** — 사용자가 확인하기 전에는 ig-content-maker를 호출하지 않는다.
