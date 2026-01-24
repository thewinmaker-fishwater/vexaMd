# 트러블슈팅 문서

이 디렉터리는 Vexa MD 개발 중 발생한 버그, 이슈, 에러와 그 해결 방법을 기록합니다.

## 문서 목록

| 문서 | 설명 | 상태 |
|------|------|------|
| [mermaid-split-mode.md](./mermaid-split-mode.md) | Mermaid 다이어그램 크기 및 분할 화면 레이아웃 문제 | 해결됨 |
| [mermaid-duplicate-rendering.md](./mermaid-duplicate-rendering.md) | Mermaid 다이어그램 중복 렌더링 | 해결됨 |
| [zoom-scrollbar-shrink.md](./zoom-scrollbar-shrink.md) | Zoom 시 스크롤바 축소 문제 | 해결됨 |
| [zoom-global-instead-of-per-tab.md](./zoom-global-instead-of-per-tab.md) | Zoom이 전역으로 적용되는 문제 | 해결됨 |

## 문서 작성 템플릿

새 트러블슈팅 문서 작성 시 다음 템플릿을 사용하세요:

```markdown
# [이슈 제목]

## 날짜
YYYY-MM-DD

## 증상
- 구체적인 문제 증상 설명
- 스크린샷이 있다면 첨부

## 원인 분석
- 문제의 근본 원인
- 로그나 디버깅 정보

## 해결 방법
- 수정 내용 설명
- 코드 변경 사항

## 관련 파일
- 수정된 파일 목록

## 테스트 방법
- 문제가 해결되었는지 확인하는 방법

## 참고
- 관련 링크나 추가 정보
```

## 분류

### CSS/레이아웃 관련
- [mermaid-split-mode.md](./mermaid-split-mode.md)
- [zoom-scrollbar-shrink.md](./zoom-scrollbar-shrink.md)

### 플러그인 관련
- [mermaid-duplicate-rendering.md](./mermaid-duplicate-rendering.md)

### Zoom/뷰어 관련
- [zoom-global-instead-of-per-tab.md](./zoom-global-instead-of-per-tab.md)

### Tauri/백엔드 관련
- (추가 예정)
