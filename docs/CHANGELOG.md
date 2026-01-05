# SP MD Viewer - 개발 이력

## 2025-01-06 싱글 인스턴스 구현

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

## 2024-12-29 모듈화 리팩토링

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

## 2024-12-26 v1.0.0 주요 업데이트

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

## 2024-12-26 성능 최적화

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
  "exportedAt": "2024-12-26T...",
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

1. ~~다국어 지원~~ ✅ 완료
2. ~~프레젠테이션 모드~~ ✅ 완료
3. ~~모듈화 리팩토링~~ ✅ 완료
4. 여러 커스텀 테마 저장 및 관리
5. 테마 프리셋 추가
6. 마크다운 편집 기능
7. 파일 시스템 감시 (자동 리로드)
8. 모듈별 CSS 분리
