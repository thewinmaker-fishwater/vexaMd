# Vexa MD 세션 로그

이 문서는 개발 세션별 작업 내용, 문제, 해결책을 기록합니다.

---

## 세션 2026-01-25

### 작업 내용

1. **플러그인 시스템 구현 (Phase 1-5)**
   - Plugin 기본 클래스, PluginManager, PluginAPI 구현
   - 마크다운 확장 API (onBeforeRender, onAfterRender 훅)
   - UI 확장 API (addToolbarButton)
   - 플러그인 설정 UI 기본 구조
   - Mermaid 예시 플러그인

2. **Mermaid 다이어그램 크기 문제 해결**
   - Flowchart, Class Diagram, State Diagram이 원본보다 3~4배 크게 렌더링되는 문제
   - 원인: CSS에서 `max-width: 800px`로 고정하여 작은 원본 SVG가 확대됨
   - 해결: JS에서 원본 크기를 max-width로 설정, CSS 고정값 제거

3. **분할 화면(Split Mode) 레이아웃 문제 해결**
   - 뷰어 영역이 50%가 아닌 100% 너비 차지
   - 원인: `toc.css`의 `position: relative`와 `editor.css`의 position 미지정 충돌
   - 해결: `editor.css`에 `position: absolute` 명시적 추가

4. **프로젝트 문서화 체계 구축**
   - `CLAUDE.md`: 프로젝트 AI 지침
   - `docs/SESSION-LOG.md`: 세션 로그
   - `docs/troubleshooting/`: 트러블슈팅 문서 디렉터리
   - `docs/plugin-development.md`: 플러그인 개발 가이드

### 수정/생성된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/core/plugin.js` | 신규 - Plugin 기본 클래스 |
| `src/core/plugin-manager.js` | 신규 - 플러그인 관리자 |
| `src/core/plugin-api.js` | 신규 - 플러그인 API 팩토리 |
| `src/plugins/mermaid/index.js` | 신규 - Mermaid 플러그인 |
| `src/plugins/mermaid/plugin.json` | 신규 - 플러그인 메타데이터 |
| `src/modules/plugins/plugin-ui.js` | 신규 - 플러그인 설정 UI |
| `src/modules/plugins/plugin-ui.css` | 신규 - 플러그인 UI 스타일 |
| `src/modules/editor/editor.css` | Split 모드 position:absolute 추가 |
| `src/main.js` | PluginManager 통합, 마크다운 훅 |
| `src/components/toolbar.js` | 플러그인 버튼, 동적 버튼 지원 |
| `src/core/events.js` | 플러그인 관련 이벤트 추가 |
| `src/i18n.js` | 플러그인 관련 번역 추가 |
| `index.html` | 플러그인 설정 모달 |
| `CLAUDE.md` | 신규 - 프로젝트 AI 지침 |
| `docs/SESSION-LOG.md` | 신규 - 세션 로그 |
| `docs/troubleshooting/` | 신규 - 트러블슈팅 문서 |
| `docs/plugin-development.md` | 신규 - 플러그인 개발 가이드 |
| `docs/README.md` | 플러그인 시스템 섹션 추가 |
| `docs/ARCHITECTURE.md` | 플러그인 아키텍처 섹션 추가 |

### 커밋 정보

```
commit 6dbe0fc
feat: add plugin system with Mermaid diagram support
27 files changed, 5229 insertions(+), 19 deletions(-)
```

### 플러그인 시스템 구현 현황

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 1 | 코어 시스템 (Plugin, PluginManager, PluginAPI) | ✅ 완료 |
| Phase 2 | 마크다운 확장 API (렌더링 훅) | ✅ 완료 |
| Phase 3 | UI 확장 API (툴바 버튼, 알림, 모달) | ⚠️ 부분 완료 |
| Phase 4 | 플러그인 설정 UI | ⚠️ 부분 완료 |
| Phase 5 | Mermaid 예시 플러그인 | ✅ 완료 |

### 다음 세션 작업 목록

#### Phase 3 남은 작업 (UI 확장 API)
- [ ] `ui.addToolbarGroup()` - 버튼 그룹 추가 기능
- [ ] `ui.showNotification()` - 알림 표시 기능
- [ ] `ui.createModal()` - 모달 생성 기능
- [ ] `ui.addSettingsSection()` - 설정 섹션 추가

#### Phase 4 남은 작업 (플러그인 설정 UI)
- [ ] 플러그인 목록 표시 개선
- [ ] 플러그인별 설정 패널
- [ ] 플러그인 활성화/비활성화 상태 저장
- [ ] 설정 내보내기/가져오기

#### 향후 확장 기능
- [ ] 사용자 플러그인 폴더 지원 (`%APPDATA%/vexa-md/plugins/`)
- [ ] 온라인 플러그인 마켓
- [ ] 플러그인 업데이트 확인
- [ ] 추가 내장 플러그인 (수식, 차트 등)

### 참고 문서

- 플러그인 시스템 계획: `.claude/plans/giggly-watching-liskov.md`
- 플러그인 개발 가이드: `docs/plugin-development.md`
- 트러블슈팅: `docs/troubleshooting/mermaid-split-mode.md`

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
