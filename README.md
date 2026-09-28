# WinLocker Releases

[BlackBuddle/WinLocker](https://github.com/BlackBuddle/WinLocker)의 배포용
릴리즈 자산(실행 파일, 체크섬)만 올라오는 저장소입니다. 소스 코드는 여기
없습니다 — WinLocker 자체의 자동 업데이트 기능이 이 저장소의 GitHub
Releases API를 조회해서 새 버전을 확인/다운로드합니다.

## 릴리즈 자산 구성

각 릴리즈(`vX.Y.Z` 태그)는 다음 두 자산을 포함해야 합니다:

- `WinLocker-win-x64.zip` — `dotnet publish` 출력(WinLocker.exe,
  WinLockerUpdater.exe 등)을 압축한 것
- `WinLocker-win-x64.zip.sha256` — 위 zip 파일의 SHA-256 해시값 한 줄
  (다른 내용 없이 16진수 해시 문자열만)

자동 업데이트 클라이언트가 이 두 파일 이름을 그대로 찾으므로, 릴리즈를
올릴 때 이름을 정확히 맞춰야 합니다.
