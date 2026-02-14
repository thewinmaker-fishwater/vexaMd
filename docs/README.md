# Vexa MD - 개발 문서

## 프로젝트 개요

**Vexa MD**는 Tauri 2.x + Vanilla JavaScript로 개발된 초경량 마크다운 뷰어입니다.

### 주요 특징
- 1초 미만의 빠른 렌더링 속도
- 다양한 컬러 테마 (6종) + 커스텀 테마 저장
- 다크/라이트 모드 지원
- 탭 기능으로 여러 파일 동시 열기 (세션 복원)
- 확대/축소 및 뷰 모드 (한 페이지/여러 페이지)
- 프레젠테이션 모드 (F5)
- 다국어 지원 (한국어/영어/일본어)
- 인쇄 및 PDF 내보내기
- 코드 문법 하이라이트 (180+ 언어)
- TOC 사이드바 (목차)
- 파일 자동 리로드 (외부 편집 감지)
- GitHub 스타일 Alert Box
- 마크다운 편집 기능 (View/Edit/Split 모드)
- 읽기전용 암호화 포맷 (.vmd, AES-256-GCM)
- 플러그인 시스템 (내장 9종 + 외부 설치)
- 자동 업데이트 (GitHub Releases 기반)
- 멀티플랫폼 (Windows, macOS, Linux)

---

## 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| 데스크톱 프레임워크 | Tauri | 2.x |
| 백엔드 | Rust | latest |
| 프론트엔드 빌드 | Vite | 5.4.x |
| 마크다운 파서 | marked.js | 12.x |
| 다이어그램 | Mermaid.js | 11.x |
| 코드 하이라이트 | highlight.js | 11.x |
| 언어 | JavaScript (ES6+) | - |
| 스타일링 | CSS3 (Custom Properties) | - |

---

## 프로젝트 구조

```
workspace-mdView/
├── src/                        # 프론트엔드 소스
│   ├── main.js                # 메인 오케스트레이터 (~341줄)
│   ├── i18n.js                # 다국어 번역 (ko/en/ja)
│   ├── core/                  # 핵심 시스템
│   │   ├── events.js          # 이벤트 버스
│   │   ├── store.js           # 상태 관리
│   │   ├── plugin.js          # Plugin 기본 클래스
│   │   ├── plugin-manager.js  # 플러그인 매니저
│   │   └── plugin-api.js      # 플러그인 API 팩토리
│   ├── modules/               # UI 모듈
│   │   ├── tabs/              # 탭 관리
│   │   ├── files/             # 파일 열기/드래그/워처
│   │   ├── markdown/          # 마크다운 렌더링
│   │   ├── editor/            # 에디터 모드
│   │   ├── search/            # 검색
│   │   ├── theme/             # 테마 시스템
│   │   ├── toc/               # 목차 사이드바
│   │   ├── zoom/              # 줌/뷰모드
│   │   ├── presentation/      # 프레젠테이션
│   │   ├── print/             # 인쇄/PDF
│   │   ├── vmd/               # VMD 암호화 파일
│   │   ├── session/           # 세션 저장/복원
│   │   ├── updater/           # 자동 업데이트
│   │   ├── plugins/           # 플러그인 설정 UI
│   │   ├── shortcuts/         # 키보드 단축키
│   │   ├── notification/      # 알림/에러 표시
│   │   ├── image-modal/       # 이미지 모달
│   │   ├── welcome/           # 웰컴 화면
│   │   └── ui/                # UI 텍스트, 공통 UI
│   ├── plugins/               # 내장 플러그인
│   │   ├── mermaid/           # Mermaid 다이어그램
│   │   ├── word-counter/      # 단어 수 카운터
│   │   ├── reading-time/      # 읽기 시간 추정
│   │   ├── auto-toc-insert/   # [TOC] 목차 삽입
│   │   ├── image-zoom/        # 이미지 확대
│   │   ├── footnote/          # 각주
│   │   ├── copy-as-html/      # HTML 복사
│   │   ├── emoji-replace/     # 이모지 변환
│   │   ├── external-link-icon/ # 외부 링크 아이콘
│   │   ├── highlight-search/  # 키워드 하이라이팅
│   │   └── template/          # 개발자 템플릿
│   └── styles/                # CSS 모듈
│       ├── index.css          # CSS 통합 import
│       ├── theme.css          # 테마 변수
│       ├── base.css           # 기본 레이아웃
│       ├── ui.css             # UI 컴포넌트
│       ├── tabs.css           # 탭 바
│       ├── viewer.css         # 마크다운 뷰어
│       ├── syntax.css         # 코드 하이라이트
│       ├── editor.css         # 에디터
│       └── ...                # 기타 모듈별 CSS
├── src-tauri/                 # Tauri 백엔드 (Rust)
│   ├── src/
│   │   ├── main.rs            # Rust 메인 (Windows)
│   │   └── lib.rs             # 커맨드, VMD 암호화, 윈도우 관리
│   ├── icons/                 # 앱 아이콘
│   ├── capabilities/          # 권한 설정
│   ├── Cargo.toml             # Rust 의존성
│   └── tauri.conf.json        # Tauri 설정 + 업데이터 설정
├── docs/                      # 문서
│   ├── troubleshooting/       # 트러블슈팅
│   └── design/                # 설계 문서
├── .github/workflows/         # CI/CD
│   └── release.yml            # 멀티플랫폼 릴리스 빌드
├── index.html                 # 메인 HTML
├── package.json               # npm 설정
└── vite.config.js             # Vite 설정
```

---

## 주요 기능 상세

