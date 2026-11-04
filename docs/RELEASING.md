# 공개와 커뮤니티 등록

## 현재 단계

GitHub 공개용 코드와 문서를 준비한 단계입니다. Obsidian 커뮤니티 디렉터리 제출은 별도 작업이며 아직 완료하지 않았습니다. 공개 저장소 운영과 커뮤니티 등록은 서로 다른 단계입니다.

## GitHub 릴리스

1. `manifest.json`, `package.json`, `versions.json`의 버전을 함께 갱신합니다.
2. `CHANGELOG.md`와 검증 범위를 갱신합니다.
3. `npm run package`를 실행합니다.
4. 개인 경로·노트·인증 정보가 공개 파일에 없는지 확인합니다.
5. GitHub 릴리스 태그를 manifest와 같은 버전으로 만듭니다. 예: `0.3.1` (`v0.3.1`이 아님).
6. `dist/ime-format-guard/main.js`, `dist/ime-format-guard/manifest.json`을 릴리스 파일로 첨부합니다.
7. 새 테스트 볼트에서 해당 릴리스 파일을 설치하고 기본 동작을 확인합니다.

소스와 배포 파일은 동일한 JavaScript입니다. CSS나 번들 빌드 산출물은 없습니다. CI는 검사만 수행하며 자동 공개·업로드를 하지 않습니다.

## Obsidian 커뮤니티 제출

현재 공식 절차는 다음과 같습니다.

1. 공개 GitHub 저장소와 릴리스 준비
2. Obsidian Community 계정 로그인 및 GitHub 계정 연결
3. 플러그인 제출 폼에 저장소 등록
4. 자동 검토 결과 확인 및 필요한 수정
5. 공개 상태와 앱 내 설치 가능 여부 확인

내부 API 사용, 호환성 범위, 다른 플러그인과의 상호작용은 제출 전에 다시 검토합니다. 저장소 공개가 Obsidian 승인이나 등록을 의미하지 않습니다.

공식 기준은 변경될 수 있으므로 제출 시점에 아래 문서를 다시 확인합니다.

- https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin
- https://docs.obsidian.md/community-directory/submission-requirements-for-plugins
- https://docs.obsidian.md/community-directory/developer-policies
