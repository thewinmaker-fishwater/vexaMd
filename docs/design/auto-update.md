# Vexa MD 자동 업데이트 시스템 구현 계획

## 개요

Vexa MD에 앱 내 자동 업데이트 기능을 추가한다. Tauri 2.0의 `tauri-plugin-updater`를 사용하여 GitHub Releases 기반으로 업데이트를 배포하고, 앱 시작 시 자동으로 새 버전을 확인한다.

## 선택된 방식

| 항목 | 방식 |
|------|------|
| **배포** | GitHub Releases (기존 워크플로우 확장) |
| **확인** | 앱 시작 시 자동 확인 + 수동 확인 메뉴 |
| **알림** | 모달 다이얼로그 (버전 정보 + 다운로드/건너뛰기) |

---

## 서명 키 정보 (2026-02-09 생성)

### 보안 모델 (비대칭 암호화)

공개키/비밀키 쌍을 이용한 서명 검증 방식이다.

| 키 | 용도 | 공개 여부 | 비고 |
|-----|------|----------|------|
| **공개키** (`.pub`) | 업데이트 서명 **검증** | 앱에 포함 OK | 사용자에게 배포해도 안전 |
| **비밀키** (`.key`) | 업데이트 서명 **생성** | 절대 비공개 | GitHub Secrets에만 저장 |

**업데이트 서명 검증 흐름:**
```
[빌드 서버 (GitHub Actions)]
  비밀키로 설치 파일 서명 → .sig 파일 생성
       ↓
[사용자 앱]
  업데이트 다운로드 → 앱에 내장된 공개키로 서명 검증
       ↓
  서명 일치 → 설치 진행
  서명 불일치 → 설치 거부 (변조된 파일)
```

**왜 공개키를 배포해도 안전한가?**
- 공개키로는 서명을 **검증**만 할 수 있고, **생성**할 수 없음
- 공격자가 공개키를 가지고 있어도 가짜 업데이트를 만들 수 없음
- 서명 생성에는 반드시 비밀키가 필요함

**비밀키 관리 주의사항:**
- Git 커밋 절대 금지
- 로컬 파일은 안전한 곳에 보관
- GitHub Secrets에만 등록하여 CI/CD에서 사용
- 비밀키를 분실하면 향후 업데이트 서명 불가 → 새 키 생성 필요

### 비밀키 보관 방법

**현재 보관 위치:**
1. **로컬 파일**: `C:\Users\impeo\.tauri\vexa-md.key`
2. **GitHub Secrets**: `TAURI_SIGNING_PRIVATE_KEY` (등록 예정)

**백업 추천 (분실 대비):**

GitHub Secrets에서는 값을 다시 꺼낼 수 없으므로(쓰기 전용) 별도 백업이 필요하다.

| 방법 | 난이도 | 안전도 | 설명 |
|------|--------|--------|------|
| **비밀번호 관리자** | 쉬움 | 높음 | Bitwarden(무료), 1Password 등 |
| **암호화된 클라우드** | 보통 | 보통 | Google Drive + 암호화 zip |
| **USB 드라이브** | 쉬움 | 높음 | 오프라인 보관 |

### 비밀번호 관리자 참고

비밀번호 관리자는 모든 비밀번호/키를 암호화해서 한 곳에 보관하는 프로그램이다.
마스터 비밀번호 하나만 기억하면 나머지는 프로그램이 관리한다.

**추천 서비스:**

| 서비스 | 가격 | 특징 |
|--------|------|------|
| **Bitwarden** | 무료 (유료 $10/년) | 오픈소스, CLI 도구, 초보 추천 |
| **1Password** | $2.99/월 | UI 최고, SSH 키 관리, 개발도구 연동 |
| **KeePass** | 완전 무료 | 오프라인 전용, 내 PC에만 저장 |

**Bitwarden 시작법 (무료, 5분):**
1. https://vault.bitwarden.com 에서 계정 생성
2. 브라우저 확장 프로그램 설치
3. "Secure Note" 항목으로 서명 키 저장

> **당장은 로컬 파일 + GitHub Secrets 등록만으로 충분하다.**
> 비밀번호 관리자는 나중에 시간 날 때 설정해도 된다.

### 키 파일 위치
| 파일 | 경로 | 비고 |
|------|------|------|
| **비밀키** | `C:\Users\impeo\.tauri\vexa-md.key` | 절대 커밋 금지! |
| **공개키** | `C:\Users\impeo\.tauri\vexa-md.key.pub` | tauri.conf.json에 등록 |

### 공개키 (tauri.conf.json용)
```
dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDY1MjE3NTA0NTMzNTVDNDYKUldSR1hEVlRCSFVoWlZFaThveW0xdkUxaEU1ejRVemtEelhCYXRaVEJRdXA2ZDl6WTl6ODN0ZHMK
```

### 비밀번호
- 없음 (빈 문자열)

### GitHub Secrets 등록 (미완료)

GitHub 리포지토리 → Settings → Secrets and variables → Actions에서:

| Secret 이름 | 값 | 상태 |
|-------------|-----|------|
| `TAURI_SIGNING_PRIVATE_KEY` | `C:\Users\impeo\.tauri\vexa-md.key` 파일 내용 전체 | 미등록 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 빈 문자열 | 미등록 |

---

## 구현 체크리스트

### 1단계: Tauri 플러그인 설치 및 설정
- [ ] `src-tauri/Cargo.toml`에 `tauri-plugin-updater = "2"`, `tauri-plugin-process = "2"` 추가
- [ ] `npm install @tauri-apps/plugin-updater @tauri-apps/plugin-process`
- [ ] `src-tauri/src/lib.rs`에 플러그인 등록
  ```rust
  .plugin(tauri_plugin_updater::Builder::new().build())
  .plugin(tauri_plugin_process::init())
  ```
