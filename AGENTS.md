# 포트폴리오 디자인 변경 지침

- 이 사이트의 종이 질감은 `styles.css`의 `--paper-background`와 `body`가 제공하는 공통 배경이다. 개별 콘텐츠에 같은 배경 이미지를 다시 올리지 않는다.
- Figma 디자인을 바꿀 때 기존 `data-*` 인터랙션 연결과 `assets/components/intro/intro.js`의 ScrollTrigger 타임라인을 먼저 확인한다. 장면의 시각 요소를 바꾸더라도 기본 프로필 → 종이 메모·고양이 등장 → 역스크롤 복귀 흐름을 유지한다.
- Intro의 두 디자인 상태는 `index.html`의 같은 `.intro-profile__canvas` 안에서 공유된다. 첫 장면의 노트·인물과 두 번째 장면의 종이 메모·테이프·고양이 위치를 각각 확인한다.
- Intro 수정 후 개발 서버를 실행하고 `node tools/verify-intro-interaction.mjs`로 두 상태와 역스크롤을 검증한다. 이어서 `npm.cmd run build`를 실행한다. 서버 주소가 5173이 아니면 `PORTFOLIO_URL` 환경 변수를 설정한다.
