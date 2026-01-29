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

## 세션 2026-01-25 (2차)

### 작업 내용

1. **Mermaid 다이어그램 중복 렌더링 버그 수정**
   - 동일 다이어그램이 2번 렌더링되는 문제
   - 원인: `onAfterRender` 훅과 `CONTENT_RENDERED` 이벤트가 동시 실행
   - 해결: `processingBlocks` Set으로 중복 처리 방지

2. **Zoom 스크롤바 축소 버그 수정**
   - 축소 시 스크롤바까지 같이 축소되는 문제
   - 원인: `viewer.css`에서 `#content` 전체에 transform 적용
   - 해결: 내부 콘텐츠(`.markdown-content-wrapper`)에만 transform 적용

3. **탭별 Zoom 기능 구현**
   - 각 탭마다 개별 zoom 레벨 저장/복원
   - 홈 탭은 항상 100% (zoom 변경 불가)
   - 탭 전환 시 해당 탭의 zoom 자동 적용

### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/plugins/mermaid/index.js` | `processingBlocks` Set 추가로 중복 렌더링 방지 |
| `src/modules/viewer/viewer.css` | zoom transform을 내부 콘텐츠에만 적용 |
| `src/modules/tabs/tabs.js` | 탭에 `zoom` 속성 및 관련 메서드 추가 |
| `src/modules/ui/zoom.js` | 탭별 zoom 관리로 변경 |
| `src/main.js` | 탭별 zoom 로직 (`setZoom`, `applyTabZoom`) |

### 커밋 정보

- 커밋 대기 중

---

## 세션 2026-01-26

### 작업 내용

1. **툴바 드롭다운 그룹화 구현**
   - 서식(Format) 드롭다운: 컬러 테마, 폰트, 폰트 크기, 콘텐츠 너비, 언어, 커스터마이저
   - 도구(Tools) 드롭다운: 인쇄, 프레젠테이션, TOC, 편집 모드, 저장
   - 기존 HTML 구조 유지하면서 드롭다운 래퍼로 감싸는 최소한의 변경
   - 라이트/다크 토글은 독립 버튼으로 유지

2. **드롭다운 동작 구현**
   - 드롭다운 토글 함수 (`toggleFormatDropdown`, `toggleToolsDropdown`)
   - 상호 배타적 동작 (하나 열면 다른 것 닫힘)
   - 외부 클릭 시 모든 드롭다운 닫힘
   - Tauri 윈도우 드래그 호환 (`-webkit-app-region: no-drag`)

3. **UI 개선**
   - 저장 버튼 텍스트 줄바꿈 방지 (`white-space: nowrap`)
   - 도구 아이콘 변경 (렌치 → 그리드 4칸) - 플러그인 아이콘과 구분

### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `index.html` | 서식/도구 드롭다운 래퍼 추가, 도구 아이콘 변경 |
| `src/main.js` | 드롭다운 토글 함수 및 이벤트 리스너 추가 |
| `src/modules/ui/ui.css` | 툴바 드롭다운 패널 스타일 추가 |

### 발생한 문제 및 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| 저장 버튼 텍스트 줄바꿈 | 버튼 너비 부족 | `white-space: nowrap` 추가 |
| 도구/플러그인 아이콘 동일 | 둘 다 렌치 아이콘 사용 | 도구 아이콘을 그리드(4칸)로 변경 |

### 커밋 정보

```
commit 6725f8e
feat: add toolbar dropdown grouping for Format and Tools
4 files changed, 328 insertions(+), 106 deletions(-)
```

---

## 세션 2026-01-30

### 작업 내용

1. **버그 수정: 프레젠테이션 메시지 오류**
   - 홈에서 프레젠테이션 클릭 시 "인쇄할 문서가 없습니다" 표시되던 문제
   - `noPresentDoc` i18n 키 추가 (한/영/일)

2. **버그 수정: TOC 목차 클릭 이동 안됨**
   - `scrollIntoView` → `getBoundingClientRect` 기반 수동 스크롤 (zoom transform 호환)

3. **버그 수정: ESC 키 홈 이동 제거**
   - ESC 키가 모달/드롭다운이 없을 때 홈으로 이동하던 동작 제거
   - 드롭다운 열려있으면 닫기만 수행

4. **외부 링크 시스템 브라우저 열기**
   - `@tauri-apps/plugin-shell` 설치 및 Rust/capabilities 등록
   - `http://`, `https://` 링크 클릭 시 시스템 기본 브라우저에서 열기

5. **마크다운 내부 앵커 링크 지원**
   - GitHub 스타일 slug 생성 커스텀 heading 렌더러 추가
   - `#anchor` 클릭 시 `#content` 컨테이너 내 스크롤 이동

