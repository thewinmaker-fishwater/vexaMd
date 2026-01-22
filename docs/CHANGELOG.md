# SP MD Viewer - 개발 이력

## 2026-01-23 여러 커스텀 테마 저장 기능

### 새 기능
- **커스텀 테마 저장/관리**: 여러 개의 커스텀 테마를 저장하고 관리
  - 테마 커스터마이저에 "저장된 테마" 탭 추가
  - 현재 테마 설정을 이름과 함께 저장
  - 저장된 테마 불러오기/삭제 기능
  - 컬러 테마 드롭다운에 저장된 테마 표시 (★ 표시)
  - localStorage에 영구 저장

- **CSS 편집 개선**:
  - 상세한 CSS 템플릿 제공 (모든 스타일 변수 포함)
  - UI 에디터/CSS 편집 탭별 독립 적용
  - CSS 편집 탭에서는 CSS만 직접 적용

### UI/UX 개선
- 저장된 테마 탭에서 미리보기/적용 버튼 숨김
- 라이트/다크 테마에서 저장된 테마 UI 가시성 개선

### 관련 파일
- `src/main.js`: 저장된 테마 관리 함수, 탭별 미리보기/적용 분리
- `src/style.css`: 저장된 테마 UI 스타일
- `src/i18n.js`: 저장된 테마 다국어 텍스트
- `index.html`: 저장된 테마 탭 패널, CSS 템플릿

---

## 2026-01-22 TOC 사이드바 기능 추가

### 새 기능
- **TOC (Table of Contents) 사이드바**: 마크다운 헤딩(h1~h6) 기반 목차 자동 생성
  - 툴바 버튼 또는 `Ctrl+Shift+T` 단축키로 토글
  - 클릭 시 해당 섹션으로 부드럽게 스크롤
  - 스크롤 스파이: 현재 보고 있는 섹션 하이라이트
  - 레벨별 들여쓰기로 계층 구조 표현
  - 탭별 TOC 상태 독립 관리
  - 다국어 지원 (한/영/일)

### 버그 수정
- **콜아웃 간격 문제**: 연속된 콜아웃(Alert Box) 사이 간격 추가 (`margin-top: 24px`)
- **favicon 404 에러**: `public/favicon.ico` 추가 및 index.html에 링크 명시

### 관련 파일
- `src/modules/toc/toc.js`: TOC 모듈 (신규)
- `src/style.css`: TOC 사이드바 스타일, 콜아웃 간격 수정
- `src/main.js`: TOC 통합, 탭별 상태 관리
- `src/i18n.js`: TOC 다국어 텍스트
- `index.html`: TOC UI 요소, favicon 링크
- `public/favicon.ico`: 파비콘 파일 (신규)

---

## 2026-01-22 싱글 인스턴스 버그 수정

### 문제 현상
- MD 파일 더블클릭 시 기존 앱에서 파일이 열리지 않고 "아무 반응 없음"

### 원인 분석

#### 빌드 후 직접 실행 vs 설치 후 실행의 차이

| 구분 | 빌드 후 직접 실행 | NSIS 설치 후 실행 |
|------|------------------|-------------------|
| 파일 연결 | 이전 설치 버전 가리킴 | 새 버전으로 업데이트됨 |
| 실행 경로 | `target/release/vexa-md.exe` | `C:/Users/.../AppData/.../vexa-md.exe` |
| 싱글 인스턴스 | 다른 경로의 앱과 충돌 가능 | 정상 동작 |

#### 핵심 원인: 창 Label 문제
```rust
// 이전 코드 (문제)
app.get_webview_window("main")  // "main" label 창을 찾음 → None 반환

// 수정 코드 (해결)
app.webview_windows().iter().next()  // 사용 가능한 첫 번째 창 사용
```

**Tauri 2.0에서 `tauri.conf.json`에 `label` 필드가 명시되지 않으면 기본 창 label이 "main"이 아닐 수 있음.**
`get_webview_window("main")`이 `None`을 반환하면:
- 창 포커스 실패
- 이벤트는 emit되지만 창이 활성화되지 않음
- 사용자 입장에서 "아무 반응 없음"

### 수정 내용

