# Vexa MD 세션 로그

이 문서는 개발 세션별 작업 내용, 문제, 해결책을 기록합니다.

---

## 세션 2026-01-25

### 작업 내용

1. **Mermaid 다이어그램 크기 문제 해결**
   - Flowchart, Class Diagram, State Diagram이 원본보다 3~4배 크게 렌더링되는 문제
   - 원인: CSS에서 `max-width: 800px`로 고정하여 작은 원본 SVG가 확대됨
   - 해결: JS에서 원본 크기를 max-width로 설정, CSS 고정값 제거

2. **분할 화면(Split Mode) 레이아웃 문제 해결**
   - 뷰어 영역이 50%가 아닌 100% 너비 차지
   - 원인: `toc.css`의 `position: relative`와 `editor.css`의 position 미지정 충돌
   - 해결: `editor.css`에 `position: absolute` 명시적 추가

3. **프로젝트 문서화 체계 구축**
   - `CLAUDE.md`: 프로젝트 AI 지침
   - `docs/SESSION-LOG.md`: 세션 로그
   - `docs/troubleshooting/`: 트러블슈팅 문서 디렉터리

### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/plugins/mermaid/index.js` | SVG 크기 처리 로직 수정, 디버깅 로그 추가 |
| `src/modules/plugins/plugin-ui.css` | 고정 max-width 제거 |
| `src/modules/editor/editor.css` | Split 모드 position:absolute 추가 |
| `CLAUDE.md` | 신규 생성 - 프로젝트 AI 지침 |
| `docs/SESSION-LOG.md` | 신규 생성 - 세션 로그 |
| `docs/troubleshooting/README.md` | 신규 생성 - 트러블슈팅 인덱스 |
| `docs/troubleshooting/mermaid-split-mode.md` | 신규 생성 - 이슈 해결 문서 |

### 발생한 문제

1. **Mermaid 다이어그램 크기**
   - 상태: 해결됨
   - 상세: [docs/troubleshooting/mermaid-split-mode.md](./troubleshooting/mermaid-split-mode.md)

2. **분할 화면 레이아웃**
   - 상태: 해결됨
   - 상세: [docs/troubleshooting/mermaid-split-mode.md](./troubleshooting/mermaid-split-mode.md)

### 커밋 정보

- 아직 커밋되지 않음
- 커밋 전 사용자 확인 필요

### 다음 세션 참고사항

1. ~~Mermaid 플러그인에 디버깅 로그가 많이 남아있음~~ - 정리 완료
2. 분할 화면 및 Mermaid 다이어그램 테스트 후 커밋 진행
3. 플러그인 시스템 계획 파일 존재: `.claude/plans/giggly-watching-liskov.md`

---

## 세션 로그 작성 가이드

### 세션 시작 시
1. 이 파일을 읽어 이전 작업 컨텍스트 파악
2. `git status`로 현재 상태 확인
3. `docs/troubleshooting/` 확인하여 알려진 이슈 인지

### 세션 종료 시
1. 작업 내용 요약 추가
2. 수정된 파일 목록 업데이트
3. 발생한 문제와 해결 상태 기록
4. 다음 세션 참고사항 작성

### 커밋 시
1. 커밋 메시지와 해시 기록
2. 변경된 파일 목록 확인
