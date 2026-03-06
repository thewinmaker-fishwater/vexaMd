# TOC 사이드바 + 에디터 모드 레이아웃 겹침

## 증상
- TOC(목차) 사이드바를 열고 에디트/스플릿 모드로 전환하면 TOC와 에디터 영역이 겹쳐 보임
- TOC 아래에 에디터 텍스트가 깔림

## 원인
- `editor.css`에 `.toc-open` 클래스 기반 레이아웃 규칙이 정의되어 있었음
- 그러나 `toc.js`의 `updateTocVisibility()`에서 `#main-container`에 `toc-open` 클래스를 추가하지 않았음
- CSS 규칙이 적용되지 않아 `#editor-pane`이 `left: 0`에서 시작, TOC와 겹침

## 해결 방법
- `toc.js`의 `updateTocVisibility()`에서 TOC 표시 시 `mainContainer.classList.add('toc-open')` 추가
- TOC 숨김 시 `mainContainer.classList.remove('toc-open')` 추가
- `clearToc()`에서도 `toc-open` 클래스 제거

## 관련 파일
- `src/modules/toc/toc.js`
- `src/modules/editor/editor.css` (기존 CSS 규칙은 정상)

## 참고
- `editor.css`의 `.toc-open` 관련 규칙: `left: 280px`, `width: calc(50% - 140px)` 등
- TOC 사이드바 너비: 260px, 오프셋 280px (20px 여유)
