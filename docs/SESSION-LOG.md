# Vexa MD 세션 로그

이 문서는 개발 세션별 작업 내용, 문제, 해결책을 기록합니다.

---

## 세션 2026-02-20 (2)

### 작업 내용

1. **즐겨찾기 (Favorites) 기능 구현**
   - 자주 여는 파일을 별표(★)로 고정하여 빠르게 접근
   - 툴바에 별 토글 버튼(`btn-favorite-toggle`) + 즐겨찾기 목록 버튼(`btn-favorites`) 추가
   - 즐겨찾기 드롭다운: 최근 파일 드롭다운과 동일 패턴 (클릭 열기, X 제거, 지우기)
   - 홈 화면에 즐겨찾기 섹션 추가 (최근 파일 위, 별 아이콘)
   - `Ctrl+B` 단축키로 현재 파일 즐겨찾기 토글
   - 탭 전환 시 별표 버튼 상태 자동 동기화
   - localStorage `favorites` 키에 최대 20개 저장
   - i18n 지원 (ko/en/ja)
   - 단축키 모달에 `Ctrl+B 즐겨찾기` 항목 추가

### 수정된 파일
- `src/modules/files/file-ops.js` - 즐겨찾기 CRUD, 드롭다운/홈 렌더링
- `src/modules/files/files.css` - 즐겨찾기 스타일, 별 활성화 색상
- `index.html` - 별표 토글/목록 버튼, 즐겨찾기 드롭다운
- `src/modules/welcome/welcome.js` - 홈 화면 즐겨찾기 섹션
- `src/i18n.js` - 즐겨찾기 번역 키 (ko/en/ja)
- `src/main.js` - 이벤트 연결, context 전달
- `src/modules/tabs/tab-manager.js` - 홈탭 전환 시 renderHomeFavorites 호출
- `src/modules/ui/ui-texts.js` - 즐겨찾기 UI 텍스트 업데이트
- `src/modules/shortcuts/shortcuts.js` - Ctrl+B 단축키 추가

### 발생한 문제
- 없음

### 커밋 정보
- (아래 참조)

### 다음 세션 참고사항
- 즐겨찾기 드래그 앤 드롭 정렬 기능 고려
- 즐겨찾기 폴더/그룹 기능 확장 가능

---

## 세션 2026-02-20

### 작업 내용

1. **상태바 (Status Bar) 구현**
   - VS Code 스타일 하단 상태바 (높이 28px, flex 레이아웃)
   - 좌측: 파일명, 중앙: 글자 수·단어 수·읽기 시간, 우측: 줌 비율
   - `Ctrl+/` 단축키로 상태바 표시/숨기기 토글 (iOS 스타일 토글 스위치)
   - 홈탭에서는 "Vexa MD v1.5.2" 표시
   - 인쇄/프레젠테이션 모드에서 자동 숨김
   - 다크/라이트 테마 자동 대응 (CSS 변수)
   - i18n 지원 (자/chars/文字, 단어/words/語, 분/min/分)

2. **공유 텍스트 유틸리티 (text-utils.js)**
   - `src/core/text-utils.js` 신규 생성
   - `countWords()`, `countChars()`, `calcReadingTime()` 공유 함수
   - CJK 인식 카운팅: 한국어/중국어/일본어 문자를 개별 단어로 카운팅
   - 상태바와 Word Counter 플러그인에서 동일 로직 사용

3. **Word Counter 플러그인 v1.1.0 전면 개선**
   - CJK 인식 카운팅 (text-utils.js 공유)
   - 기본 표시 모드 `'words'` → `'both'` (글자 수 + 단어 수)
   - `editor:content-changed`, `tab:switched` 이벤트 구독 추가
   - 빈 문서에서 '--' 표시

4. **플러그인 UI 수정**
   - 플러그인 설정 팝업 스크롤 추가 (`flex: 1; overflow-y: auto; min-height: 0`)
   - range 슬라이더 드래그 시 실시간 값 표시 (input 이벤트 리스너)

5. **저장 버튼 에디터 모드 전용**
   - 도구 드롭다운의 저장 버튼을 에디터 모드(edit/split)에서만 표시
   - 보기 모드(view)에서는 숨김

6. **뷰 모드/에디터 모드 토글 스타일 개선**
   - `#toolbar .view-mode-group .view-btn.active`: accent 배경 + 흰색 텍스트 + box-shadow
   - CSS 특이성 문제 해결 (`#toolbar button` ID 셀렉터 오버라이드)
   - 에디터 모드 드롭다운 버튼도 동일한 액센트 스타일 적용

7. **Reading Time 플러그인 탭 전환 수정**
   - `tab:switched` 이벤트 구독 추가

8. **렌더러 페이징 수정**
   - `renderer.js`에 `lastCtx` 모듈 변수 추가
   - 페이지 네비게이션 시 ctx 없이 호출되는 문제 해결

