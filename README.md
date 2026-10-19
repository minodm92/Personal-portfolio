# Personal-portfolio

Quoti의 대형 타이포그래피, 고대비 컬러, 편집형 레이아웃 리듬을 참고해 개인 UI/UX 포트폴리오로 재해석한 정적 웹사이트입니다. 원본의 로고, 카피, 사진, 앱 화면은 복제하지 않았습니다.

## 실행

의존성이나 빌드 과정은 없습니다. 이 폴더에서 정적 서버를 실행하세요.

```powershell
python -m http.server 4173
```

브라우저에서 `http://localhost:4173`을 엽니다.

## 파일

- `index.html` — 포트폴리오 콘텐츠와 시맨틱 구조
- `portfolio-tokens.css` — 색상, 타입, 간격, 그리드, 모션 토큰
- `styles.css` — 섹션·컴포넌트·반응형 스타일
- `script.js` — 모바일 메뉴, 헤더 상태, 접근 가능한 스크롤 리빌
- `assets/hero-designer.png` — AI로 제작한 오리지널 히어로 이미지

## 공개 전 교체할 내용

- `hello@example.com`과 `mailto:` 주소
- LinkedIn·Behance의 `#` 링크
- Concept Case Study를 실제 프로젝트 정보와 이미지로 교체
- 자기소개, 역할, 프로젝트 연도 및 협업 가능 상태 확인

## 폰트 및 레퍼런스 라이선스

- `Switzer 500/600`은 개인·상업 사용이 허용된 Fontshare 공식 CDN 버전을 사용합니다.
- 상용 `Obviously Narrow Black`은 프로젝트에서 완전히 제거했습니다.
- 비슷한 좁은 디스플레이 인상의 무료 `Anton`을 Google Fonts 공식 CDN에서 사용합니다.
- Quoti의 로고, 카피, 사진, 앱 화면과 CSS/JS 코드는 프로젝트에 포함하지 않았습니다.
- 색상과 타이포그래피 이름은 공개 CSS에서 확인한 디자인 시스템 정보만 자체 토큰으로 재작성했습니다.

## 검증 기준

- Mobile-first: 320px 이상
- Tablet: 768px / Desktop: 1024px 이상
- 키보드 포커스, 모바일 메뉴 Escape 닫기
- `prefers-reduced-motion`에서 marquee·reveal 비활성화
- JavaScript 실패 시에도 콘텐츠 노출
