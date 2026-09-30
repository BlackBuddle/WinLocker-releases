# 보안 정책

## 지원하는 버전

보안 수정은 [최신 릴리스](https://github.com/BlackBuddle/WinLocker-releases/releases/latest)에만 반영합니다.
설치된 WinLocker는 자동 업데이트로 최신 릴리스를 받습니다.

## 취약점 신고

잠금 화면 우회, 로컬 비밀번호나 Google 재인증 우회, 자동 업데이트 변조처럼 보호를 무너뜨리는
문제는 **공개 이슈에 올리지 말고**
[비공개 취약점 신고](https://github.com/BlackBuddle/WinLocker-releases/security/advisories/new)로
알려 주세요. 신고 내용은 공개되지 않습니다.

신고에 다음을 담아 주시면 확인이 빨라집니다.

- WinLocker 버전(트레이 카드 → 상태·진단)
- Windows 버전
- 재현 순서와 영향

Ctrl+Alt+Del, 업데이트 중 약 1초, 비정상 종료 뒤 다음 로그온까지처럼 README의
[알려진 한계](README.md#알려진-한계)에 적힌 것은 이미 알고 있는 내용이라 따로 신고하지 않으셔도 됩니다.

## 배포 파일 확인

공식 배포처는 이 저장소의 Releases뿐입니다. 받은 zip의 SHA-256이 같은 릴리스의 `.sha256` 값과
같은지 확인하세요([설치](README.md#설치) 2단계). 해시가 다르거나 다른 곳에서 받은 파일은 실행하지
마세요. 변조된 배포물을 발견하면 위의 비공개 신고로 알려 주세요.

## English

Please report security issues privately through
[GitHub private vulnerability reporting](https://github.com/BlackBuddle/WinLocker-releases/security/advisories/new),
not through public issues. Only the latest release receives fixes. The only official downloads are
this repository's Releases; verify the zip's SHA-256 against the `.sha256` asset before running it.