9. **문서 현행화**
   - FEATURES.md: 상태바(#29), Word Counter v1.1.0, Ctrl+/ 단축키 추가
   - ARCHITECTURE.md: status-bar 모듈, text-utils.js, CSS 15개 모듈 업데이트
   - ROADMAP.md: 상태바 완료 반영, 신규 완료 항목 추가
   - README.md: 상태바, Ctrl+/, 내장 플러그인 11종 업데이트
   - DEVELOPMENT_GUIDE.md: CSS 15개, 모듈 20개 업데이트

### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/modules/status-bar/status-bar.js` | **신규** - 상태바 모듈 |
| `src/styles/status-bar.css` | **신규** - 상태바 CSS (토글 스위치 포함) |
| `src/core/text-utils.js` | **신규** - 공유 텍스트 유틸리티 |
| `index.html` | 상태바 HTML, 토글 체크박스 추가 |
| `src/main.js` | status-bar 모듈 import + init |
| `src/i18n.js` | 상태바 관련 번역 키 추가 |
| `src/styles/index.css` | status-bar.css import 추가 |
| `src/styles/base.css` | #content bottom: 28px 조정 |
| `src/modules/toc/toc.css` | bottom: 28px 조정 |
| `src/modules/editor/editor.css` | bottom: 28px 조정 |
| `src/modules/viewer/viewer.css` | 인쇄 시 상태바 숨김 |
| `src/modules/editor/editor-manager.js` | 저장 버튼 에디터 모드 전용 |
| `src/plugins/word-counter/index.js` | v1.1.0 전면 개선 |
| `src/plugins/word-counter/plugin.json` | 버전 1.1.0, countMode 기본값 변경 |
| `src/plugins/reading-time/index.js` | tab:switched 이벤트 추가 |
| `src/modules/plugins/plugin-ui.css` | 설정 폼 스크롤 수정 |
| `src/modules/plugins/plugin-ui.js` | range 슬라이더 실시간 값 표시 |
| `src/modules/markdown/renderer.js` | lastCtx 캐싱으로 페이징 수정 |
| `src/modules/ui/ui.css` | 뷰 모드/에디터 모드 토글 스타일 |
| `src/modules/tabs/tab-manager.js` | TAB_SWITCHED 이벤트 emit |
| `src/modules/shortcuts/shortcuts.js` | Ctrl+/ 상태바 토글 단축키 |

### 발생한 문제 및 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| 뷰 모드 활성화 스타일 미적용 | `#toolbar button` (ID 셀렉터)가 `.view-btn.active` 오버라이드 | `#toolbar .view-mode-group .view-btn.active` 사용 |
| 상태바와 Word Counter 카운팅 불일치 | 각각 독립적 카운팅 로직 | `text-utils.js` 공유 유틸리티 생성 |
| 페이지 네비게이션 실패 | `goToPage()`→`renderPages(contentEl)` 호출 시 ctx 누락 | `lastCtx` 모듈 변수로 ctx 캐싱 |
| 플러그인 설정 팝업 스크롤 안됨 | flex 컨테이너 내 overflow 미설정 | `flex: 1; overflow-y: auto; min-height: 0` |

### 커밋 정보
- `fa74776` feat: add status bar, fix plugins, improve UI toggle indicators

### 다음 세션 참고사항
- 문서 현행화 완료 상태
- 프로덕션 빌드 완료 (MSI + NSIS 인스톨러)

---

## 세션 2026-02-14

### 작업 내용
- Reading Time 플러그인 확인 (이전 세션에서 이미 구현됨, v1.1.0)
- 버전 범프: 1.5.1 → 1.5.2 (package.json, tauri.conf.json, Cargo.toml)
- CI 워크플로우 개선: `update-json` 잡에서 `browser_download_url` 대신 태그 기반 URL 직접 구성
  - draft 릴리스에서도 올바른 public URL 생성
  - macOS aarch64/x86_64 아키텍처별 분리 지원
  - sig 파일 다운로드 시 API 인증 헤더 사용

### 수정된 파일
| 파일 | 변경 내용 |
|------|----------|
| `package.json` | 버전 1.5.1 → 1.5.2 |
| `src-tauri/tauri.conf.json` | 버전 1.5.1 → 1.5.2 |
| `src-tauri/Cargo.toml` | 버전 1.5.1 → 1.5.2 |
| `.github/workflows/release.yml` | update-json URL 구성 방식 개선 |

### 커밋 정보
- (사용자 허가 대기)

### 다음 세션 참고사항
- v1.5.2 태그 푸시 후 CI 빌드 확인
- 릴리스 퍼블리시 후 latest.json URL 검증
- 로컬 v1.5.1 앱에서 v1.5.2 업데이트 감지 E2E 테스트
- Reading Time 플러그인 툴바 뱃지 확인

---

## 세션 2026-02-13

### 작업 내용
- GitHub Actions 릴리스 빌드 CI/CD 수정 (전일 실패 이어서 작업)
- 멀티플랫폼 빌드 완전 성공 (Windows, macOS ARM64/Intel, Linux)
- `latest.json` 자동 생성 및 업로드 파이프라인 구현
- GitHub 레포 public으로 전환 (자동 업데이트 에셋 다운로드 위해)

### 수정된 파일
- `.github/workflows/release.yml` - 전면 재작성
  - `npm run tauri build --` 구분자 추가 (macOS `--target` 인자 전달)
  - `targets: "all"` 설정으로 플랫폼별 번들 생성
  - `.nsis.zip` 패턴 제거 (Tauri 2는 `.exe` 직접 사용)
  - Linux: `.AppImage` + `.AppImage.sig` 패턴
  - `update-json` 잡: release ID로 draft 릴리스 접근, 올바른 아티팩트 매칭
  - `if: always()` 조건으로 일부 빌드 실패해도 `update-json` 실행
- `src-tauri/tauri.conf.json` - `bundle.targets: "all"`, 서명 키 공개키 업데이트

### 발생한 문제 및 해결
1. **macOS 빌드 실패**: `npm run tauri build --target aarch64-apple-darwin`에서 `--target`이 cargo에 전달됨 → `npm run tauri build -- --target` 로 수정
2. **Linux 아티팩트 미생성**: `targets: ["nsis"]`가 Linux에서 번들 생성 차단 → `targets: "all"` 로 수정
3. **`createUpdaterArtifacts: "v2"` 오류**: Tauri 2 스키마에서 `"v2"` 문자열 미지원 → `true` (boolean)로 유지
4. **`update-json` 404 오류**: draft 릴리스는 `releases/tags/{tag}` API로 접근 불가 → `releases/{id}` 로 수정
5. **`latest.json` 잘못된 URL**: draft 상태에서 생성된 URL이 `untagged-xxx` 형식 → 수동으로 올바른 URL로 재생성 후 업로드
6. **릴리스 에셋 다운로드 404**: 레포가 private이라 인증 없이 다운로드 불가 → 레포 public으로 전환

### 커밋 정보
- `fb7b776` fix: correct CI build for multi-platform release
- `0035ba6` fix: revert createUpdaterArtifacts to boolean, add debug listing
- `d65d452` fix: correct artifact patterns and update-json for Tauri 2

### 릴리스 상태
- v1.5.1 릴리스 퍼블리시 완료
- 에셋: exe, dmg(ARM64/Intel), AppImage, deb, app.tar.gz, latest.json
- `latest.json` 정상 접근 확인: `https://github.com/thewinmaker-fishwater/vexaMd/releases/latest/download/latest.json`

### 다음 세션 참고사항
- 로컬에서 자동 업데이트 테스트 필요: 버전 1.5.0으로 낮추고 → `npm run tauri dev` → 업데이트 감지 확인
- macOS tar.gz 파일이 arch 구분 없이 동일 이름 (`Vexa MD.app.tar.gz`) → 양 아키텍처 구분 필요 (향후 개선)
- `update-json` 스크립트의 URL 문제: draft 상태에서 생성된 URL이 publish 후 변경됨 → 워크플로우에서 URL 직접 구성하도록 개선 필요
- GitHub Secrets: `TAURI_SIGNING_PRIVATE_KEY` (vexa-md-v2.key), `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` ("vexa2026")

---

## 세션 2026-02-12

### 작업 내용

1. **자동 업데이트 시스템 구현**
   - Tauri 플러그인: `tauri-plugin-updater`, `tauri-plugin-process` 설치 및 등록
   - `tauri.conf.json`: `createUpdaterArtifacts`, `plugins.updater` (pubkey + endpoint) 설정
   - `capabilities/default.json`: `updater:default`, `process:allow-restart` 권한 추가
   - 프론트엔드: `src/modules/updater/updater.js` + `updater.css` 모듈 구현
   - 업데이트 모달 UI: 버전 정보, 릴리스 노트, 진행률 바, 업데이트/나중에/재시작 버튼
   - 도움말 메뉴에 "업데이트 확인" 항목 추가
   - 앱 시작 3초 후 자동 백그라운드 체크 (silent)
   - i18n 번역 12키 추가 (ko/en/ja)

2. **GitHub Actions 릴리스 워크플로우 업데이트**
   - 서명 환경변수 (`TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`) 추가

3. **GitHub Secrets 등록**
   - `TAURI_SIGNING_PRIVATE_KEY`: 서명 비밀키 등록
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: 빈 비밀번호 등록

4. **에러 처리 개선**
   - 릴리스가 없는 경우 (404) "업데이트 확인 실패" → "최신 버전입니다"로 개선

### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src-tauri/Cargo.toml` | `tauri-plugin-updater`, `tauri-plugin-process` 추가 |
| `src-tauri/src/lib.rs` | updater, process 플러그인 등록 |
| `src-tauri/tauri.conf.json` | `createUpdaterArtifacts`, `plugins.updater` 설정 |
| `src-tauri/capabilities/default.json` | updater, process 권한 추가 |
| `package.json` | JS 플러그인 의존성 추가 |
| `src/modules/updater/updater.js` | 신규 - 업데이트 확인/다운로드/UI 로직 |
| `src/modules/updater/updater.css` | 신규 - 업데이트 모달 스타일 |
| `src/styles/index.css` | updater.css import 추가 |
| `index.html` | 업데이트 모달 HTML, 도움말 메뉴 항목 추가 |
| `src/main.js` | updater 모듈 import, 시작 시 자동 체크, 메뉴 이벤트 |
| `src/i18n.js` | 12개 번역 키 추가 (ko/en/ja) |
| `.github/workflows/release.yml` | 서명 환경변수 추가 |

### 검증
- `npm run build` ✅ 성공
- `cargo check` ✅ 성공
- `npm run tauri dev` ✅ 앱 정상 실행
- 도움말 > "업데이트 확인" ✅ "최신 버전입니다" 토스트 표시

### 다음 세션 참고사항

#### CI/CD 릴리스 빌드 미해결 이슈 (v1.5.1 테스트 실패)
- **Windows**: `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` 시크릿 문제 - "Wrong password for that key"
  - `printf ''`로 재설정했지만 여전히 실패. 키 생성 시 비밀번호 유무 재확인 필요
  - 키 위치: `C:\Users\impeo\.tauri\vexa-md.key`
- **macOS/Linux**: 빌드는 성공하나 `tauri-action@v0`이 "No artifacts were found" 에러
  - productName에 공백("Vexa MD")이 원인일 수 있음
  - `tauri-action` 버전 업그레이드 또는 productName 변경 검토
- **워크플로우 수정 완료**: `dtolnay/rust-action` → `dtolnay/rust-toolchain`, NPM 버전 정렬 (2.9.x)
- **GitHub Secrets 등록 완료**: `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- **GitHub CLI 인증 완료**: `gh auth login` + `workflow` 스코프

#### 다음 단계
1. 서명 키 비밀번호 확인 (`npx tauri signer generate` 시 입력한 값)
2. CI/CD 빌드 문제 해결 후 릴리스 재시도
3. 로컬에서 v1.5.0 앱 실행 → v1.5.1 릴리스 업데이트 감지 E2E 테스트
4. 버전이 v1.5.0으로 원복된 상태 (로컬 커밋은 있으나 미푸시)

#### 현재 git 상태
- main 브랜치에 커밋됨 (미푸시): 자동 업데이트 구현 + 워크플로우 수정 + 버전 원복
- v1.5.1 태그가 원격에 남아있을 수 있음 → 삭제 필요

---

## 세션 2026-02-09

### 작업 내용

1. **홈탭 깜빡임 문제 해결**
   - 원인: `tauri-plugin-window-state`가 VISIBLE 상태 복원하여 `visible: false` 덮어씀
   - 해결: `StateFlags::VISIBLE` 제외 + CSS `opacity: 0` 안전장치 + `show_window` 커맨드
   - 커밋: `f3292a5`

2. **자동 업데이트 시스템 설계**
   - 설계 문서 작성: `docs/design/auto-update.md`
   - 서명 키 생성: `C:\Users\impeo\.tauri\vexa-md.key` (비밀번호 없음)
   - GitHub Releases + tauri-plugin-updater 방식 선택
   - 구현은 다음 세션에서 진행 예정

### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src-tauri/src/lib.rs` | `StateFlags::VISIBLE` 제외, `show_window` 커맨드 |
| `index.html` | body opacity:0 안전장치 |
| `src/main.js` | 준비 완료 후 opacity:1 + show_window |
| `docs/design/auto-update.md` | 자동 업데이트 설계 문서 (신규) |

### 커밋 정보
- `f3292a5` - feat: fix startup flicker and improve session restore

### 다음 세션 참고사항
- 자동 업데이트 구현 진행 (`docs/design/auto-update.md` 체크리스트 따라)
- GitHub Secrets 등록 필요: `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- 서명 키 위치: `C:\Users\impeo\.tauri\vexa-md.key`

---

## 세션 2026-02-04

### 작업 내용

1. **세션 복원 시 CLI 파일도 열기**
   - 이전: CLI 인자 있으면 세션 복원 건너뜀 → 이전 탭들 사라짐
   - 수정: 항상 세션 복원 먼저 → CLI 파일도 추가로 열기

2. **윈도우 상태 관리 플러그인 적용**
   - 수동 코드 60줄 제거 → `tauri-plugin-window-state` 플러그인 1줄로 대체
   - `dirs` 크레이트 의존성 제거

3. **초기 홈 콘텐츠 제거**
   - `index.html`에서 정적 welcome 콘텐츠 제거
   - JS가 동적으로 콘텐츠 결정

4. **프론트엔드 준비 완료 후 윈도우 표시 시도**
   - `show_window` Tauri 커맨드 추가
   - 세션 복원 완료 후 호출하여 윈도우 표시

### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src-tauri/Cargo.toml` | `tauri-plugin-window-state = "2"` 추가, `dirs` 제거 |
| `src-tauri/src/lib.rs` | 수동 윈도우 상태 코드 제거, 플러그인 등록, `show_window` 커맨드 추가 |
| `src-tauri/tauri.conf.json` | `visible: false` |
| `src/main.js` | 세션 복원 로직 수정, `show_window` 호출 |
| `src/modules/session/session.js` | renderTabs 호출 제거, switchToTab만 호출 |
| `index.html` | 초기 welcome 콘텐츠 제거 |

### ✅ 해결된 문제

**앱 시작 시 홈탭 깜빡임 문제 해결**

- 원인: `tauri-plugin-window-state`가 이전 세션의 `VISIBLE` 상태를 복원하여 `visible: false` 설정을 덮어씀
- 해결:
  1. `StateFlags::VISIBLE` 제외 - 플러그인이 visible 상태를 복원하지 않도록 설정
  2. CSS `opacity: 0` - body에 초기 투명 설정 (이중 안전장치)
  3. JS에서 세션 복원 완료 후 `opacity: 1` + `show_window` 호출

### 다음 세션 참고사항
- 앱 업데이트/패치 시스템 설계 (보류 중)

---

## 세션 2026-02-02

### 작업 내용

1. **탭 바 횡스크롤 및 방향 버튼 구현**
   - `#tabs-container`에 `overflow-x: auto` + 스크롤바 숨김
   - 좌우 방향 버튼(‹/›): 스크롤 가능 시 자동 표시, 클릭으로 200px 이동
   - 마우스 휠 횡스크롤: deltaY를 scrollLeft로 변환
   - ResizeObserver로 윈도우 크기 변경 시 버튼 상태 업데이트
   - 탭 전환 시 활성 탭 scrollIntoView 자동 스크롤

2. **탭별 콘텐츠 스크롤 위치 저장/복원**
   - 탭 전환 시 현재 탭의 `scrollTop` 저장
   - 새 탭 활성화 시 저장된 `scrollTop` 복원
   - 홈 탭도 별도 변수로 스크롤 위치 관리

### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/modules/tabs/tabs.css` | `#tabs-container` overflow/스크롤바 숨김, `.tab` flex-shrink:0, `.tab-scroll-btn` 스타일 |
| `src/modules/tabs/tab-manager.js` | `initScrollButtons()`, `updateScrollButtons()`, 휠/스크롤 이벤트, 탭별 scrollTop 저장/복원 |

### 발생한 문제

| 문제 | 원인 | 해결 |
|------|------|------|
| 탭 전환 시 다른 탭도 같은 위치로 스크롤됨 | 모든 탭이 `#content` 하나를 공유하여 scrollTop 미저장 | 탭 객체에 `scrollTop` 속성 추가, 전환 시 저장/복원 |

### 검증
- `npm run tauri dev` ✅ 정상 동작 확인
- 탭 10개 이상 열어 횡스크롤 확인
- 좌우 버튼, 마우스 휠, 탭별 스크롤 위치 모두 정상

### 커밋 정보
- (아래 참조)

### 다음 세션 참고사항
- 앱 업데이트/패치 시스템 설계 검토 예정 (Tauri updater 플러그인, 알림 방식 vs 자동 패치 등)
- 현재 프로젝트의 빌드/번들 설정, 버전 관리 구조 파악 필요

---

## 세션 2026-02-01

### 작업 내용

1. **내장 플러그인 8종 구현**
   - `reading-time` v1.1.0: 예상 읽기 시간 표시 (한국어 500CPM, CJK 400CPM, Latin/Cyrillic 200WPM 3그룹 언어 감지)
   - `auto-toc-insert`: `[TOC]` 마커 위치에 목차 자동 생성, 설정 가능한 최대 깊이
   - `image-zoom`: 이미지 클릭 시 라이트박스 확대, 배경 투명도 설정
   - `footnote`: `[^id]` 각주 문법 렌더링, 백링크 지원
   - `copy-as-html`: 렌더링된 마크다운을 HTML로 클립보드 복사 (툴바 버튼)
   - `emoji-replace`: `:shortcode:` → 이모지 변환 (~150개 매핑)
   - `external-link-icon`: 외부 링크에 SVG 아이콘 표시
   - `highlight-search`: 키워드 영구 하이라이팅 (쉼표 구분, 색상/대소문자 설정)

2. **플러그인 등록**
   - `plugin-manager.js`에 8개 플러그인 lazy loader + manifest path 등록
   - 각 플러그인 `plugin.json` 매니페스트 (i18n: ko/en/ja)

### 수정/생성된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/plugins/reading-time/index.js` | 신규 - 읽기 시간 플러그인 (3그룹 언어 감지) |
| `src/plugins/reading-time/plugin.json` | 신규 - 매니페스트 |
| `src/plugins/auto-toc-insert/index.js` | 신규 - TOC 삽입 플러그인 |
| `src/plugins/auto-toc-insert/plugin.json` | 신규 - 매니페스트 |
| `src/plugins/image-zoom/index.js` | 신규 - 이미지 확대 플러그인 |
| `src/plugins/image-zoom/plugin.json` | 신규 - 매니페스트 |
| `src/plugins/footnote/index.js` | 신규 - 각주 플러그인 |
| `src/plugins/footnote/plugin.json` | 신규 - 매니페스트 |
| `src/plugins/copy-as-html/index.js` | 신규 - HTML 복사 플러그인 |
| `src/plugins/copy-as-html/plugin.json` | 신규 - 매니페스트 |
| `src/plugins/emoji-replace/index.js` | 신규 - 이모지 변환 플러그인 |
| `src/plugins/emoji-replace/plugin.json` | 신규 - 매니페스트 |
| `src/plugins/external-link-icon/index.js` | 신규 - 외부 링크 아이콘 플러그인 |
| `src/plugins/external-link-icon/plugin.json` | 신규 - 매니페스트 |
| `src/plugins/highlight-search/index.js` | 신규 - 키워드 하이라이팅 플러그인 |
| `src/plugins/highlight-search/plugin.json` | 신규 - 매니페스트 |
| `src/core/plugin-manager.js` | 8개 플러그인 등록 (builtInPlugins, builtInManifestPaths) |

### 발생한 문제
- 없음. `npm run build` 및 `npm run tauri dev` 성공 확인.

### 커밋 정보
- (아래 참조)

### 다음 세션 참고사항
- 각 플러그인 개별 수동 테스트 필요 (설정 변경, 활성화/비활성화)
- reading-time 정확도 검증 (실제 문서로 비교)

---

## 세션 2026-01-31 (4차)

### 작업 내용

1. **VMD 키 관리 보안 강화**
   - 키 삭제 시 해당 키로 열린 VMD 탭 자동 닫기 (콘텐츠 보호)
   - 삭제 확인 다이얼로그에 탭 닫힘 경고 메시지 추가
   - `buildVmdCtx()`에 `closeTabsByKeyName` 콜백 추가

2. **키 입력 안정성 개선**
   - hex 입력 시 `0x` prefix, 공백, 보이지 않는 문자 자동 제거
   - padStart/substring 제거 → 정확히 64자 hex만 허용
   - 저장된 키로 복호화 실패 시 키 입력 모달로 폴백

3. **키 관리 UI 개선**
   - 키 목록에 스크롤 추가 (`max-height: 300px`)
   - `.vmd-key-body` overflow 정리

### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/main.js` | `closeTabsByKeyName` 콜백 추가 |
| `src/modules/vmd/vmd-key-ui.js` | 키 삭제→탭 닫기, hex 입력 정규화, 삭제 경고 메시지 |
| `src/modules/vmd/vmd-key-ui.css` | 키 목록 스크롤, body overflow 정리 |
| `src/modules/vmd/vmd.js` | 복호화 실패 시 키 입력 모달 폴백 |
| `src/i18n.js` | 삭제 확인 메시지에 탭 닫힘 경고 추가 |

### 커밋 정보
- (아래 참조)

### 다음 세션 참고사항
- 플러그인 시스템 Phase 2 변경사항 별도 커밋 필요

---

## 세션 2026-01-31 (3차)

### 작업 내용

1. **VMD 암호화 키 관리 시스템 구현**
   - Rust 백엔드: v2 파일 포맷(키 이름 헤더), `write_vmd`/`read_vmd` 키 파라미터 추가, `read_vmd_info`, `generate_random_key` 커맨드
   - 키 선택 모달 (내보내기 시): 기본키/사용자키 선택
   - 키 입력 모달 (열기 시): 미등록 키 파일에 대해 키 값 입력
   - 키 관리 모달: 키 생성/편집/삭제/복사, 기본키 지정, 내보내기/가져오기
   - 키 정보 표시: 탭 뱃지 + 뷰어 배너
   - 세션 복원 시 키 자동 매칭
   - i18n 번역 (ko/en/ja)

2. **UX 개선**
   - 키 생성 영역을 목록 상단으로 이동
   - hex 입력 readonly + "키생성" 버튼으로만 변경
   - 키 삭제 시 테마 적용된 커스텀 확인 다이얼로그
   - 키 내보내기: Blob URL → Tauri dialogSave + write_file로 변경
   - 키 가져오기 시 이름+키값 기준 중복 체크
   - "내장키"로 용어 통일 (기본키/내장키 혼용 제거)
   - 내보내기 모달에서 "랜덤 키 생성" 옵션 제거 (키 관리에서만 생성)
   - 키 입력 시 hex 길이 유연화 (64자 미만 패딩, 초과 트림)

### 수정/생성된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src-tauri/Cargo.toml` | `hex = "0.4"` 의존성 추가 |
| `src-tauri/src/lib.rs` | v2 포맷 write_vmd/read_vmd, read_vmd_info, generate_random_key |
| `src/modules/vmd/vmd-key-ui.js` | 신규 - 키 선택/입력/관리 모달 UI |
| `src/modules/vmd/vmd-key-ui.css` | 신규 - 키 UI 스타일 + 커스텀 확인 다이얼로그 |
| `src/modules/vmd/vmd.js` | 키 선택/입력 흐름 추가 |
| `src/i18n.js` | VMD 키 관련 번역 30+ 키 추가 (ko/en/ja) |
| `src/main.js` | 키 배너, 키 관리 버튼 연결 |
| `src/modules/session/session.js` | VMD 복원 시 키 매칭 |
| `src/modules/tabs/tab-manager.js` | 탭 키 뱃지 표시 |
| `src/modules/tabs/tabs.css` | 탭 잠금 아이콘, 키 뱃지 스타일 |
| `src/styles/index.css` | vmd-key-ui.css import |
| `index.html` | 키 관리 메뉴 버튼 |
| `docs/FEATURES.md` | VMD 암호화 키 관리 문서 추가 |

### 커밋 정보
- (아래 참조)

### 다음 세션 참고사항
- 디버그 콘솔 로그 제거 필요 (vmd.js, vmd-key-ui.js의 `[VMD]`, `[VMD-KEY]` 로그)

---

## 세션 2026-01-31 (2차)

### 작업 내용

1. **플러그인 시스템 Phase 2 전체 구현**
   - Step 1: plugin.json 매니페스트 지원 (`loadBuiltInManifest`, `validateManifest`, `mergeManifestMetadata`)
   - Step 2: 고급 설정 폼 타입 (select, color, textarea, range + i18n label 해석)
   - Step 3: 플러그인 설치/제거 UX (`scanPluginDirectory`, `installFromFolder`, Tauri dialog, 배지)
   - Step 4: 플러그인 에러 UI (에러 저장, 재시도, 붉은 테두리 카드, 스택 트레이스 확장)
   - Step 5: 문서 전면 보강 (plugin-development.md 재작성, plugin-user-guide.md 신규, template 플러그인, FEATURES.md/ARCHITECTURE.md 업데이트)

### 수정/생성된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/core/plugin-manager.js` | 대폭 수정 - manifest 로딩/검증, 외부 플러그인 스캔/설치/제거, 에러 추적/재시도 |
| `src/modules/plugins/plugin-ui.js` | 대폭 수정 - 스키마 기반 설정 폼, 설치/제거 UI, 에러 카드 |
| `src/modules/plugins/plugin-ui.css` | 스타일 추가 - 컬러 피커, textarea, range, 에러 UI, 설치/제거 버튼 |
| `src/core/events.js` | `PLUGIN_INSTALLED`, `PLUGIN_SCAN_COMPLETE` 이벤트 추가 |
| `src/i18n.js` | 14개 번역 키 추가 (ko/en/ja) |
| `src/plugins/mermaid/plugin.json` | settings 스키마 형식으로 업데이트 |
| `src/plugins/template/plugin.json` | 신규 - 템플릿 매니페스트 (4가지 설정 타입 예시) |
| `src/plugins/template/index.js` | 신규 - 주석 포함 템플릿 플러그인 클래스 |
| `docs/plugin-development.md` | 전면 재작성 - 튜토리얼 스타일 개발 가이드 |
| `docs/plugin-user-guide.md` | 신규 - 사용자 대상 설치/관리 가이드 |
| `docs/FEATURES.md` | Phase 2 플러그인 기능 섹션 추가 |
| `docs/ARCHITECTURE.md` | 플러그인 시스템 섹션 업데이트 |

### 발생한 문제
- 없음. `npm run build` 성공 확인 (13.59s).

### 커밋 정보
- 미커밋 (사용자 허가 대기)

### 다음 세션 참고사항
- `npm run tauri dev`로 수동 테스트 필요: 플러그인 설정 폼, 설치/제거 UX, 에러 UI, 재시도
- 외부 플러그인 테스트: `{appDataDir}/plugins/`에 테스트 폴더 생성 후 스캔 확인
- 의도적 에러 플러그인으로 에러 카드 렌더링 검증

---

## 세션 2026-01-31

### 작업 내용

1. **main.js 추가 축소 리팩토링 (626줄 → 341줄)**
   - `updateUITexts()` → `src/modules/ui/ui-texts.js` 추출 (~176줄)
   - 에디터 함수 그룹 → `src/modules/editor/editor-manager.js` 추출 (~70줄)
   - `getWelcomeHTML()` → `src/modules/welcome/welcome.js` 추출 (~18줄)
   - CSS 애니메이션 → `src/styles/animations.css` 이동 (~12줄)
   - 미사용 import 제거 (`showNotification`, `showError`, `hideToc`, `markdownEditor`)

### 수정/생성된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/main.js` | 626줄→341줄, 4개 모듈 추출 후 import로 교체 |
| `src/modules/ui/ui-texts.js` | 신규 - i18n 기반 UI 텍스트 업데이트 |
| `src/modules/editor/editor-manager.js` | 신규 - 에디터 모드/입력/저장 관리 |
| `src/modules/welcome/welcome.js` | 신규 - 웰컴 화면 HTML 생성 |
| `src/styles/animations.css` | 신규 - slideIn/slideOut 애니메이션 |
| `src/styles/index.css` | animations.css @import 추가 |
| `docs/ARCHITECTURE.md` | 구조 업데이트 (새 모듈, CSS, 줄 수) |

### 발생한 문제
- 없음. 빌드(`npm run build`) 성공 확인.

### 커밋 정보
- 미커밋 (사용자 허가 대기)

### 다음 세션 참고사항
- `npm run tauri dev`로 기능 테스트 필요: 언어 전환, 에디터 모드, 웰컴 화면, 알림 애니메이션
- 기존 `editor.js` stub 파일은 하위 호환을 위해 유지 (추후 제거 가능)

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

## 세션 2026-01-30 (2차)

### 작업 내용

1. **세션 복원 기능**
   - 앱 종료 후 재실행 시 이전에 열었던 탭들 자동 복원
   - 마지막 활성 탭도 복원, 삭제된 파일은 자동 건너뛰기
   - CLI 인자로 파일을 열면 세션 복원 대신 해당 파일 열기
   - `localStorage`에 `openTabs`, `activeTabPath` 저장

2. **윈도우 크기/위치 기억**
   - 앱 종료 시 윈도우 위치(x,y), 크기(w,h), 최대화 여부를 Rust 측에서 저장
   - 다음 실행 시 동일 위치/크기로 복원
   - 저장 위치: `%APPDATA%/com.vexa-md/window-state.json`
   - 깜빡임 방지: 숨기기 → 복원 → 표시 순서로 처리

3. **읽기전용 포맷 (.vmd) - AES-256-GCM 암호화**
   - 도구 > "읽기전용 내보내기" 버튼으로 `.vmd` 파일 생성
   - Rust AES-256-GCM 암호화로 외부에서 읽기 불가
   - 파일 구조: MAGIC(4바이트) + NONCE(12바이트) + 암호화 데이터
   - `.vmd` 열기 시 읽기전용 모드 (편집/분할 버튼 비활성화, 🔒 아이콘)
   - 파일 열기 다이얼로그, 드래그앤드롭 모두 `.vmd` 지원

4. **VMD → MD 내보내기**
   - 읽기전용 탭에서 도구 > "MD로 내보내기"로 Markdown 파일로 변환
   - 탭 상태에 따라 내보내기 메뉴 자동 활성화/비활성화

### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/main.js` | 세션 저장/복원, VMD 내보내기/열기, 읽기전용 탭, 내보내기 버튼 활성화 관리 |
| `src-tauri/src/lib.rs` | 윈도우 상태 저장/복원, AES-256 암호화/복호화 커맨드, `.vmd` 확장자 지원 |
| `src-tauri/Cargo.toml` | `dirs`, `aes-gcm`, `rand` 의존성 추가 |
| `src-tauri/tauri.conf.json` | `.vmd` 파일 연결 추가 예정 |
| `index.html` | "읽기전용 내보내기", "MD로 내보내기" 버튼 추가 |
| `src/i18n.js` | VMD 관련 번역 추가 (한/영/일) |
| `src/modules/ui/ui.css` | 드롭다운 버튼 disabled 스타일 추가 |

### 발생한 문제 및 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| 파일 읽기 실패 에러 | `loadFile`에서 `.vmd`를 `read_file`로 읽으려 함 (바이너리 파일) | `.vmd` 분기를 `read_file` 호출 전으로 이동 |
| `on_window_event` 타입 불일치 | `Window` vs `WebviewWindow` 타입 차이 | 각각 별도 함수로 분리 |
| 윈도우 위치 이동 깜빡임 | `visible: true`로 기본 위치에 먼저 표시됨 | setup에서 hide → restore → show 순서 처리 |
| CLI 인자 중복 처리 | Rust 이벤트 + JS 직접 호출 중복 | Rust 쪽 이벤트 발송 제거, JS에서 직접 처리 |

---

## 세션 2026-01-30 (3차)

### 작업 내용

1. **main.js 모듈 분리 대규모 리팩토링**
   - `src/main.js` 3,780줄 → ~626줄 오케스트레이터로 축소
   - 13개 독립 모듈로 기능 추출
   - `init(context)` 패턴으로 모듈 간 통신
   - 기존 미사용 dead code 모듈 12개 삭제

2. **추출된 모듈 (13개)**
   | 모듈 | 파일 | 내용 |
   |------|------|------|
   | notification | `notification/notification.js` | showNotification, showError |
   | image-modal | `image-modal/image-modal.js` | 이미지 모달 열기/닫기/줌/드래그 |
   | print | `print/print.js` | printDocument, exportPdf |
   | presentation | `presentation/presentation-mode.js` | 프레젠테이션 시작/종료/네비게이션 |
   | renderer | `markdown/renderer.js` | marked 설정, renderMarkdown, renderPages |
   | search | `search/search-manager.js` | 검색 수행/하이라이트/네비게이션 |
   | tabs | `tabs/tab-manager.js` | createTab, switchToTab, closeTab, renderTabs |
   | zoom | `zoom/zoom-manager.js` | setViewMode, setZoom, zoomIn/Out/Reset, pan |
   | file-ops | `files/file-ops.js` | openFile, loadFile, dragDrop, fileWatcher, recentFiles |
   | session | `session/session.js` | saveSession, restoreSession |
   | vmd | `vmd/vmd.js` | exportVmd, exportVmdToMd, loadVmdFile |
   | theme | `theme/theme-system.js` | 테마 적용/에디터/임포트/내보내기 (~700줄) |
   | shortcuts | `shortcuts/shortcuts.js` | 키보드 단축키, 링크 핸들러, 코드 복사 |

3. **삭제된 미사용 파일 (12개)**
   - `tabs/tabs.js`, `files/file-handler.js`, `files/recent-files.js`, `files/drag-drop.js`
   - `search/search.js`, `viewer/markdown.js`, `viewer/presentation.js`
   - `ui/settings.js`, `ui/help-menu.js`, `ui/keyboard.js`, `ui/zoom.js`, `ui/view-mode.js`
   - `theme/theme-editor.js`, `theme/theme-manager.js`

4. **버그 수정**
   - `editor.js`가 삭제된 `tabs.js` import → stub으로 교체
   - `renderer.js`, `theme-system.js`의 `require()` → ES `import`로 교체

### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/main.js` | 3,780줄 → ~626줄 오케스트레이터로 재작성 |
| `src/modules/notification/notification.js` | 신규 - 알림/에러 표시 |
| `src/modules/image-modal/image-modal.js` | 신규 - 이미지 모달 |
| `src/modules/print/print.js` | 신규 - 인쇄/PDF |
| `src/modules/presentation/presentation-mode.js` | 신규 - 프레젠테이션 |
| `src/modules/markdown/renderer.js` | 신규 - 마크다운 렌더링 |
| `src/modules/search/search-manager.js` | 신규 - 검색 |
| `src/modules/tabs/tab-manager.js` | 신규 - 탭 관리 |
| `src/modules/zoom/zoom-manager.js` | 신규 - 줌/뷰모드 |
| `src/modules/files/file-ops.js` | 신규 - 파일 열기/드래그/워처 |
| `src/modules/session/session.js` | 신규 - 세션 저장/복원 |
| `src/modules/vmd/vmd.js` | 신규 - VMD 내보내기/열기 |
| `src/modules/theme/theme-system.js` | 신규 - 테마 시스템 전체 |
| `src/modules/shortcuts/shortcuts.js` | 신규 - 키보드 단축키 |
| `src/modules/editor/editor.js` | stub으로 재작성 |

### 발생한 문제 및 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| 빌드 에러: `tabs/tabs.js` 없음 | `editor.js`가 삭제된 파일 import | `editor.js`를 no-op stub으로 교체 |
| `require()` 런타임 에러 | ES 모듈에서 CommonJS `require()` 사용 | static `import`로 교체 |

### 검증
- `npm run build` ✅ 성공
- `npm run tauri dev` ✅ 앱 정상 기동

### 다음 세션 참고사항
- main.js에 여전히 `updateUITexts()` (~200줄), 에디터 함수 등이 남아있어 ~626줄
- 런타임 기능 테스트 (파일 열기, 탭, 검색, 테마, VMD, 세션 복원) 수동 검증 필요

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

*마지막 업데이트: 2026-02-20*