### 1. 파일 관리
- **파일 열기**: `Ctrl+O` 또는 툴바 버튼
- **드래그 앤 드롭**: 파일을 창에 드래그하여 열기
- **CLI 인자**: `vexa-md.exe file.md`로 직접 열기
- **최근 파일**: 최대 10개 저장, 홈 화면에서 빠른 접근
- **파일 감시**: 외부 수정 시 자동 리로드

### 2. 탭 시스템
- 여러 파일을 탭으로 관리
- 홈 탭은 항상 첫 번째에 위치 (닫기 불가)
- `Ctrl+W`: 현재 탭 닫기, `Ctrl+Tab`: 다음 탭 이동
- 탭 횡스크롤 (좌우 방향 버튼, 마우스 휠)
- 탭별 콘텐츠 스크롤 위치 독립 저장/복원
- 세션 복원: 앱 재시작 시 이전 탭 자동 복원

### 3. 테마 시스템
- **라이트/다크 모드**: `Ctrl+D`로 전환
- **컬러 테마 6종**: 기본, 퍼플, 오션, 선셋, 포레스트, 로즈
- **커스텀 테마**: 테마 커스터마이저에서 세밀 조정
- **테마 프리셋**: 여러 커스텀 테마 이름 붙여 저장
- **내보내기/가져오기**: JSON 파일로 테마 공유

### 4. 마크다운 편집기
- **3가지 모드**: View (보기), Edit (편집), Split (분할 미리보기)
- **실시간 미리보기**: Split 모드에서 300ms 디바운스 즉시 반영
- **변경 감지**: 미저장 탭에 (dot) 표시, 닫기 시 확인 다이얼로그
- **`Ctrl+S`**: 저장

### 5. 읽기전용 포맷 (.vmd)
- **AES-256-GCM 암호화**: 마크다운을 암호화된 읽기전용 파일로 내보내기
- **암호화 키 관리**: 내장키 + 사용자 키 생성/편집/삭제/내보내기/가져오기
- **MD 변환**: VMD → MD 역변환 지원
- **키 자동 매칭**: 파일 헤더의 키 이름으로 저장된 키 자동 검색

### 6. 플러그인 시스템
- **내장 플러그인 9종**: Mermaid, 읽기 시간, 단어 수, 목차 삽입, 이미지 확대, 각주, HTML 복사, 이모지, 외부 링크 아이콘, 키워드 하이라이팅
- **외부 플러그인 설치**: 폴더 선택으로 설치, `{appDataDir}/plugins/` 자동 스캔
- **설정 UI**: 플러그인별 설정 폼 (매니페스트 기반)
- **개발자 템플릿**: `src/plugins/template/`

### 7. 자동 업데이트
- 앱 시작 시 자동 확인 (3초 후 백그라운드)
- 도움말 > "업데이트 확인"으로 수동 확인
- 다운로드 진행률 + 재시작 버튼
- minisign 서명 검증

### 8. 기타 기능
- **프레젠테이션**: F5로 슬라이드쇼 (`---` 기준 분할)
- **인쇄/PDF 내보내기**: Ctrl+P, A4 자동 맞춤
- **코드 하이라이트**: highlight.js 180+ 언어
- **TOC 사이드바**: Ctrl+Shift+T, 스크롤 스파이
- **GitHub Alert Box**: NOTE, TIP, IMPORTANT, WARNING, CAUTION
- **줌**: 50~200%, Pan 기능, 커서/손끌기 토글

---

## 키보드 단축키

| 단축키 | 기능 |
|--------|------|
| `Ctrl+O` | 파일 열기 |
| `Ctrl+S` | 저장 (편집 모드) |
| `Ctrl+D` | 다크/라이트 전환 |
| `Ctrl+P` | 인쇄 |
| `Ctrl+F` | 검색 |
| `Ctrl+W` | 현재 탭 닫기 |
| `Ctrl+Tab` | 다음 탭 |
| `Ctrl+Shift+T` | TOC 사이드바 토글 |
| `Ctrl++/-/0` | 확대/축소/리셋 |
| `F5` | 프레젠테이션 시작 |
| `Esc` | 프레젠테이션 종료 / 드롭다운 닫기 |

---

## 빌드 방법

### 사전 요구사항
- Node.js 18+
- Rust (rustup)
- Windows 10/11, macOS, 또는 Linux

### 개발 모드
```bash
npm install
npm run tauri dev
```

### 프로덕션 빌드
```bash
npm run tauri build
```

### 릴리스
[RELEASE_GUIDE.md](./RELEASE_GUIDE.md) 참조.

---

## 문서 구조

| 문서 | 설명 |
|------|------|
| [README.md](./README.md) | 이 문서 - 프로젝트 개요 |
| [FEATURES.md](./FEATURES.md) | 기능 상세 목록 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 기술 아키텍처 |
| [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) | 개발 가이드 |
| [ROADMAP.md](./ROADMAP.md) | 로드맵 |
| [RELEASE_GUIDE.md](./RELEASE_GUIDE.md) | 릴리스 가이드 |
| [plugin-development.md](./plugin-development.md) | 플러그인 개발 가이드 |
| [plugin-user-guide.md](./plugin-user-guide.md) | 플러그인 사용자 가이드 |
| [troubleshooting/](./troubleshooting/) | 트러블슈팅 문서 |
| [SESSION-LOG.md](./SESSION-LOG.md) | 세션 로그 및 개발 이력 |

---

## 문서 히스토리

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-14 | 전면 재작성: Vexa MD로 제품명 통일, 전체 기능 동기화 |
| 2026-01-25 | 플러그인 시스템 섹션 추가 |
| 2026-01-24 | 마크다운 편집기 섹션 추가 |
| 2026-01-22 | TOC 사이드바 섹션 추가 |
| 2025-12-26 | 초기 문서 작성 |

*마지막 업데이트: 2026-02-14*