#### lib.rs 변경
```rust
// 모든 webview 창 가져오기
let windows = app.webview_windows();

// 첫 번째 창 사용 (label에 의존하지 않음)
if let Some((label, window)) = windows.iter().next() {
    if window.is_minimized().unwrap_or(false) {
        let _ = window.unminimize();
    }
    let _ = window.show();
    let _ = window.set_focus();
}
```

### 교훈

1. **테스트는 반드시 설치 후 진행**: 빌드 후 exe 직접 실행은 파일 연결, 레지스트리 등이 반영되지 않음
2. **하드코딩 피하기**: `"main"` 같은 고정 값 대신 동적으로 창을 찾는 방식 사용
3. **Tauri 2.0 마이그레이션 주의**: API 변경으로 인한 기본값 차이 확인 필요

### 관련 파일
- `src-tauri/src/lib.rs`: 싱글 인스턴스 콜백 수정

---

## 2026-01-13 일본어 지원 추가

### 주요 기능
- **다국어 확장**: 일본어 (日本語) 언어 지원 추가
- **완전한 번역**: 모든 UI 요소 일본어 번역 완료

### 관련 파일
- `src/i18n.js`: 일본어 (`ja`) 번역 추가
- `src/components/toolbar.js`: 언어 선택 드롭다운에 일본어 옵션 추가

---

## 2026-01-09 파일 시스템 감시

### 주요 기능
- **자동 리로드**: 열린 MD 파일이 외부에서 수정되면 자동으로 새로고침
- **실시간 감시**: Tauri `watchImmediate` API 사용
- **디바운싱**: 300ms 디바운스로 중복 이벤트 방지
- **탭 연동**: 탭 닫을 때 자동으로 감시 해제

### 기술적 구현
- **Tauri fs 플러그인**: `watch` 기능 활성화 (`Cargo.toml`)
- **스코프 권한**: 모든 경로 접근 허용 (`capabilities/default.json`)
- **이벤트 처리**: `handleFileChange()` 함수로 파일 변경 감지

### 관련 파일
- `src/main.js`:
  - `startWatching()`, `stopWatching()`, `handleFileChange()` 함수
  - `fileWatchers` Map으로 감시 상태 관리
- `src/i18n.js`: `fileReloaded` 번역 추가
- `src-tauri/Cargo.toml`: `tauri-plugin-fs` watch 기능 활성화
- `src-tauri/capabilities/default.json`: fs:scope 권한 추가

---

## 2026-01-08 UI/UX 개선

### 주요 기능

#### 1. 확대 시 Pan(드래그) 기능
- **동작**: 줌 레벨 100% 초과 시 마우스 드래그로 콘텐츠 이동 가능
- **커서 변경**: `grab` → `grabbing` 으로 시각적 피드백
- **스마트 감지**: 링크, 버튼 등 인터랙티브 요소에서는 드래그 비활성화

#### 2. 용지 자동 맞춤 인쇄
- **@page 규칙**: A4 용지 사이즈 및 여백 설정
- **줌 리셋**: 인쇄 시 자동으로 transform:none 적용
- **요소별 최적화**:
  - 코드 블록: 자동 줄바꿈 (pre-wrap)
  - 테이블: 자동 너비 조정 및 페이지 넘김 처리
  - 이미지: 최대 너비 100%로 자동 스케일
  - 제목: page-break-after: avoid

#### 3. GitHub 스타일 Alert Box (Callout)
- **지원 타입**:
  - `> [!NOTE]` - 참고 (파란색)
  - `> [!TIP]` - 팁 (초록색)
  - `> [!IMPORTANT]` - 중요 (보라색)
  - `> [!WARNING]` - 경고 (노란색)
  - `> [!CAUTION]` - 주의 (빨간색)
- **다국어 레이블**: 한국어/영어 자동 전환
- **다크모드 지원**: 테마별 배경색 조정
- **인쇄 최적화**: 색상 유지 및 페이지 넘김 방지

### 관련 파일
- `src/main.js`:
  - Pan 상태 변수 및 이벤트 핸들러
  - `processAlerts()` 함수 (GitHub alert 전처리)
  - `ALERT_TYPES` 정의
- `src/style.css`:
  - `.pan-enabled`, `.panning` 스타일
  - `.alert-box`, `.alert-note/tip/important/warning/caution` 스타일
  - `@media print` 개선

### 사용 예시
```markdown
> [!NOTE]
> 이것은 참고 사항입니다.

> [!WARNING]
> 주의가 필요한 내용입니다.
```

