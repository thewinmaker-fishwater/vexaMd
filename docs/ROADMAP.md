# Vexa MD - 개발 로드맵

> 기능 구현 현황 및 계획 관리

---

## 완료된 기능

| 기능 | 완료일 | 관련 파일 |
|------|--------|-----------|
| 기본 마크다운 뷰어 | 2025-12 | main.js, markdown.js |
| 탭 시스템 | 2025-12 | tabs.js |
| 테마 시스템 (라이트/다크) | 2025-12 | theme-manager.js |
| 컬러 테마 (6종) | 2025-12 | theme-manager.js |
| 테마 커스터마이저 | 2025-12 | theme-editor.js |
| 테마 내보내기/가져오기 | 2025-12 | theme-editor.js |
| 검색 기능 | 2025-12 | search.js |
| 줌 기능 (50~200%) | 2025-12 | zoom.js |
| 뷰 모드 (한 페이지/여러 페이지) | 2025-12 | view-mode.js |
| 다국어 지원 (한/영/일) | 2025-12-26 | i18n.js |
| 프레젠테이션 모드 | 2025-12-26 | presentation.js |
| 도움말 메뉴 | 2025-12-26 | help-menu.js |
| 모듈화 리팩토링 | 2025-12-29 | core/, modules/ |
| 싱글 인스턴스 | 2026-01-06 | lib.rs |
| 확대 시 Pan 기능 | 2026-01-08 | main.js, style.css |
| 용지 자동 맞춤 인쇄 | 2026-01-08 | style.css |
| GitHub 스타일 Alert Box | 2026-01-08 | main.js, style.css |
| 파일 시스템 감시 (자동 리로드) | 2026-01-09 | main.js, Cargo.toml, capabilities |
| 이미지 확대 모달 | 2026-01-21 | main.js, style.css, index.html |
| TOC 사이드바 | 2026-01-22 | toc/toc.js, main.js, style.css, i18n.js |
| 여러 커스텀 테마 저장 | 2026-01-23 | main.js, style.css, index.html |
| 테마 프리셋 추가 | 2026-01-23 | main.js, style.css, index.html |
| 모듈별 CSS 분리 | 2026-01-24 | styles/, modules/*.css |
| PDF 내보내기 | 2026-01-24 | main.js, toolbar.js, icons.js, i18n.js |
| 코드 문법 하이라이트 | 2026-01-24 | main.js, markdown.js, syntax.css |
| 코드 블록 복사 버튼 | 2026-01-24 | main.js, markdown.js, syntax.css, i18n.js |
| 마크다운 편집 기능 | 2026-01-24 | editor/, main.js, index.html, i18n.js |
| 플러그인 시스템 (Phase 1) | 2026-01-25 | Plugin 클래스, PluginManager, PluginAPI, Mermaid 플러그인 |
| 툴바 드롭다운 그룹화 | 2026-01-26 | index.html, main.js, ui.css |
| 외부 링크 브라우저 열기 | 2026-01-30 | main.js, plugin-shell |
| 마크다운 앵커 링크 지원 | 2026-01-30 | main.js (GitHub slug) |
| 커서/손끌기 토글 | 2026-01-30 | index.html, main.js |
| 파일 삭제 시 탭 자동 닫기 | 2026-01-30 | main.js |
| 세션 복원 | 2026-01-30 | session/session.js |
| 윈도우 상태 기억 | 2026-01-30 | lib.rs, tauri-plugin-window-state |
| 읽기전용 포맷 (.vmd) AES-256 암호화 | 2026-01-30 | lib.rs, vmd/vmd.js |
| main.js 모듈 분리 리팩토링 | 2026-01-30 | 13개 모듈로 분리, main.js 3780→341줄 |
| 플러그인 시스템 (Phase 2) | 2026-01-31 | 매니페스트, 고급 설정 폼, 설치/제거, 에러 UI |
| VMD 암호화 키 관리 | 2026-01-31 | vmd-key-ui.js, lib.rs (v2 파일 포맷) |
| 내장 플러그인 8종 | 2026-02-01 | reading-time 외 7종 |
| 탭 바 횡스크롤 + 방향 버튼 | 2026-02-02 | tab-manager.js, tabs.css |
| 탭별 스크롤 위치 저장/복원 | 2026-02-02 | tab-manager.js |
| 윈도우 상태 플러그인 전환 | 2026-02-04 | lib.rs (tauri-plugin-window-state) |
| 홈탭 깜빡임 문제 해결 | 2026-02-09 | lib.rs (StateFlags::VISIBLE 제외) |
| 자동 업데이트 시스템 | 2026-02-12 | updater.js, updater.css, tauri-plugin-updater |
| GitHub Actions CI/CD 릴리스 파이프라인 | 2026-02-13 | release.yml |
| latest.json 자동 생성 | 2026-02-13 | release.yml (update-json 잡) |
| CI URL 구성 개선 (태그 기반) | 2026-02-14 | release.yml |

---

## 구현 예정

### 플러그인 시스템 (Phase 3)

| # | 기능 | 설명 | 난이도 |
|:-:|------|------|:------:|
| 1 | 보안/샌드박싱 강화 | 이벤트 화이트리스트, DOM 접근 제한, 기능 검증 | ⭐⭐⭐ |
| 2 | 플러그인 레지스트리/마켓 | 플러그인 검색/설치 UI, 버전 관리 | ⭐⭐⭐ |

### 배포/인프라

| # | 기능 | 설명 | 난이도 |
|:-:|------|------|:------:|
| 1 | Windows 코드 서명 | SmartScreen 경고 제거, 인증서 도입 | ⭐⭐ |
| ~~2~~ | ~~`create-release` 액션 deprecated 경고 수정~~ | ~~`set-output` → `$GITHUB_OUTPUT` 마이그레이션~~ | ✅ |
| ~~3~~ | ~~ARCHITECTURE.md / DEVELOPMENT_GUIDE.md 문서 동기화~~ | ~~현재 프로젝트 상태 반영~~ | ✅ |

### 기타

| # | 기능 | 설명 | 난이도 |
|:-:|------|------|:------:|
| - | 새 기능 제안 환영 | - | - |

---

## 버그/개선 사항

| 상태 | 내용 | 비고 |
|:----:|------|------|
| ✅ | ~~파일 더블클릭으로 열 때 최대화 창 크기 유지 안됨~~ | 2026-01-22 싱글 인스턴스 버그 수정으로 해결 |
| ✅ | ~~홈탭 깜빡임 (윈도우 상태 복원 시 VISIBLE 상태 충돌)~~ | 2026-02-09 StateFlags::VISIBLE 제외로 해결 |
| ✅ | ~~latest.json URL이 draft 릴리스에서 잘못 생성~~ | 2026-02-14 태그 기반 URL 직접 구성으로 해결 |
| ✅ | ~~`create-release` 액션 `set-output` deprecated 경고~~ | `actions/create-release@v1` → `gh api` + `$GITHUB_OUTPUT`로 마이그레이션 |

---

## 릴리스 히스토리

| 버전 | 날짜 | 주요 변경 |
|------|------|-----------|
| 1.0.0 | 2025-12-26 | 초기 릴리스 (뷰어, 탭, 테마, 검색, 줌, 다국어, 프레젠테이션) |
| 1.1.0 | 2025-12-29 | 모듈화 리팩토링 |
| 1.2.0 | 2026-01-06 | 싱글 인스턴스 |
| 1.3.0 | 2026-01-08 | Pan, 인쇄 개선, Alert Box |
| 1.4.0 | 2026-01-09 | 파일 시스템 감시 (자동 리로드) |
| 1.5.0 | 2026-01-17 | 이미지 확대 모달 |
| **1.5.1** | **2026-02-13** | **자동 업데이트 시스템, CI/CD 릴리스 파이프라인, 멀티플랫폼 빌드** |
| **1.5.2** | **2026-02-14** | **CI update-json URL 구성 개선, 자동 업데이트 검증 완료** |

> **참고**: 1.5.0 이전의 마이너 버전(1.6.0~1.17.0)은 개발 추적용 내부 번호였으며 실제 릴리스되지 않았습니다. 1.5.1부터 GitHub Releases를 통한 정식 릴리스 체계를 도입했습니다.

---

## 상태 범례

- ⭐ : 쉬움 (1-2시간)
- ⭐⭐ : 보통 (반나절)
- ⭐⭐⭐ : 어려움 (1일 이상)

---

## 문서 히스토리

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-14 | 전면 동기화: 누락된 기능 추가, Phase 2 완료 반영, 릴리스 히스토리 정리 |
| 2026-01-31 | 플러그인 시스템 완료 반영, main.js 추가 축소 추가 |
| 2026-01-30 | 외부 링크, 앵커 링크, 커서/손끌기, 파일 삭제 감지 추가 |
| 2026-01-26 | 툴바 드롭다운 그룹화 추가 |
| 2026-01-24 | 마크다운 편집 기능, PDF, 코드 하이라이트 추가 |
| 2026-01-23 | 테마 프리셋 기능 추가 |
| 2026-01-22 | TOC 사이드바 기능 추가 |

*마지막 업데이트: 2026-02-14*
