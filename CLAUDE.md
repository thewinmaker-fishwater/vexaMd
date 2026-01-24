# Vexa MD - 프로젝트 AI 지침

이 문서는 Claude Code가 Vexa MD 프로젝트에서 작업할 때 따라야 하는 지침입니다.

---

## 필수 문서 관리 규칙

### 1. 세션 로그 (SESSION-LOG.md)

**위치**: `docs/SESSION-LOG.md`

모든 세션에서 다음 정보를 기록해야 합니다:

```markdown
## 세션 [YYYY-MM-DD HH:MM]

### 작업 내용
- 수행한 작업 목록

### 수정된 파일
- 파일 경로와 변경 내용 요약

### 발생한 문제
- 문제 설명과 해결 방법 (또는 미해결 상태)

### 커밋 정보
- 커밋 메시지와 해시 (커밋한 경우)

### 다음 세션 참고사항
- 이어서 작업할 내용이나 주의사항
```

### 2. 트러블슈팅 문서 (troubleshooting/)

**위치**: `docs/troubleshooting/`

버그, 이슈, 에러가 발생하고 해결했을 때 문서화:

```markdown
# [이슈 제목]

## 증상
- 어떤 문제가 발생했는지

## 원인
- 문제의 근본 원인

## 해결 방법
- 어떻게 해결했는지

## 관련 파일
- 수정된 파일 목록

## 참고
- 추가 정보나 링크
```

### 3. 관련 문서 업데이트

사용자가 "문서 업데이트"를 요청하면, `docs/` 폴더의 모든 관련 문서를 검토하고 업데이트:

- `docs/README.md` - 프로젝트 개요
- `docs/FEATURES.md` - 기능 목록
- `docs/ARCHITECTURE.md` - 아키텍처 설명
- `docs/CHANGELOG.md` - 변경 이력
- `docs/DEVELOPMENT_GUIDE.md` - 개발 가이드
- `docs/ROADMAP.md` - 로드맵
- `docs/plugin-development.md` - 플러그인 개발 가이드
- `docs/troubleshooting/` - 트러블슈팅 문서

---

## 프로젝트 구조

```
workspace-mdView/
├── src/                    # 프론트엔드 소스
│   ├── core/              # 핵심 시스템 (plugin, events, store)
│   ├── modules/           # UI 모듈 (editor, viewer, theme 등)
│   ├── plugins/           # 내장 플러그인 (mermaid 등)
│   └── styles/            # CSS 스타일
├── src-tauri/             # Tauri 백엔드 (Rust)
├── docs/                  # 문서
│   ├── troubleshooting/   # 트러블슈팅 문서
│   └── images/            # 문서용 이미지
└── .claude/               # Claude Code 설정
```

---

## 개발 명령어

```bash
# 개발 서버 실행
npm run tauri dev

# 프로덕션 빌드
npm run tauri build

# Vite만 실행
npm run dev
```

---

## 알려진 이슈 및 해결책

트러블슈팅 문서 참조: `docs/troubleshooting/`

---

## Git 작업 규칙

1. **테스트 검증 필수**: 테스트 검증이 되지 않은 개발작업은 절대 커밋하지 않음
2. **사용자 허가 필수**: git 작업(commit, push 등)은 반드시 사용자 허가 후 진행
3. **세션 로그 업데이트**: 커밋 전 SESSION-LOG.md 업데이트

---

## CSS 모듈 구조

CSS는 모듈별로 분리되어 있으며 `src/styles/index.css`에서 통합:

1. theme.css - 테마 변수
2. base.css - 기본 레이아웃
3. ui.css - UI 컴포넌트
4. tabs.css - 탭 바
5. files.css - 파일 관리
6. search.css - 검색
7. viewer.css - 마크다운 뷰어
8. syntax.css - 코드 하이라이트
9. toc.css - 목차 사이드바
10. editor.css - 에디터
11. plugin-ui.css - 플러그인 UI

**주의**: CSS 우선순위와 선택자 특이성에 주의. 특히 `position` 속성 충돌에 유의.

---

## 플러그인 시스템

- 플러그인 기본 클래스: `src/core/plugin.js`
- 플러그인 매니저: `src/core/plugin-manager.js`
- 플러그인 API: `src/core/plugin-api.js`
- 내장 플러그인: `src/plugins/`

---

## 세션 시작 시 확인사항

1. `docs/SESSION-LOG.md` 읽어 이전 작업 컨텍스트 파악
2. `docs/troubleshooting/` 확인하여 알려진 이슈 인지
3. `git status`로 현재 상태 확인
