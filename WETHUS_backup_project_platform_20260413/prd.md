Use Figma MCP to design directly in my connected Figma file so I can inspect and edit everything myself. Do not generate HTML first. Build the homepage as editable Figma layers, components, text styles, and color styles.

Project:
WETHUS

About the product:
WETHUS is a curated project network for teenagers. Users can start real projects, recruit teammates, and request mentors after the team starts moving. This is not a casual community. It should feel serious, bold, cinematic, youthful, premium, and execution-oriented.

Important working mode:
- Use the currently selected image in Figma as the homepage banner image.
- This image is a banner asset, not a small card image.
- Preserve its black-and-white cinematic mood.
- Because the image already contains embedded text, treat it like an editorial hero banner and avoid cluttering too much text directly on top of it.
- Create the design directly in Figma via MCP.
- Make it easy for me to inspect: use Auto Layout, components, local styles, clean layer naming, and a 12-column desktop grid.
- Create a new page or frame named: WETHUS / Home v1 / Orange

Canvas:
- Desktop only
- Width: 1440px
- High-fidelity landing page

Visual direction:
- Black-based premium editorial website
- Orange is the only accent family
- Most visible typography should be bold
- Strong contrast, strong hierarchy, restrained but memorable color usage
- Cinematic, premium, slightly rebellious, youth-culture energy
- Not cute, not pastel, not playful startup SaaS
- Avoid glassmorphism and overly soft generic cards
- Keep the layout sharp, premium, bold, and brandable

Typography:
- Use Pretendard Variable if available; otherwise SUIT Variable or Inter with Korean-compatible fallback
- Headline weights: 800–900
- Navigation / section titles / card titles / button labels: 700–800
- Supporting text: 500–600
- Overall rule: most visible text should feel bold and decisive

Color system:
Base:
- Background: #050505
- Surface: #101010
- Surface Alt: #181818
- Border: #2A2A2A
- Text Primary: #F5F5F5
- Text Secondary: #A3A3A3

Orange accents:
- Primary Orange: #FF6A00
- Bright Orange: #FF7E1A
- Deep Orange: #D94F00
- Orange Tint: #FF6A001A

Strict color rules:
- Orange is the main accent color family
- Do not use blue, yellow, green, or red as competing accents
- Use orange for CTA buttons, active navigation markers, lines, tags, chips, highlights, hover emphasis, and small glows
- Keep accent usage restrained and intentional
- The interface should still feel mostly black/white, with orange acting as a sharp identity signal
- Avoid making the whole page orange-heavy

Homepage structure:

1) Top Navigation
- Left: WETHUS wordmark
- Right: 탐색 / 프로젝트 시작하기 / 멘토 / 로그인 / Founder 신청
- Minimal, premium, dense, bold
- Add a subtle orange active underline or marker

2) Hero Banner Section
- Use the selected black-and-white banner image as a large full-width editorial banner near the top
- Width aligned to the main grid, but visually dominant
- Height around 420–520px
- Keep the silhouette and existing embedded phrase visually important
- Use a subtle dark overlay only if needed
- Add one restrained orange graphic gesture around the banner:
  for example a thin orange line, a corner frame, a bottom glow strip, or a small label
- Do not overcrowd the image with too much UI text
- Make the banner feel iconic and cinematic

3) Main Hero Copy Block (below or partially overlapping the banner in a refined way)
- Large Korean headline in very bold type:
  "실체 있는 청소년 프로젝트, 여기서 시작된다."
- Supporting copy:
  "창업, 영화, 정책 제안, 캠페인, 서비스 제작까지. 팀을 만들고 실행하고, 필요할 때 멘토와 연결되세요."
- Primary CTA:
  "프로젝트 시작하기"
- Secondary CTA:
  "프로젝트 탐색하기"
- Add 2 or 3 compact tags:
  "실행 중심 프로젝트" / "팀빌딩" / "멘토 연결"
- Use orange to make the CTA area feel memorable and premium