6. **커서/손끌기 토글 버튼**
   - 툴바에 커서↔손 전환 버튼 추가
   - 손 모드: 드래그로 스크롤, 커서 모드: 텍스트 선택/복사
   - zoom 레벨 관계없이 동작

7. **파일 삭제 시 탭 자동 닫기**
   - 파일 watcher에서 `remove` 이벤트 감지 → 해당 탭 자동 닫기

### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `index.html` | 커서/손끌기 토글 버튼 추가 |
| `src/main.js` | 외부 링크, 앵커 링크, 커서 토글, 파일 삭제 감지, ESC 동작 수정, heading slug |
| `src/i18n.js` | `noPresentDoc` 키 추가 (한/영/일) |
| `src/modules/toc/toc.js` | TOC 클릭 스크롤 방식 변경 |
| `src-tauri/Cargo.toml` | `tauri-plugin-shell` 의존성 추가 |
| `src-tauri/src/lib.rs` | shell 플러그인 등록 |
| `src-tauri/capabilities/default.json` | shell 권한 추가 |
| `package.json` | `@tauri-apps/plugin-shell` 추가 |

### 발생한 문제 및 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| 프레젠테이션 "인쇄할 문서가 없습니다" | `noPrintDoc` 키 잘못 사용 | `noPresentDoc` 키 신규 추가 |
| TOC 클릭 이동 안됨 | zoom transform 하위에서 `scrollIntoView` 오작동 | `getBoundingClientRect` 기반 수동 스크롤 |
| 마크다운 내부 목차 링크 안됨 | heading ID와 앵커 불일치 + 스크롤 컨테이너 문제 | GitHub 스타일 slug + 앵커 클릭 핸들러 |
| 외부 링크가 앱 내에서 열림 | shell 플러그인 미설치 | `@tauri-apps/plugin-shell` 설치 |

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

---

## 과거 개발 이력

> 이전 세션 로그 도입 전 개발 내역

### 2026-01-24 마크다운 편집 기능
- **마크다운 편집기**: View/Edit/Split 모드
- 실시간 미리보기, Ctrl+S 저장, dirty indicator
- 관련 파일: `editor/`, `main.js`, `index.html`, `i18n.js`

### 2026-01-24 코드 블록 기능
- **코드 블록 복사 버튼**: 클릭 시 클립보드 복사, 피드백 아이콘
- **코드 문법 하이라이트**: highlight.js 통합, 180+ 언어 지원
- 관련 파일: `main.js`, `markdown.js`, `syntax.css`

### 2026-01-24 PDF 내보내기
- html2pdf.js 사용, A4 용지 자동 분할
- 관련 파일: `main.js`, `toolbar.js`, `icons.js`

### 2026-01-24 모듈별 CSS 분리
- style.css → 10개 모듈로 분리 (theme, base, ui, tabs, files, search, viewer, syntax, toc, editor)
- 관련 파일: `styles/index.css`, `modules/*.css`

### 2026-01-23 여러 커스텀 테마 저장
- 테마 프리셋 기능, localStorage 저장
- 관련 파일: `main.js`, `style.css`, `index.html`

### 2026-01-22 TOC 사이드바
- 마크다운 헤딩 기반 목차, 스크롤 스파이, Ctrl+Shift+T
- 관련 파일: `toc/toc.js`, `main.js`, `style.css`

### 2026-01-22 싱글 인스턴스 버그 수정
- 창 Label 문제로 파일 더블클릭 시 기존 앱에서 안 열림
- 해결: `get_webview_window("main")` → `webview_windows().iter().next()`
- 관련 파일: `src-tauri/src/lib.rs`

### 2026-01-09 파일 시스템 감시
- 외부 수정 시 자동 리로드, 300ms 디바운스
- 관련 파일: `main.js`, `Cargo.toml`, `capabilities`

### 2026-01-08 UI/UX 개선
- **Pan 기능**: 줌 100% 초과 시 드래그로 이동
- **용지 자동 맞춤 인쇄**: A4, 자동 줄바꿈
- **GitHub Alert Box**: NOTE, TIP, IMPORTANT, WARNING, CAUTION
- 관련 파일: `main.js`, `style.css`

### 2026-01-06 싱글 인스턴스
- MD 파일 더블클릭 시 기존 앱 새 탭으로 열림
- 임시 파일 기반 IPC 통신
- 관련 파일: `lib.rs`, `main.rs`, `main.js`

### 2025-12-29 모듈화 리팩토링
- main.js 2,138줄 → 172줄 (92% 감소)
- 19개 ES 모듈 분리, Store 패턴 상태 관리
- 관련 파일: `core/`, `modules/`, `utils/`

### 2025-12-26 v1.0.0
- 다국어 지원 (한/영/일)
- 프레젠테이션 모드 (F5)
- 뷰 모드 개선 (한 페이지/여러 페이지)
- 도움말 메뉴

---

*마지막 업데이트: 2026-01-26*
