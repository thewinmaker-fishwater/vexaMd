# Mermaid 다이어그램 중복 렌더링

## 증상
- Mermaid 다이어그램이 동일하게 2번 렌더링됨
- Flowchart, Sequence 등 모든 다이어그램 유형에서 발생

## 원인
`src/plugins/mermaid/index.js`의 `init()` 함수에서 `renderMermaidBlocks()`가 여러 곳에서 호출됨:
1. `onAfterRender` 훅
2. `CONTENT_RENDERED` 이벤트 리스너
3. 기존 콘텐츠 처리

두 훅이 거의 동시에 실행되면서 `mermaid-wrapper` 클래스 체크가 race condition으로 인해 동작하지 않음.

## 해결 방법
`processingBlocks` Set을 추가하여 현재 처리 중인 블록을 추적:

```javascript
constructor(api) {
  super(api);
  this.mermaid = null;
  this.diagramCounter = 0;
  this.processingBlocks = new Set(); // 중복 렌더링 방지
}

async renderMermaidBlocks(container) {
  // ...
  for (const codeElement of codeBlocks) {
    // 중복 처리 방지
    const blockKey = codeElement.textContent.trim().substring(0, 50);
    if (this.processingBlocks.has(blockKey)) {
      continue;
    }
    this.processingBlocks.add(blockKey);

    // 렌더링 후 Set에서 제거
    this.processingBlocks.delete(blockKey);
  }
}
```

## 관련 파일
- `src/plugins/mermaid/index.js`

## 참고
- 커밋: c8f3396
