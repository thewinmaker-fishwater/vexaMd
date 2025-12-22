# ChilBong MD Viewer - 개발 문서

## 프로젝트 개요

**ChilBong MD Viewer**는 Tauri 2.x + Vanilla JavaScript로 개발된 초경량 마크다운 뷰어입니다.

### 주요 특징
- 1초 미만의 빠른 렌더링 속도
- 1.1MB 크기의 초경량 설치 파일
- 다양한 컬러 테마 (6종)
- 다크/라이트 모드 지원
- 탭 기능으로 여러 파일 동시 열기
- 최근 파일 목록 관리
- 확대/축소 및 뷰 모드 (1페이지/2페이지)
- 인쇄 기능

---

## 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| 데스크톱 프레임워크 | Tauri | 2.x |
| 백엔드 | Rust | latest |
| 프론트엔드 빌드 | Vite | 5.4.x |
| 마크다운 파서 | marked.js | 12.x |
| 언어 | JavaScript (ES6+) | - |
| 스타일링 | CSS3 (Custom Properties) | - |

---

## 프로젝트 구조

```
C:\workspace-mdView\
├── docs/                    # 문서
├── dist/                    # 빌드 결과물 (Vite)
├── node_modules/            # npm 패키지
├── src/                     # 프론트엔드 소스
│   ├── main.js             # 메인 JavaScript
│   └── style.css           # 스타일시트
├── src-tauri/              # Tauri/Rust 소스
│   ├── src/
│   │   ├── main.rs         # Rust 메인 (Windows)
│   │   └── lib.rs          # Rust 라이브러리
│   ├── icons/              # 앱 아이콘
│   ├── capabilities/       # 권한 설정
│   ├── Cargo.toml          # Rust 의존성
│   └── tauri.conf.json     # Tauri 설정
├── index.html              # 메인 HTML
├── package.json            # npm 설정
└── vite.config.js          # Vite 설정
```

---

## 주요 기능 상세

### 1. 파일 관리
- **파일 열기**: `Ctrl+O` 또는 툴바 버튼
- **드래그 앤 드롭**: 파일을 창에 드래그하여 열기
- **CLI 인자**: `md-viewer.exe file.md`로 직접 열기
- **최근 파일**: 최대 10개 저장, 홈 화면에서 빠른 접근

### 2. 탭 시스템
- 여러 파일을 탭으로 관리
- 홈 탭은 항상 첫 번째에 위치 (닫기 불가)
- `Ctrl+W`: 현재 탭 닫기
- `Ctrl+Tab`: 다음 탭으로 이동

### 3. 테마 시스템
- **라이트/다크 모드**: `Ctrl+D`로 전환
- **컬러 테마 6종**:
  - 기본 (그레이)
  - 퍼플
  - 오션
  - 선셋
  - 포레스트
  - 로즈
- **테마 내보내기/가져오기**: JSON 파일로 저장/복원

### 4. 뷰 옵션
- **글씨 크기**: 작게 / 보통 / 크게 / 아주 크게
- **콘텐츠 너비**: 좁게(900px) / 보통(1200px) / 넓게(1600px) / 전체
- **뷰 모드**: 한 페이지 / 두 페이지 (2단 레이아웃)
- **확대/축소**: 50% ~ 200% (Ctrl+마우스 휠 지원)

### 5. 인쇄
- `Ctrl+P`로 인쇄
- 인쇄 시 UI 요소 자동 숨김
- 깔끔한 흑백 인쇄 스타일

---

## 키보드 단축키

| 단축키 | 기능 |
|--------|------|
| `Ctrl+O` | 파일 열기 |
| `Ctrl+D` | 다크/라이트 전환 |
| `Ctrl+P` | 인쇄 |
| `Ctrl+W` | 현재 탭 닫기 |
| `Ctrl+Tab` | 다음 탭 |
| `Ctrl++` | 확대 |
| `Ctrl+-` | 축소 |
| `Ctrl+0` | 원래 크기 |
| `Ctrl+E` | 테마 내보내기 |
| `Esc` | 홈으로 |

---

## 빌드 방법

### 사전 요구사항
- Node.js 18+
- Rust (rustup)
- Windows 10/11

### 개발 모드
```bash
npm install
npm run tauri dev
```

### 프로덕션 빌드
```bash
npm run tauri build
```

빌드 결과물:
- `src-tauri/target/release/md-viewer.exe` (실행 파일)
- `src-tauri/target/release/bundle/nsis/ChilBong MD Viewer_1.0.0_x64-setup.exe` (설치 파일)

---

## 설정 저장

모든 설정은 `localStorage`에 저장됩니다:

| 키 | 설명 | 기본값 |
|----|------|--------|
| `theme` | 라이트/다크 | `light` |
| `colorTheme` | 컬러 테마 | `default` |
| `fontSize` | 글씨 크기 | `medium` |
| `contentWidth` | 콘텐츠 너비 | `narrow` |
| `viewMode` | 뷰 모드 | `single` |
| `zoom` | 확대/축소 | `100` |
| `recentFiles` | 최근 파일 목록 | `[]` |

---

## 라이선스

MIT License
