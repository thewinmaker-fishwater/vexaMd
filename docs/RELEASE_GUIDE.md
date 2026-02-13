# Vexa MD 릴리스 가이드

앱 업데이트 릴리스 시 따라야 하는 절차를 정리한 문서입니다.

---

## 릴리스 전체 흐름

```
1. 코드 변경 완료 + 빌드 검증
2. 버전 범프 (3개 파일)
3. 커밋 + 태그 생성 + 푸시
4. CI 빌드 완료 대기 (6개 잡)
5. draft 릴리스 → 퍼블리시
6. latest.json URL 검증
7. (선택) 로컬 업데이트 테스트
```

---

## 1. 빌드 검증

코드 변경이 끝나면 프론트엔드 빌드가 통과하는지 확인한다.

```bash
npm run build
```

Rust 쪽 변경이 있었다면 추가로:

```bash
cd src-tauri && cargo check
```

---

## 2. 버전 범프

**3개 파일**의 버전을 동일하게 올린다.

| 파일 | 필드 |
|------|------|
| `package.json` | `"version"` |
| `src-tauri/tauri.conf.json` | `"version"` |
| `src-tauri/Cargo.toml` | `version` ([package] 섹션) |

예시 (1.5.1 → 1.5.2):

```json
// package.json, tauri.conf.json
"version": "1.5.2"
```

```toml
# Cargo.toml
version = "1.5.2"
```

### 버전 규칙 (SemVer)

| 변경 유형 | 버전 증가 | 예시 |
|-----------|-----------|------|
| 버그 수정, 소규모 개선 | patch (x.y.**Z**) | 1.5.1 → 1.5.2 |
| 새 기능 추가 | minor (x.**Y**.0) | 1.5.2 → 1.6.0 |
| 호환성 깨지는 변경 | major (**X**.0.0) | 1.6.0 → 2.0.0 |

---

## 3. 커밋 + 태그 + 푸시

```bash
# 변경된 파일 스테이징
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml [기타 변경 파일]

# 커밋
git commit -m "feat: bump version to 1.5.2 and add ..."

# 태그 생성 (반드시 v 접두사)
git tag v1.5.2

# 푸시 (커밋 + 태그 동시)
git push origin main && git push origin v1.5.2
```

> **중요**: 태그는 반드시 `v` 접두사를 붙여야 CI가 트리거된다 (`v1.5.2`, `v2.0.0` 등).

---

## 4. CI 빌드 대기

태그 푸시 시 `.github/workflows/release.yml`이 자동 실행된다.

```bash
# 빌드 상태 확인
gh run list --limit 1

# 상세 확인
gh run view <run-id>
```

### CI 잡 구성 (총 6개)

| 잡 | 내용 | 예상 시간 |
|----|------|-----------|
| `create-release` | GitHub draft 릴리스 생성 | ~5s |
| `build (Windows)` | NSIS 설치파일 (.exe + .exe.sig) | ~8min |
| `build (macOS-ARM64)` | .dmg + .app.tar.gz + .sig | ~6min |
| `build (macOS-Intel)` | .dmg + .app.tar.gz + .sig | ~6min |
| `build (Linux)` | .deb + .AppImage + .AppImage.sig | ~6min |
| `update-json` | latest.json 생성 및 업로드 | ~10s |

전체 소요: **약 10분**

### 빌드 실패 시

```bash
# 실패한 잡의 로그 확인
gh run view <run-id> --log-failed
```

일반적인 실패 원인:
- **서명 키 오류**: GitHub Secrets의 `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` 확인
- **Rust 빌드 실패**: `cargo check` 로컬 확인 후 수정 커밋
- **프론트엔드 빌드 실패**: `npm run build` 로컬 확인

실패 후 수정 방법:
```bash
# 기존 태그 삭제
git tag -d v1.5.2
git push origin :refs/tags/v1.5.2

# draft 릴리스도 삭제
gh release delete v1.5.2 --yes

# 수정 후 다시 태그 + 푸시
git add . && git commit -m "fix: ..."
git tag v1.5.2
git push origin main && git push origin v1.5.2
```

---

## 5. 릴리스 퍼블리시

CI가 전부 성공하면 draft 릴리스를 퍼블리시한다.

```bash
# draft 목록 확인
gh release list

# 퍼블리시
gh release edit v1.5.2 --draft=false --latest
```

---

## 6. latest.json 검증

퍼블리시 후 업데이트 엔드포인트가 정상인지 확인한다.

```bash
curl -sL https://github.com/thewinmaker-fishwater/vexaMd/releases/latest/download/latest.json | python -m json.tool
```

확인 항목:
- `version`: 올바른 버전 번호
- 4개 플랫폼 (`windows-x86_64`, `linux-x86_64`, `darwin-aarch64`, `darwin-x86_64`) 존재
- 각 플랫폼의 `url`: `https://github.com/.../releases/download/v1.5.2/파일명` 형식
- 각 플랫폼의 `signature`: 비어있지 않음

---

## 7. (선택) 로컬 업데이트 테스트

실제 앱에서 업데이트 감지가 동작하는지 확인한다.

```bash
# 1. tauri.conf.json 버전을 이전 버전으로 임시 변경
#    예: "version": "1.5.1"

# 2. 앱 실행
npm run tauri dev

# 3. 확인 방법:
#    - 앱 시작 3초 후 업데이트 모달 자동 표시
#    - 또는 도움말 > "업데이트 확인" 클릭

# 4. 테스트 후 버전 원복 (중요!)
#    "version": "1.5.2"
```

> **주의**: 테스트 후 반드시 버전을 원복하고, 변경된 tauri.conf.json을 커밋하지 않는다.

---

## 릴리스 체크리스트

릴리스할 때마다 아래 체크리스트를 확인한다.

```
[ ] npm run build 성공
[ ] 3개 파일 버전 동일하게 범프
[ ] SESSION-LOG.md 업데이트
[ ] 커밋 메시지에 변경 내용 요약
[ ] 태그 v접두사 포함 (예: v1.5.2)
[ ] git push origin main + 태그 푸시
[ ] CI 6/6 잡 전부 성공
[ ] gh release edit --draft=false --latest
[ ] latest.json curl 검증 (버전, URL, 서명)
```

---

## GitHub Secrets 정보

CI 빌드에 필요한 시크릿 (Settings > Secrets and variables > Actions):

| Secret | 용도 |
|--------|------|
| `TAURI_SIGNING_PRIVATE_KEY` | 업데이트 서명용 비밀키 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 비밀키 비밀번호 |

서명 키 로컬 위치: `C:\Users\impeo\.tauri\vexa-md.key`

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `.github/workflows/release.yml` | CI 릴리스 워크플로우 |
| `src-tauri/tauri.conf.json` | 앱 버전 + 업데이터 설정 |
| `src/modules/updater/updater.js` | 프론트엔드 업데이트 UI |
| `docs/design/auto-update.md` | 자동 업데이트 설계 문서 |
