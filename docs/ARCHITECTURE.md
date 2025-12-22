# ChilBong MD Viewer - 기술 아키텍처

## 기술 스택

### Frontend
- **Vite**: 빌드 도구
- **Vanilla JavaScript (ES Modules)**: UI 및 로직
- **marked.js**: 마크다운 파싱

### Backend
- **Tauri 2.0**: 데스크톱 앱 프레임워크
- **Rust**: 네이티브 기능 (파일 읽기/쓰기)

---

## 프로젝트 구조

```
C:\workspace-mdView\
├── src/
│   ├── main.js          # 메인 JavaScript 로직
│   └── style.css         # 전체 스타일시트
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs        # Tauri 커맨드 정의
│   │   └── main.rs       # 앱 엔트리포인트
│   ├── capabilities/
│   │   └── default.json  # 권한 설정
│   ├── Cargo.toml        # Rust 의존성
│   └── tauri.conf.json   # Tauri 설정
├── index.html            # 메인 HTML
├── package.json          # npm 의존성
└── vite.config.js        # Vite 설정
```

---

## 주요 파일 설명

### index.html
- 툴바, 탭바, 검색바, 콘텐츠 영역
- 테마 커스터마이저 모달
- 드롭 오버레이

### src/main.js
- 앱 초기화 및 이벤트 핸들러
- 마크다운 렌더링 (marked.js)
- 테마 시스템 로직
- 탭 관리
- 검색 기능
- 드래그 앤 드롭
- 키보드 단축키

### src/style.css
- CSS 변수 기반 테마 시스템
- 라이트/다크 모드
- 6개의 컬러 테마 정의
- 마크다운 렌더링 스타일
- 반응형 및 인쇄 스타일

### src-tauri/src/lib.rs
- `read_file`: 파일 읽기 커맨드
- `write_file`: 파일 쓰기 커맨드
- `get_cli_args`: CLI 인자 처리

---

## 테마 시스템 구조

### CSS 변수
```css
:root {
  --bg: #ffffff;
  --text: #1f2328;
  --accent: #656d76;
  --border: #d0d7de;
  --code-bg: #f6f8fa;
  --toolbar-bg: #f6f8fa;
  /* ... */
}
```

### 테마 적용 방식
1. `data-theme` 속성: 라이트/다크
2. `data-color` 속성: 컬러 테마 (purple, ocean 등)
3. `<style id="custom-theme-styles">`: 커스텀 스타일

### 커스텀 테마 저장
```javascript
// localStorage에 저장
localStorage.setItem('customStyles', JSON.stringify(styles));

// 저장 형식
{
  bg: '#ffffff',
  text: '#1f2328',
  accent: '#8b5cf6',
  // ... 모든 커스텀 속성
}
```

---

## Tauri 권한 설정

### capabilities/default.json
```json
{
  "permissions": [
    "core:default",
    "dialog:default",
    "dialog:allow-open",
    "dialog:allow-save",
    "fs:default",
    "fs:allow-read",
    "fs:write-all",
    "fs:allow-download-write",
    "fs:allow-desktop-write",
    "fs:allow-document-write",
    "fs:allow-home-write"
  ]
}
```

---

## 플러그인

### 사용 중인 Tauri 플러그인
- `tauri-plugin-dialog`: 파일 열기/저장 다이얼로그
- `tauri-plugin-fs`: 파일 시스템 접근

---

## 빌드 및 실행

### 개발 모드
```bash
npm run tauri dev
```

### 프로덕션 빌드
```bash
npm run tauri build
```

### 요구사항
- Node.js 18+
- Rust (rustup)
- Windows 10/11
