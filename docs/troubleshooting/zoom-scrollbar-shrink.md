# Zoom 시 스크롤바 축소 문제

## 증상
- 콘텐츠 축소(zoom out) 시 스크롤바까지 같이 축소됨
- 화면 전체가 작아지면서 레이아웃이 깨짐

## 원인
`src/modules/viewer/viewer.css`에서 `#content` 요소 전체에 `transform: scale()` 적용:

```css
/* 문제 코드 */
#content[data-zoom="75"] { transform: scale(0.75); }
```

`#content`는 스크롤 컨테이너이므로 스크롤바도 함께 축소됨.

## 해결 방법
내부 콘텐츠 래퍼(`.markdown-content-wrapper`)에만 transform 적용:

```css
/* 수정 후 */
#content[data-zoom="75"] > .markdown-content-wrapper,
#content[data-zoom="75"] > .double-scroll-view {
  transform: scale(0.75);
}
```

홈 화면(`.welcome`)은 zoom 대상에서 제외.

## 관련 파일
- `src/modules/viewer/viewer.css`

## 참고
- 커밋: c8f3396
