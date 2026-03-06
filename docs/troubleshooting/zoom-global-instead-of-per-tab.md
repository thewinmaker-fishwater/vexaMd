# Zoom이 전역으로 적용되는 문제

## 증상
- 탭 A에서 zoom 75%로 설정
- 탭 B로 전환해도 75%가 유지됨
- 모든 탭이 동일한 zoom 레벨 공유

## 원인
`src/main.js`의 `setZoom()` 함수가 zoom 레벨을 전역 변수(`currentZoom`)와 localStorage에만 저장:

```javascript
// 문제 코드
function setZoom(level) {
  currentZoom = nearest;
  localStorage.setItem('zoom', nearest.toString());
  // ...
}
```

## 해결 방법

### 1. 탭 객체에 zoom 속성 추가
```javascript
const tab = {
  id: tabId,
  name: name,
  // ...
  zoom: 100  // 탭별 zoom 레벨
};
```

### 2. setZoom에서 현재 탭에 저장
```javascript
function setZoom(level) {
  if (activeTabId === HOME_TAB_ID) return; // 홈은 zoom 불가

  const currentTab = tabs.find(t => t.id === activeTabId);
  if (currentTab) {
    currentTab.zoom = nearest;
  }
  // ...
}
```

### 3. 탭 전환 시 zoom 복원
```javascript
function applyTabZoom(tabId) {
  let zoom = 100;
  if (tabId !== HOME_TAB_ID) {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) zoom = tab.zoom || 100;
  }
  // zoom 적용
}

function switchToTab(tabId) {
  // ...
  applyTabZoom(tabId);
}
```

## 관련 파일
- `src/main.js` - `setZoom()`, `applyTabZoom()`, `switchToTab()`
- `src/modules/tabs/tabs.js` - 탭 zoom 속성

## 참고
- 홈 탭은 항상 100% (zoom 변경 불가)
- 커밋: c8f3396