---

## 2026-01-06 싱글 인스턴스 구현

### 주요 기능
- **싱글 인스턴스 지원**: MD 파일 더블클릭 시 새 앱이 열리지 않고, 기존 앱의 새 탭으로 열림
- **기존 윈도우 활성화**: 새 인스턴스 시도 시 기존 창이 포커스됨

### 기술적 구현
- **프로세스 감지**: Windows `tasklist` 명령어로 중복 프로세스 체크
- **콘솔 창 숨김**: `CREATE_NO_WINDOW` 플래그 (0x08000000) 사용
- **IPC 통신**: 임시 파일 기반 파일 경로 전달 (`%TEMP%/vexa_md_open_files.txt`)
- **실시간 감지**: 백그라운드 스레드에서 500ms 폴링
- **이벤트 시스템**: Tauri `emit` → Frontend `listen` → `loadFile()`

### 시도했던 방법들 (실패)
1. tauri-plugin-single-instance - Windows에서 작동 안 함
2. TCP 소켓 IPC - 포트 바인딩 실패
3. Windows Named Mutex (CreateMutexA) - API 호환성 문제
4. fslock crate - 파일 락 실패
5. sysinfo crate - 앱 크래시 발생

### 관련 파일
- `src-tauri/src/lib.rs`: 싱글 인스턴스 로직
- `src-tauri/src/main.rs`: `vexa_md_lib::run()` 호출
- `src/main.js`: `open-files-from-instance` 이벤트 리스너

### 참고
- 상세 아키텍처: `docs/ARCHITECTURE.md` "싱글 인스턴스 구현" 섹션 참조

---

## 2025-12-29 모듈화 리팩토링

### 코드 구조 개선
- **main.js**: 2,138줄 → **172줄** (92% 감소)
- 19개 ES 모듈로 분리
- 전역 변수 20개 → Store 패턴으로 중앙 관리

### 새로운 아키텍처

#### Core 인프라 (`src/core/`)
- **store.js**: Observer 패턴 상태 관리
  - `store.subscribe(key, callback)` - 상태 변경 구독
  - `store.set(key, value)` - 상태 변경 + 자동 알림
  - localStorage 자동 영속화
- **events.js**: 이벤트 버스
  - `eventBus.on(event, callback)` - 이벤트 구독
  - `eventBus.emit(event, data)` - 이벤트 발생
  - 모듈 간 느슨한 결합
- **dom.js**: DOM 유틸리티 함수

#### 기능별 모듈 (`src/modules/`)
| 모듈 | 파일 | 역할 |
|------|------|------|
| theme | theme-manager.js, theme-editor.js | 테마 시스템 |
| tabs | tabs.js | 탭 관리 |
| search | search.js | 검색 기능 |
| viewer | markdown.js, presentation.js | 마크다운 렌더링 |
| files | file-handler.js, drag-drop.js, recent-files.js | 파일 처리 |
| ui | keyboard.js, view-mode.js, zoom.js, help-menu.js, settings.js | UI 컴포넌트 |

#### 유틸리티 (`src/utils/`)
- **helpers.js**: debounce, throttle, generateId, rgbToHex 등

### 개선 효과
- 각 모듈이 독립적으로 관리 가능
- 상태 변경 추적 용이
- 테스트 용이성 향상
- 코드 재사용성 증가

---

## 2025-12-26 v1.0.0 주요 업데이트

### 네이밍 변경
- **ChilBong MD Viewer → SP MD Viewer**로 제품명 변경
- Seven Peaks Software 브랜딩 적용

### 다국어 지원 (i18n)
- **한국어/영어 완전 지원**
- `src/i18n.js` 파일로 번역 데이터 분리
- 언어 전환 시 모든 UI 요소 동적 업데이트
- 툴바 드롭다운에서 언어 선택

### 프레젠테이션 모드
- **F5 키로 프레젠테이션 시작**
- 전체 화면 슬라이드쇼
- `---` 구분선 기준으로 페이지 분할
- 키보드 네비게이션 (←/→, Space, ESC)
- 하단 컨트롤 바 (마우스 호버 시 표시)

### 뷰 모드 개선
- **한 페이지 보기**: 전체 내용을 스크롤로 연속 보기
- **여러 페이지로 보기**: `---` 기준 페이징 + 페이지 네비게이션
- 페이지 번호 직접 입력하여 이동 가능
- `---` 파싱 개선 (Windows 줄바꿈 지원, 3개 이상 대시 지원)