- [ ] `src-tauri/tauri.conf.json` 수정
  ```json
  "bundle": { "createUpdaterArtifacts": true },
  "plugins": {
    "updater": {
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDY1MjE3NTA0NTMzNTVDNDYKUldSR1hEVlRCSFVoWlZFaThveW0xdkUxaEU1ejRVemtEelhCYXRaVEJRdXA2ZDl6WTl6ODN0ZHMK",
      "endpoints": ["https://github.com/thewinmaker-fishwater/vexaMd/releases/latest/download/latest.json"]
    }
  }
  ```
- [ ] `src-tauri/capabilities/default.json`에 `"updater:default"`, `"process:allow-restart"` 추가

### 2단계: 프론트엔드 업데이트 UI
- [ ] `src/modules/updater/updater.js` 생성
  - `checkForUpdate(silent)` - 업데이트 확인 (silent=true이면 에러 무시)
  - `showUpdateModal(version, notes)` - 업데이트 알림 모달 표시
  - 다운로드 진행률 콜백으로 프로그레스 바 업데이트
  - `relaunch()` 호출로 앱 재시작
- [ ] `src/styles/updater.css` 생성 (기존 about-modal 패턴 참고)
- [ ] `src/styles/index.css`에 updater.css import 추가
- [ ] `index.html`에 업데이트 모달 HTML 추가
  ```
  ┌─────────────────────────────┐
  │  업데이트 사용 가능           │
  │  현재 버전: 1.5.0 → 1.6.0   │
  │  [변경 내역]                 │
  │  ████████░░░░░ 60%          │
  │  [나중에]    [지금 업데이트]   │
  └─────────────────────────────┘
  ```
- [ ] `index.html` 도움말 메뉴(help-dropdown)에 "업데이트 확인" 항목 추가

### 3단계: main.js 통합
- [ ] updater 모듈 import
- [ ] 앱 시작 시 자동 확인: `show_window` 이후 3초 딜레이 → `checkForUpdate(true)`
- [ ] 도움말 > "업데이트 확인" 클릭 이벤트: `checkForUpdate(false)`
- [ ] 최신 버전일 때 "최신 버전입니다" 알림 표시

### 4단계: GitHub Actions 워크플로우 업데이트
- [ ] `.github/workflows/release.yml`에 서명 환경변수 추가
  ```yaml
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
  ```
- [ ] GitHub Secrets에 비밀키 등록 (수동 작업)

### 5단계: 검증
- [ ] `npm run tauri dev` → 도움말 > "업데이트 확인" → UI 동작 확인
- [ ] `npm run tauri build` → `.sig` 파일 생성 확인
- [ ] 네트워크 오프라인 시 에러 없이 조용히 실패하는지 확인
- [ ] 태그 푸시 → GitHub Release → `latest.json` 생성 확인
- [ ] 구버전 앱에서 자동 업데이트 감지 및 설치 테스트

---

## 수정 파일 목록

| 파일 | 변경 | 상태 |
|------|------|------|
| `src-tauri/Cargo.toml` | updater, process 플러그인 추가 | 수정 |
| `src-tauri/src/lib.rs` | 플러그인 등록 | 수정 |
| `src-tauri/tauri.conf.json` | updater 설정, createUpdaterArtifacts | 수정 |
| `src-tauri/capabilities/default.json` | updater, process 권한 | 수정 |
| `package.json` | JS 플러그인 의존성 | 수정 |
| `src/modules/updater/updater.js` | 업데이트 확인/다운로드/UI 로직 | **신규** |
| `src/styles/updater.css` | 업데이트 모달 스타일 | **신규** |
| `src/styles/index.css` | updater.css import | 수정 |
| `index.html` | 업데이트 모달, 도움말 메뉴 항목 | 수정 |
| `src/main.js` | updater 통합, 자동 체크, 메뉴 이벤트 | 수정 |
| `.github/workflows/release.yml` | 서명 환경변수 | 수정 |

---

## 업데이트 플로우

```
[앱 시작]
    │
    ├─→ 세션 복원 → 윈도우 표시
    │
    └─→ 3초 후 백그라운드 업데이트 확인
         │
         ├─ 업데이트 없음 → 아무것도 안 함
         │
         ├─ 업데이트 있음 → 모달 표시
         │       │
         │       ├─ "나중에" → 모달 닫기
         │       │
         │       └─ "지금 업데이트" → 다운로드 시작
         │               │
         │               ├─ 진행률 표시 (프로그레스 바)
         │               │
         │               └─ 완료 → "재시작" 버튼 → 앱 재시작
         │
         └─ 에러 → 조용히 무시 (로그만 출력)

[수동 확인 (도움말 > 업데이트 확인)]
    │
    ├─ 업데이트 있음 → 모달 표시
    │
    └─ 업데이트 없음 → "최신 버전입니다" 알림
```

---

## 검증 방법

1. `npm run tauri dev` → 도움말 > "업데이트 확인" → UI 동작 확인
2. `npm run tauri build` → `.sig` 파일 생성 확인
3. 네트워크 오프라인 → 에러 없이 조용히 실패
4. GitHub에 태그 푸시 → Release 생성 → `latest.json` 확인
5. 구버전 앱에서 자동 업데이트 감지 및 설치 테스트

---

## 참고 문서

- [Tauri 2.0 Updater Plugin](https://v2.tauri.app/plugin/updater/)
- [GitHub Actions Pipeline](https://v2.tauri.app/distribute/pipelines/github/)
- [Tauri Signer CLI](https://v2.tauri.app/reference/cli/)