4) Featured Projects
- Bold section title
- Create 3 premium project cards
- Dark cards with strong structure
- Each card includes:
  - category chip
  - bold title
  - one-line summary
  - status
  - needed roles
- Example categories:
  Film / Startup / Policy / Campaign / App
- Use orange only as an accent for category chips, status indicators, borders, or action hints
- Cards should feel collectible and editorial, not social-media-like

5) How It Works
- 3-step section with strong bold numbers and decisive hierarchy
- Steps:
  1. Founder 신청
  2. 팀원 모집 및 합류
  3. 실행 후 멘토 요청
- Make this section visually graphic and premium
- Use orange lines, markers, or numeric emphasis
- Avoid bland icon-box layout

6) Mentor Layer Section
- Strong horizontal feature section or dark band
- Main line:
  "팀이 막히는 순간, 검수된 멘토에게 요청하세요."
- Supporting line:
  "멘토는 프로젝트를 대신 이끄는 사람이 아니라, 막힌 지점을 짚어주는 조력자입니다."
- Small note:
  "멘토는 팀 시작 후 요청 가능"
- Use restrained orange highlight treatment

7) Founder CTA Section
- Strong conversion block near the bottom
- Headline:
  "아이디어로 끝내지 말고, 팀으로 시작하세요."
- Subcopy:
  "실행 의지가 있는 프로젝트만 선별해 소개합니다."
- CTA:
  "Founder 신청하기"
- This section should have the strongest orange accent usage on the page
- Make it feel premium, not flashy

8) Footer
- Minimal, premium, dark
- Clean typography
- Keep brand consistency

Interaction styling to show visually:
- Buttons should feel dense, bold, and decisive
- Hover states should be expressed through orange shift, underline, border emphasis, glow edge, or chip transition
- No playful rounded-community vibe
- This should feel like a serious youth project platform

Banner image treatment notes:
- Respect the existing typography inside the image
- Do not fight with the image text by placing a huge competing headline directly over it
- Use the banner as a cinematic statement piece
- Place the main product headline either below the banner or in a controlled overlap area with strong spacing
- Keep the composition editorial and intentional

Component system to create in Figma:
- Buttons
- Nav items
- Category chips
- Project cards
- Section labels
- CTA block
- Banner container treatment

Figma organization rules:
- Name all sections clearly:
  Nav / Hero Banner / Hero Copy / Featured Projects / How It Works / Mentor / Founder CTA / Footer
- Use Auto Layout wherever possible
- Create local text styles and color styles
- Keep spacing clean and presentation-ready
- Everything must be editable in Figma

Final output:
- Build the homepage directly in Figma via MCP
- After finishing, tell me:
  1) page/frame name
  2) color styles used
  3) components created
  4) how the banner image was cropped and positioned

---

## 구현 요건 (웹 랜딩 페이지)

- **적용 일자**: PRD 동일 구조로 웹 구현 시
- **배너 이미지**: `KakaoTalk_20260315_235433990.png` — 흑백 시네마틱, 임베디드 문구 "To The Ultimate Journey" 유지. 배너 위에는 대형 헤드라인 겹치지 않음.
- **캔버스**: 데스크톱 1440px 기준, 컨테이너 1200px.
- **색상**: 주황은 스펙트럼/그라데이션 없이 단일 포인트 계열만 사용 (Primary #FF6A00, Bright #FF7E1A, Deep #D94F00). CTA·칩·액티브·라인 등에만 제한적으로 사용.
- **타이포**: Pretendard Variable, 헤드라인 800, 네비/섹션/카드/버튼 700–800, 서브텍스트 500–600. 가독되는 텍스트는 볼드체 위주.
- **배너 포인트**: 하단 4px 주황 스트립 + 좌상/우하 2px 주황 코너 프레임. 과하지 않게 한 가닥만.
- **파일**: `index.html`, `styles.css`, `script.js`. 랜딩 전용 정적 페이지.
- **Figma MCP 미사용 시**: 위 구조·컬러·타이포를 동일히 적용한 웹 페이지로 먼저 구현하고, 추후 Figma에서 동일 스펙으로 재구성 가능.