### 도움말 메뉴
- 툴바에 도움말 버튼 추가
- **단축키**: 모든 키보드 단축키 안내 모달
- **프로그램 정보**: Seven Peaks 로고, 버전, 개발사 정보

### UI/UX 개선
- 탭 닫기(x) 버튼 디자인 개선
  - 호버 시 빨간색 배경
  - 클릭/호버 애니메이션
- 스크롤바 항상 오른쪽 끝 고정
- 검색 화살표 버튼 세련된 디자인

### 기타
- 라이선스: MIT → **Apache 2.0** 변경
- Seven Peaks 로고 적용 (`public/logo.jpg`)

---

## 2025-12-26 성능 최적화

### 초기 로딩 성능 개선
- **Tauri API 병렬 로드**: `Promise.all`을 사용하여 3개 모듈 동시 로드
  - 기존: 순차 로드 (약 55ms)
  - 개선: 병렬 로드 (약 32ms)
- **UI 우선 렌더링**: Tauri 초기화를 기다리지 않고 UI 먼저 표시
  - UI 초기화: ~1ms
  - Tauri 백그라운드 완료: ~32ms
- **비블로킹 초기화**: `initTauri().then()` 패턴으로 UI 블로킹 제거

### 성능 측정 코드 추가
- `[PERF]` 로그로 초기화 단계별 시간 측정 가능
- 기본 비활성화 (주석 처리), 필요시 활성화

### 개발자 도구
- Cargo.toml에 devtools feature 주석으로 안내
- 개발 시 F12 사용하려면 `features = ["tray-icon", "devtools"]`로 변경

---

## 이전 세션 작업 내용

### 검색 기능
- 문서 내 텍스트 검색 기능 구현
- 검색창 UI (탭 아래 콘텐츠 영역 상단)
- 실시간 하이라이트
- 이전/다음 결과 네비게이션
- Ctrl+F 단축키
- Esc로 검색창 닫기

### 테마 커스터마이저
- UI 에디터 탭: 색상, 글꼴 등 시각적 편집
- CSS 에디터 탭: 직접 CSS 편집

#### 편집 가능 섹션
1. **기본 색상**: 배경, 텍스트, 강조, 테두리
2. **글꼴**: 본문 글꼴, 줄 간격
3. **코드 블록**: 배경색, 텍스트 색상, 코드 글꼴
4. **인용문**: 배경색, 테두리 색상/두께
5. **테이블**: 헤더 배경/텍스트 색상, 테두리 반경
6. **제목**: H1/H2 색상, 그라데이션 옵션
7. **텍스트 마크**: 링크, 굵은글씨, 기울임, 하이라이트, 목록 마커
8. **툴바**: 툴바 배경 그라데이션, 탭바 배경

### 커스텀 테마 시스템
- 테마 콤보박스에 "커스텀" 옵션 추가
- 프리셋 테마 선택 시 해당 색상이 커스터마이저에 반영
- 커스터마이저에서 "적용" 시 커스텀 테마로 저장
- 다른 테마 선택 시 커스텀 스타일 일시 비활성화 (데이터 보존)
- "커스텀" 다시 선택 시 저장된 스타일 복원

### 테마 내보내기/가져오기
- JSON 형식으로 테마 내보내기
- 파일에서 테마 가져오기
- Tauri fs 권한 설정

### 버그 수정
- 테마 콤보박스 변경 시 색상 미적용 수정
- 커스텀→기본 변경 시 색상 미복원 수정
- 커스텀 모드에서 글씨 크기 변경 안됨 수정
- 테마 커스터마이저 취소 시 원래 상태 복원

---

## 테마 내보내기 형식

```json
{
  "version": "2.0",
  "app": "SP MD Viewer",
  "exportedAt": "2025-12-26T...",
  "baseTheme": "light",
  "colorTheme": "custom",
  "customStyles": {
    "bg": "#ffffff",
    "text": "#1f2328",
    "accent": "#656d76",
    ...
  },
  "generatedCss": "/* SP MD Viewer - Custom Theme */..."
}
```

---

## 향후 개선 가능 사항

> 상세 로드맵은 [ROADMAP.md](./ROADMAP.md) 참조
