# LifeOS

서버나 계정 없이 브라우저에서 바로 쓰는 개인 생활 대시보드입니다.

## 기능

- 오늘 대시보드
- 할 일 + 자동 우선순위 점수
- 7일 습관 트래커 + 연속 기록
- 메모 + 검색 + 고정
- 월별 지출 기록/분류
- 25분 집중 / 5분 휴식 타이머
- Ctrl/Cmd + K 빠른 실행
- 다크 모드
- JSON 백업 / 복원
- PWA 오프라인 캐시
- 모바일 반응형 UI

## 저장 방식

외부 DB를 사용하지 않습니다.

모든 사용자 데이터는 브라우저의 localStorage에만 저장됩니다.
백업이 필요하면 왼쪽 아래의 **내보내기** 버튼으로 JSON 파일을 저장할 수 있습니다.

## 실행

별도 빌드가 필요 없습니다.

```bash
python -m http.server 8080
```

그 다음 `http://localhost:8080` 으로 접속하면 됩니다.

## GitHub Pages

`.github/workflows/pages.yml` 이 포함되어 있습니다.

새 저장소에서는 GitHub가 Pages 사이트 생성 권한을 Actions 토큰에 주지 않기 때문에,
처음 한 번 저장소의 **Settings → Pages → Source: GitHub Actions** 를 선택해야 합니다.
그 뒤부터 main 브랜치에 push할 때 자동 배포됩니다.

## 구조

- `index.html` — 앱 셸
- `app.js` — 상태, 렌더링, 검색, 타이머, 백업 로직
- `styles.css` — 기본 레이아웃
- `components.css` — UI 컴포넌트
- `extras.css` — 차트/인터랙션
- `mobile.css` — 모바일 반응형
- `sw.js` — 오프라인 캐시
- `manifest.webmanifest` — 설치형 PWA 메타데이터

## License

MIT
