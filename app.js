/* =========================================================
   프라나 (Prana) — 앱 동작
   ---------------------------------------------------------
   이 파일은 크게 네 부분으로 나뉘어 있어요.
   1) 설정 데이터 : 상태와 호흡법 정보 (여기만 고치면 새 상태 추가 가능)
   2) 화면 전환   : 여러 화면 중 하나만 보여주는 기능
   3) 각 화면     : 홈, 추천, 세션(호흡), 마무리 화면의 동작
   4) 앱 시작     : 버튼 연결
   ========================================================= */


/* =========================================================
   1) 설정 데이터
   ---------------------------------------------------------
   호흡 한 구간(phase)은 { type, seconds } 로 적어요.
     type: 'inhale'(들숨) / 'hold'(멈춤) / 'exhale'(날숨)
     seconds: 그 구간의 길이(초)
   여러 구간을 묶은 것이 한 "사이클"이고,
   stages 안의 각 묶음은 "이 사이클을 몇 번(repeat) 반복할지"를 뜻해요.
   새 상태를 추가하고 싶으면 아래 배열에 객체를 하나 더 넣으면 됩니다.
   ========================================================= */
/* ---------------------------------------------------------
   색상 팔레트 (style.css의 :root 색과 같은 값)
   SVG 일러스트 안에서도 쓰기 위해 자바스크립트에도 적어둬요.
   --------------------------------------------------------- */
const PALETTE = {
  cream: '#EFE5DC',     // 기본 배경
  ink: '#29230D',       // 기본 글자
  olive: '#493E16',     // 깊은 색, 머리카락
  coral: '#E4401E',     // 주요 버튼, 로고 포인트
  pink: '#E05573',      // 보조 포인트
  mustard: '#E8CC10',   // 밝은 포인트, 해와 달
  orange: '#E08538',    // 따뜻한 보조
  aqua: '#73C3C7',      // 차분한 색
  teal: '#16A9AC',      // 아쿠아의 진한 버전, 소량만
  skinLight: '#EEC7AB',
  skinMid: '#EAA275',
  skinDeep: '#AE5122',
};
const P = PALETTE; // 짧게 쓰기용 별명

const STATES = [
  {
    id: 'anxious',
    name: '불안·긴장',
    description: '마음이 조급할 때',
    illustration: 'anxious',      // 아래 ILLUSTRATIONS에서 쓸 그림 이름
    // 색 설정 (모두 단색). 글자/배경 조합은 명도 대비를 확인한 값이에요.
    colors: {
      main: P.aqua, text: P.ink,              // 상태 카드·추천 화면 배경과 글자 (메인)
      tile: P.teal,                           // 일러스트 타일 배경 (포인트)
      pillBg: P.ink, pillText: P.cream,       // 상태 이름 꼬리표
      noteBg: P.cream, noteText: P.ink,       // 안전 안내 상자
      sessionBg: P.aqua, sessionText: P.ink,  // 세션 배경: 아쿠아 단색
      circle: P.cream, circleText: P.ink,     // 호흡 원: 크림색
      ring: P.teal,                           // 멈춤 때 나타나는 고리
      btnBg: P.cream, btnText: P.ink,         // 세션·마무리 화면 보조 버튼
      sun: null,                              // 원 안의 떠오르는 해 (없음)
    },
    technique: {
      name: '길게 내쉬기 호흡',
      rhythm: '4초 들숨 · 6초 날숨',
      why: '내쉬는 숨이 길어지면 몸이 스스로 긴장을 풀기 시작해요.',
      stages: [
        {
          repeat: 30,
          phases: [
            { type: 'inhale', seconds: 4 },
            { type: 'exhale', seconds: 6 },
          ],
        },
      ],
    },
  },
  {
    id: 'sleep',
    name: '잠이 안 와요',
    description: '잠들기 어려울 때',
    illustration: 'sleep',
    colors: {
      main: P.ink, text: P.cream,
      tile: P.olive,
      pillBg: P.mustard, pillText: P.ink,
      noteBg: P.olive, noteText: P.cream,
      sessionBg: P.ink, sessionText: P.cream,   // 아주 어두운 잉크 단색
      circle: '#CBB310', circleText: P.ink,     // 밤에 눈부시지 않게 살짝 낮춘 머스터드(달)
      ring: '#7A6A10',                          // 같은 계열의 어두운 머스터드
      btnBg: P.olive, btnText: P.cream,
      sun: null,
    },
    technique: {
      name: '4-7-8 호흡 → 느린 호흡',
      rhythm: '처음 4회: 4초 들숨 · 7초 멈춤 · 8초 날숨\n이후: 4초 들숨 · 8초 날숨',
      why: '천천히, 길게 내쉬는 숨이 몸과 마음을 잠들 준비로 이끌어요.',
      stages: [
        {
          repeat: 4,
          phases: [
            { type: 'inhale', seconds: 4 },
            { type: 'hold', seconds: 7 },
            { type: 'exhale', seconds: 8 },
          ],
        },
        {
          repeat: 18,
          // 이 묶음이 시작될 때 원 아래에 잠깐 보여줄 안내
          notice: '이제 숨 참기 없이 천천히 내쉬어요',
          phases: [
            { type: 'inhale', seconds: 4 },
            { type: 'exhale', seconds: 8 },
          ],
        },
      ],
    },
  },
  {
    id: 'tired',
    name: '피곤·무기력',
    description: '기운이 없을 때',
    illustration: 'tired',
    colors: {
      main: P.mustard, text: P.ink,
      tile: P.cream,
      pillBg: P.ink, pillText: P.cream,
      noteBg: P.cream, noteText: P.ink,
      sessionBg: P.cream, sessionText: P.ink,   // 크림 단색
      circle: P.mustard, circleText: P.ink,     // 머스터드 원
      ring: P.mustard,
      btnBg: P.mustard, btnText: P.ink,
      sun: P.orange,                            // 들숨 때 원 안에서 오렌지 반원(해)이 떠오름
    },
    technique: {
      name: '박스 호흡',
      rhythm: '4초 들숨 · 4초 멈춤 · 4초 날숨 · 4초 멈춤',
      why: '같은 길이로 숨을 고르면 차분하면서도 정신이 또렷해져요.',
      stages: [
        {
          repeat: 19,
          phases: [
            { type: 'inhale', seconds: 4 },
            { type: 'hold', seconds: 4 },
            { type: 'exhale', seconds: 4 },
            { type: 'hold', seconds: 4 },
          ],
        },
      ],
    },
  },
];


/* ---------------------------------------------------------
   일러스트 도구 — 기본 도형으로 SVG 그리기
   ---------------------------------------------------------
   플랫 지오메트릭 스타일: 테두리 선·그림자·그라데이션 없이
   원, 반원, 둥근 사각형 같은 "단색 면"만 조합해서 그려요.
   (예외: 감은 눈과 미소는 짧은 곡선으로 그려요)
   도형에 class를 주면 style.css의 움직임(m-float, m-wave 등)이 붙어요.
   --------------------------------------------------------- */

// 숫자를 소수 첫째 자리까지만 (SVG 코드를 짧고 깔끔하게)
function n(x) {
  return Math.round(x * 10) / 10;
}

function classAttr(cls) {
  return cls ? ' class="' + cls + '"' : '';
}

// 원
function circle(cx, cy, r, fill, cls) {
  return '<circle' + classAttr(cls) + ' cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(r) +
    '" fill="' + fill + '"/>';
}

// 둥근 사각형 (rx = 모서리 둥글기)
function rect(x, y, w, h, rx, fill, cls) {
  return '<rect' + classAttr(cls) + ' x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) +
    '" height="' + n(h) + '" rx="' + n(rx) + '" fill="' + fill + '"/>';
}

// 자유 모양 (path)
function shape(d, fill, cls) {
  return '<path' + classAttr(cls) + ' d="' + d + '" fill="' + fill + '"/>';
}

// 반원: (cx, cy)는 지름의 가운데. dir이 'up'이면 위로 볼록, 'down'이면 아래로 볼록
function halfCircle(cx, cy, r, dir, fill, cls) {
  const sweep = dir === 'up' ? 1 : 0;
  return shape(
    'M' + n(cx - r) + ' ' + n(cy) + 'A' + n(r) + ' ' + n(r) + ' 0 0 ' + sweep + ' ' + n(cx + r) + ' ' + n(cy) + 'Z',
    fill, cls
  );
}

// 짧은 곡선 (감은 눈, 미소에만 사용)
function curve(d, width) {
  return '<path d="' + d + '" fill="none" stroke="' + P.ink + '" stroke-width="' + n(width) +
    '" stroke-linecap="round"/>';
}

// 피부색마다 코에 쓸 조금 더 진한 색
const NOSE_COLORS = {};
NOSE_COLORS[P.skinLight] = P.skinMid;
NOSE_COLORS[P.skinMid] = P.skinDeep;
NOSE_COLORS[P.skinDeep] = P.olive;

/* 사람 얼굴 그리기
   o = {
     cx, cy, r : 얼굴 원의 가운데와 반지름
     skin      : 피부색
     hair      : 머리카락 색
     style     : 머리 모양 'cap'(짧은 머리) / 'long'(긴 머리) / 'bob'(단발) / 'bun'(올림머리) / 'afro'(풍성한 머리) / 'bald'(민머리)
     eyes      : 'closed'(감은 눈, 기본) / 'dot'(점 눈)
     cheeks    : true면 볼에 작은 원
     beard     : 수염 색 (없으면 생략)
     body      : 옷 색 (어깨까지 그림, 없으면 생략)
     cls       : 움직임 class
     tilt      : 고개 기울기(도)
   } */
function face(o) {
  const cx = o.cx;
  const cy = o.cy;
  const r = o.r;
  const hair = o.hair || P.olive;
  const style = o.style || 'cap';
  const lineWidth = Math.max(1.2, r * 0.075);
  let s = '';

  // 1) 어깨 (위가 둥근 사각형)
  if (o.body) s += rect(cx - r * 1.3, cy + r * 0.75, r * 2.6, r * 3, r * 1.3, o.body);

  // 2) 뒷머리 (큰 덩어리 도형 하나)
  if (style === 'long') s += rect(cx - r * 1.13, cy - r * 1.12, r * 2.26, r * 2.55, r * 1.13, hair);
  if (style === 'bob') s += rect(cx - r * 1.15, cy - r * 1.13, r * 2.3, r * 2.0, r * 1.0, hair);
  if (style === 'afro') s += circle(cx, cy - r * 0.18, r * 1.42, hair);
  if (style === 'bun') s += circle(cx, cy - r * 1.08, r * 0.42, hair);

  // 3) 얼굴
  s += circle(cx, cy, r, o.skin);

  // 4) 앞머리: 이마 위를 덮는 원의 윗부분
  if (style !== 'bald') {
    const capR = r * 1.04;
    const lineY = cy - r * 0.3;
    const half = Math.sqrt(capR * capR - (r * 0.3) * (r * 0.3));
    s += shape(
      'M' + n(cx - half) + ' ' + n(lineY) + 'A' + n(capR) + ' ' + n(capR) + ' 0 0 1 ' + n(cx + half) + ' ' + n(lineY) + 'Z',
      hair
    );
  }

  // 5) 수염 (아래로 볼록한 반원)
  if (o.beard) s += halfCircle(cx, cy + r * 0.25, r * 0.82, 'down', o.beard);

  // 6) 눈
  const eyeY = cy + r * 0.06;
  const eyeX = r * 0.36;
  [cx - eyeX, cx + eyeX].forEach(function (x) {
    if (o.eyes === 'dot') {
      s += circle(x, eyeY, r * 0.085, P.ink);
    } else {
      // 감은 눈: 아래로 살짝 휜 짧은 곡선
      s += curve('M' + n(x - r * 0.14) + ' ' + n(eyeY) + 'Q' + n(x) + ' ' + n(eyeY + r * 0.14) + ' ' + n(x + r * 0.14) + ' ' + n(eyeY), lineWidth);
    }
  });

  // 7) 코: 작은 반원
  s += halfCircle(cx, cy + r * 0.24, r * 0.1, 'down', NOSE_COLORS[o.skin] || P.olive);

  // 8) 볼: 작은 원
  if (o.cheeks) {
    s += circle(cx - r * 0.57, cy + r * 0.33, r * 0.11, P.pink);
    s += circle(cx + r * 0.57, cy + r * 0.33, r * 0.11, P.pink);
  }

  // 9) 미소: 짧은 곡선
  s += curve('M' + n(cx - r * 0.17) + ' ' + n(cy + r * 0.47) + 'Q' + n(cx) + ' ' + n(cy + r * 0.6) + ' ' + n(cx + r * 0.17) + ' ' + n(cy + r * 0.47), lineWidth);

  const tilt = o.tilt ? ' transform="rotate(' + o.tilt + ' ' + n(cx) + ' ' + n(cy) + ')"' : '';
  return '<g' + classAttr(o.cls) + tilt + '>' + s + '</g>';
}

// SVG 틀: w×h 크기의 그림판 + 배경색. 타일 크기와 비율이 달라도 꽉 채우고 넘치는 부분은 잘라요(slice)
function svgTile(w, h, bg, content) {
  return '<svg class="illust" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice"' +
    ' aria-hidden="true" focusable="false">' +
    rect(0, 0, w, h, 0, bg) + content + '</svg>';
}


/* ---------------------------------------------------------
   상태 카드 일러스트 (100×100 타일)
   --------------------------------------------------------- */
const ILLUSTRATIONS = {
  // 불안·긴장: 눈을 감은 사람 + 잔잔해지는 반원 물결
  anxious: function () {
    return svgTile(100, 100, P.teal,
      face({ cx: 50, cy: 38, r: 24, skin: P.skinMid, hair: P.olive, style: 'bob', cheeks: true, cls: 'm m-float' }) +
      halfCircle(50, 100, 42, 'up', P.aqua, 'm m-wave') +
      halfCircle(50, 100, 28, 'up', P.cream, 'm m-wave d1') +
      halfCircle(50, 100, 14, 'up', P.aqua, 'm m-wave d2')
    );
  },

  // 잠이 안 와요: 베개에 기대 잠든 얼굴 + 머스터드 초승달과 작은 별
  sleep: function () {
    return svgTile(100, 100, P.olive,
      // 초승달: 머스터드 원 위에 배경색 원을 살짝 비껴 겹쳐서 만듦
      circle(72, 26, 15, P.mustard) + circle(79, 20, 13, P.olive) +
      circle(30, 16, 2.4, P.mustard, 'm m-twinkle') +
      circle(90, 50, 1.9, P.mustard, 'm m-twinkle d1') +
      circle(16, 40, 1.7, P.mustard, 'm m-twinkle d2') +
      rect(2, 82, 96, 30, 15, P.cream) + // 베개
      face({ cx: 44, cy: 68, r: 24, skin: P.skinDeep, hair: P.ink, style: 'afro', tilt: -14, cls: 'm m-float' })
    );
  },

  // 피곤·무기력: 미소 짓는(눈 뜬) 얼굴 + 떠오르는 머스터드·오렌지 해
  tired: function () {
    return svgTile(100, 100, P.cream,
      '<g class="m m-rise">' +
        circle(68, 58, 26, P.mustard) +
        halfCircle(68, 58, 26, 'down', P.orange) +
      '</g>' +
      face({ cx: 36, cy: 52, r: 24, skin: P.skinLight, hair: P.ink, style: 'bun', eyes: 'dot', cheeks: true, body: P.olive, cls: 'm m-float d1' })
    );
  },
};

// 상태의 일러스트 SVG 문자열 만들기
function illustrationSVG(state) {
  return ILLUSTRATIONS[state.illustration]();
}


/* ---------------------------------------------------------
   홈 화면 얼굴 타일 모자이크 (타일 5개)
   - cls: style.css의 격자 위치 (tile-a ~ tile-e)
   - w, h: 그림판 크기 (타일 모양에 맞춰 세로로 길거나 가로로 긴 판)
   다양한 피부색·나이·성별의 사람들이 눈을 감고 편안하게 숨 쉬어요.
   --------------------------------------------------------- */
const MOSAIC_TILES = [
  { // 긴 머리의 사람 (세로로 긴 타일)
    cls: 'tile-a', w: 100, h: 210, bg: P.mustard,
    art: face({ cx: 54, cy: 118, r: 40, skin: P.skinDeep, hair: P.olive, style: 'long', cheeks: true, body: P.orange, cls: 'm m-float' }),
  },
  { // 흰머리를 올려 묶은 어르신
    cls: 'tile-b', w: 100, h: 100, bg: P.pink,
    art: face({ cx: 56, cy: 62, r: 34, skin: P.skinLight, hair: P.cream, style: 'bun', body: P.olive, cls: 'm m-float d1' }),
  },
  { // 숨결처럼 퍼지는 반원 + 작은 해 (사물 타일)
    cls: 'tile-c', w: 100, h: 100, bg: P.aqua,
    art: circle(74, 26, 9, P.mustard) +
      halfCircle(50, 100, 44, 'up', P.cream, 'm m-wave') +
      halfCircle(50, 100, 30, 'up', P.teal, 'm m-wave d1') +
      halfCircle(50, 100, 16, 'up', P.cream, 'm m-wave d2'),
  },
  { // 짧은 머리의 사람 (세로로 긴 타일)
    cls: 'tile-d', w: 100, h: 210, bg: P.orange,
    art: face({ cx: 46, cy: 98, r: 38, skin: P.skinMid, hair: P.ink, style: 'cap', body: P.aqua, cls: 'm m-float d2' }),
  },
  { // 흰 수염의 어르신 + 머스터드 해 (가로로 긴 타일)
    cls: 'tile-e', w: 210, h: 100, bg: P.olive,
    art: circle(52, 46, 22, P.mustard) +
      face({ cx: 140, cy: 54, r: 34, skin: P.skinDeep, style: 'bald', beard: P.cream, body: P.teal, cls: 'm m-float d3' }),
  },
];


/* ---------------------------------------------------------
   입문 안내 카드 6장
   - tile: 그림 타일 배경색
   - special: 'preview' = 탭하면 소리 미리 듣기, 'start' = 시작 버튼 표시
   그림판 크기는 모두 150×100 (타일 비율 3:2)
   --------------------------------------------------------- */
const INTRO_CARDS = [
  {
    title: '환영해요',
    body: '프라나는 산스크리트어로 숨, 그리고 생명의 에너지를 뜻해요. 명상은 거창한 게 아니라, 내 숨을 바라보는 것에서 시작해요.',
    // 눈을 감은 사람 + 머리 위에서 천천히 빛나는(고리가 퍼지는) 작은 원
    svg: svgTile(150, 100, P.mustard,
      '<circle class="m m-ring" cx="75" cy="20" r="13" fill="none" stroke="' + P.cream + '" stroke-width="2.5"/>' +
      '<circle class="m m-ring d1" cx="75" cy="20" r="19" fill="none" stroke="' + P.cream + '" stroke-width="2"/>' +
      circle(75, 20, 7.5, P.cream) +
      face({ cx: 75, cy: 72, r: 26, skin: P.skinMid, hair: P.olive, style: 'cap', cheeks: true, body: P.teal, cls: 'm m-float' })
    ),
  },
  {
    title: '편한 자세',
    body: '의자에 앉아도, 바닥에 앉아도, 누워도 괜찮아요. 등은 편안하게 펴고, 어깨와 턱의 힘을 살짝 빼요.',
    // 의자에 앉은 어르신 · 바닥에 앉은 사람 · 누운 사람
    svg: svgTile(150, 100, P.aqua,
      rect(0, 88, 150, 12, 0, P.teal) +                   // 바닥
      // 의자에 앉은 사람
      rect(12, 40, 6, 48, 3, P.olive) +                   // 의자 등받이
      rect(12, 62, 32, 6, 3, P.olive) +                   // 의자 앉는 곳
      rect(38, 62, 6, 26, 3, P.olive) +                   // 의자 다리
      rect(20, 38, 14, 28, 7, P.pink) +                   // 몸
      rect(20, 56, 26, 10, 5, P.ink) +                    // 허벅지
      rect(37, 56, 9, 32, 4.5, P.ink) +                   // 정강이
      face({ cx: 27, cy: 29, r: 8.5, skin: P.skinLight, hair: P.cream, style: 'bun' }) +
      // 바닥에 앉은 사람 (양반다리)
      rect(56, 76, 38, 12, 6, P.olive) +                  // 포갠 다리
      rect(68, 52, 14, 28, 7, P.mustard) +                // 몸
      face({ cx: 75, cy: 44, r: 8.5, skin: P.skinDeep, hair: P.ink, style: 'long' }) +
      // 누운 사람
      rect(100, 84, 46, 5, 2.5, P.cream) +                // 매트
      rect(114, 70, 32, 14, 7, P.orange) +                // 몸
      face({ cx: 106, cy: 76, r: 8.5, skin: P.skinMid, hair: P.olive, style: 'cap', tilt: -90 })
    ),
  },
  {
    title: '코로, 배까지',
    body: '가능하면 코로 숨쉬고, 숨이 들어올 때 배가 부드럽게 부풀도록 해요.',
    // 누워서 배로 숨 쉬는 사람: 숨을 들이쉬면 배(반원)가 부풀어요
    svg: svgTile(150, 100, P.pink,
      rect(0, 86, 150, 14, 0, P.olive) +                  // 바닥
      rect(10, 78, 132, 8, 4, P.cream) +                  // 매트
      halfCircle(84, 58, 18, 'up', P.aqua, 'm m-belly') + // 배
      rect(40, 58, 96, 20, 10, P.aqua) +                  // 몸
      circle(24, 40, 2.2, P.cream, 'm m-air') +           // 코로 들어오는 숨
      circle(17, 33, 1.6, P.cream, 'm m-air') +
      face({ cx: 28, cy: 64, r: 14, skin: P.skinDeep, hair: P.ink, style: 'cap', tilt: -90 })
    ),
  },
  {
    title: '원과 소리를 따라가요',
    body: '원이 커지면 들이쉬고, 작아지면 내쉬고, 멈추면 잠시 머물러요. 높은 "딩"은 들숨, 낮은 "동"은 날숨이라 눈을 감아도 괜찮아요.',
    special: 'preview',
    // 실제로 숨 쉬는 원 (4초 커지고 4초 작아짐)
    svg: svgTile(150, 100, P.olive,
      circle(75, 44, 36, P.mustard, 'm m-breath')
    ),
  },
  {
    title: '잡념이 와도 괜찮아요',
    body: '생각이 떠오르는 건 실패가 아니에요. "아, 생각했구나" 알아차리고 다시 숨으로 돌아오는 것, 그게 바로 명상이에요.',
    // 머리 위로 생각 구름이 천천히 지나가는 사람
    svg: svgTile(150, 100, P.aqua,
      '<g class="m m-cloud">' +
        circle(62, 24, 10, P.cream) + circle(76, 19, 13, P.cream) + circle(90, 24, 10, P.cream) +
        rect(52, 22, 48, 12, 6, P.cream) +
      '</g>' +
      circle(97, 50, 3, P.cream) + circle(104, 42, 4.5, P.cream) + // 생각 방울
      face({ cx: 72, cy: 80, r: 24, skin: P.skinLight, hair: P.ink, style: 'bob', body: P.pink, cls: 'm m-float' })
    ),
  },
  {
    title: '무리하지 않기',
    body: '어지럽거나 숨이 차면 언제든 멈추고 평소처럼 숨 쉬세요.',
    special: 'start',
    // 편안하게 미소 짓는 사람
    svg: svgTile(150, 100, P.orange,
      face({ cx: 75, cy: 56, r: 28, skin: P.skinDeep, hair: P.ink, style: 'afro', cheeks: true, body: P.mustard, cls: 'm m-float' })
    ),
  },
];

// 구간 종류별 안내 문구
const PHASE_LABELS = {
  inhale: '들이쉬세요',
  hold: '멈추세요',
  exhale: '내쉬세요',
};

// 숨 쉬는 원의 크기 범위 (1 = 무대 전체 크기)
const CIRCLE_MIN = 0.5;  // 다 내쉬었을 때 (원 안 글자가 원 밖으로 삐져나가지 않는 크기)
const CIRCLE_MAX = 1.0;  // 다 들이쉬었을 때

// 단계 전환 안내 문구를 보여주는 시간(밀리초)
const NOTICE_DURATION = 6000;

// 종소리 설정
//   freq: 기본 음높이(Hz), duration: 소리가 사라지기까지 걸리는 시간(초), volume: 크기
const BELLS = {
  inhale: { freq: 660, duration: 1.4, volume: 0.32 }, // 들숨 "딩" (조금 높은 소리)
  exhale: { freq: 440, duration: 1.5, volume: 0.34 }, // 날숨 "동" (조금 낮은 소리)
  end:    { freq: 294, duration: 4.5, volume: 0.42 }, // 세션 종료 (길고 깊은 여운)
};

// 싱잉볼처럼 따뜻하게 들리도록 섞는 "배음" 목록
//   ratio: 기본 음의 몇 배 높이인지, gain: 그 소리의 크기, decay: 얼마나 빨리 사라지는지(1 = 기본과 같음)
const BELL_PARTIALS = [
  { ratio: 1,     gain: 1.0,  decay: 1.0 },  // 기본 음
  { ratio: 1.004, gain: 0.45, decay: 1.0 },  // 살짝 어긋난 음 → 은은한 "웅~" 떨림
  { ratio: 2.0,   gain: 0.22, decay: 0.6 },  // 한 옥타브 위
  { ratio: 2.76,  gain: 0.10, decay: 0.4 },  // 종 특유의 맑은 울림
];

// 전체 소리 크기 (0~1). 너무 크지 않게
const MASTER_VOLUME = 0.6;


/* =========================================================
   앱이 기억하는 현재 상태 (메모리에만 저장, 새로고침하면 초기화)
   ========================================================= */
const appState = {
  selected: null, // 지금 고른 상태 객체 (STATES 중 하나)
};


/* =========================================================
   작은 도우미 함수들
   ========================================================= */

// 호흡법 전체 길이(초)를 설정 데이터로부터 계산
function getTotalSeconds(technique) {
  return buildTimeline(technique).total;
}

// 초를 "약 5분" 같은 친근한 말로 바꾸기
function formatAboutMinutes(totalSeconds) {
  //   = 줄바꿈되지 않는 띄어쓰기 ("약"과 "5분"이 다른 줄로 갈라지지 않게)
  return '약 ' + Math.round(totalSeconds / 60) + '분';
}

// 초를 "4:52" 같은 분:초 형식으로 바꾸기
function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes + ':' + String(seconds).padStart(2, '0');
}

// 부드럽게 시작해서 부드럽게 끝나는 움직임 (ease-in-out)
// progress가 0→1로 갈 때, 처음과 끝은 천천히, 가운데는 빠르게 변해요
function easeInOut(progress) {
  return 0.5 - Math.cos(Math.PI * progress) / 2;
}


/* =========================================================
   2) 화면 전환
   ---------------------------------------------------------
   모든 화면(section.screen)을 숨긴 뒤, 원하는 화면 하나만 보여줍니다.
   ========================================================= */
function showScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(function (screen) {
    screen.hidden = screen.id !== screenId;
  });

  // 새 화면은 맨 위부터 보이도록 스크롤 초기화
  window.scrollTo(0, 0);

  // 화면 읽기 프로그램(스크린 리더)과 키보드 사용자를 위해
  // 새 화면의 제목으로 포커스를 옮겨줍니다
  const title = document.querySelector('#' + screenId + ' h1');
  if (title) {
    title.focus({ preventScroll: true });
  }

  // 휴대폰 "뒤로 가기" 버튼 대비: 홈이 아닌 화면에 있을 땐
  // 방문 기록에 한 칸을 넣어둬서, 뒤로 가기를 눌러도 앱을 떠나지 않게 해요
  // (주소는 바뀌지 않아요. 저장되는 데이터도 없어요)
  if (screenId !== 'screen-home' && !(history.state && history.state.prana)) {
    try {
      history.pushState({ prana: true }, '');
    } catch (error) {
      // 일부 환경(파일로 열기 등)에서 막혀 있으면 조용히 무시
    }
  }
}

// 지금 보이는 화면의 id
function currentScreenId() {
  const visible = document.querySelector('.screen:not([hidden])');
  return visible ? visible.id : 'screen-home';
}

// 휴대폰·브라우저의 "뒤로 가기"를 눌렀을 때 앱 안에서 한 단계 뒤로
//   세션 → 추천 화면 (세션 멈춤) / 그 밖의 화면 → 홈
function handleBack() {
  const current = currentScreenId();
  if (current === 'screen-home') return; // 홈에서는 브라우저 기본 동작(앱 나가기)
  if (current === 'screen-session') {
    quitSession();
  } else {
    goHome();
  }
}

// 화면 분위기(배경색·글자색) 바꾸기 — 모두 단색
//   'home'    : 크림 배경 (홈, 입문 안내)
//   'state'   : 상태의 메인 색 배경 (추천 화면)
//   'session' : 상태별 세션 배경 (세션, 마무리 화면)
// style.css의 CSS 변수 값을 바꾸는 방식이라, 색이 화면 전체에 한 번에 적용돼요.
function setMood(mood, state) {
  const root = document.documentElement.style;
  const c = state && mood !== 'home' ? state.colors : null;

  let bg = P.cream;
  let text = P.ink;
  if (c && mood === 'state') { bg = c.main; text = c.text; }
  if (c && mood === 'session') { bg = c.sessionBg; text = c.sessionText; }
  root.setProperty('--page-bg', bg);
  root.setProperty('--page-text', text);

  // 화면 속 부품들의 색 (상태가 없으면 style.css의 기본값으로)
  const parts = {
    '--pill-bg': c && c.pillBg,
    '--pill-text': c && c.pillText,
    '--note-bg': c && c.noteBg,
    '--note-text': c && c.noteText,
    '--circle': c && c.circle,
    '--circle-text': c && c.circleText,
    '--ring': c && c.ring,
    '--sun': c && c.sun,
    '--btn2-bg': c && c.btnBg,
    '--btn2-text': c && c.btnText,
  };
  Object.keys(parts).forEach(function (name) {
    if (parts[name]) root.setProperty(name, parts[name]);
    else root.removeProperty(name);
  });

  // 휴대폰 브라우저 위쪽 주소창 색도 배경과 맞춤
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute('content', bg);
}


/* =========================================================
   3-1) 홈 화면
   ========================================================= */

// 설정 데이터(MOSAIC_TILES)를 보고 얼굴 타일 모자이크 채우기
function renderMosaic() {
  const box = document.getElementById('mosaic');
  box.innerHTML = MOSAIC_TILES.map(function (tile) {
    return '<div class="tile ' + tile.cls + '">' + svgTile(tile.w, tile.h, tile.bg, tile.art) + '</div>';
  }).join('');
}

// 설정 데이터(STATES)를 보고 상태 카드를 자동으로 만들어 넣기
function renderStateCards() {
  const list = document.getElementById('state-list');
  list.innerHTML = ''; // 혹시 남아 있는 내용 비우기

  STATES.forEach(function (state) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'state-card';
    // 카드마다 자기 상태의 메인 색(배경)과 글자색을 CSS 변수로 전달
    card.style.setProperty('--card-bg', state.colors.main);
    card.style.setProperty('--card-text', state.colors.text);

    card.innerHTML =
      '<span class="state-card-illust">' + illustrationSVG(state) + '</span>' +
      '<span class="state-card-text">' +
        '<span class="state-card-name">' + state.name + '</span>' +
        '<span class="state-card-desc">' + state.description + '</span>' +
      '</span>';

    // 카드를 누르면 추천 화면으로
    card.addEventListener('click', function () {
      openRecommend(state);
    });

    list.appendChild(card);
  });
}

function goHome() {
  stopSession(); // 혹시 진행 중인 세션이 있으면 정리
  appState.selected = null;
  setMood('home');
  showScreen('screen-home');
}


/* =========================================================
   3-2) 추천 화면
   ========================================================= */
function openRecommend(state) {
  appState.selected = state;
  setMood('state', state);

  const technique = state.technique;
  const about = formatAboutMinutes(getTotalSeconds(technique));

  document.getElementById('rec-illust').innerHTML = illustrationSVG(state);
  document.getElementById('rec-state').textContent = state.name;
  document.getElementById('rec-title').textContent = technique.name;
  // 리듬 문구 끝에 전체 길이를 붙임 (예: "4초 들숨 · 6초 날숨 · 약 5분")
  // 줄바꿈(\n)은 <br>로 바꿔 넣습니다
  const rhythmEl = document.getElementById('rec-rhythm');
  rhythmEl.textContent = '';
  const lines = (technique.rhythm + ' · ' + about).split('\n');
  lines.forEach(function (line, index) {
    if (index > 0) rhythmEl.appendChild(document.createElement('br'));
    rhythmEl.appendChild(document.createTextNode(line));
  });
  document.getElementById('rec-why').textContent = technique.why;

  showScreen('screen-recommend');
}


/* =========================================================
   소리 — Web Audio API로 종소리를 직접 만들어요
   ---------------------------------------------------------
   소리 파일 없이, 여러 개의 사인파(맑은 "삐~" 소리)를 겹친 뒤
   빠르게 커졌다가 천천히 사라지게 해서 종소리처럼 만듭니다.
   브라우저 정책상 오디오는 사용자가 버튼을 누른 순간에만 처음 켤 수 있어서,
   "시작하기"를 누를 때 ensureAudio()로 준비해요.
   ========================================================= */
const sound = {
  ctx: null,      // 오디오 엔진 (AudioContext)
  master: null,   // 전체 볼륨 조절기
  enabled: true,  // 소리 켜짐 여부 (메모리에만 저장, 기본값: 켜짐)
};

// 오디오 엔진 준비 (처음 한 번 만들고, 잠들어 있으면 깨움)
function ensureAudio() {
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return; // 아주 오래된 브라우저면 소리 없이 진행

  if (!sound.ctx) {
    sound.ctx = new AudioEngine();
    sound.master = sound.ctx.createGain();
    sound.master.gain.value = sound.enabled ? MASTER_VOLUME : 0;
    sound.master.connect(sound.ctx.destination);

    // 미리 듣기 전용 볼륨: 소리를 꺼둔 상태여도, 직접 탭해서 들어볼 땐 들리게
    sound.preview = sound.ctx.createGain();
    sound.preview.gain.value = MASTER_VOLUME;
    sound.preview.connect(sound.ctx.destination);
  }
  // 잠들어 있으면 깨움 (아이폰의 'interrupted' 상태도 포함)
  if (sound.ctx.state !== 'running') {
    sound.ctx.resume().catch(function () {}); // 실패해도 앱은 소리 없이 계속
  }
}

// 종소리 한 번 울리기
//   isPreview: true면 입문 안내의 "소리 미리 듣기" (소리 끄기 설정과 상관없이 울림)
function playBell(bell, isPreview) {
  if (!sound.ctx) return;
  if (!sound.enabled && !isPreview) return;

  const ctx = sound.ctx;
  const start = ctx.currentTime + 0.02; // 아주 살짝 뒤에 시작해야 '틱' 잡음이 안 남
  const end = start + bell.duration;

  // 이 종소리 전체의 크기: 0.015초 만에 커짐(빠른 시작)
  // 사라지는 부분은 아래 배음들이 각자 천천히 줄어들며 만들어요
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(bell.volume, start + 0.015);
  envelope.connect(isPreview ? sound.preview : sound.master);

  // 배음을 하나씩 만들어 겹치기
  BELL_PARTIALS.forEach(function (partial) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = bell.freq * partial.ratio;

    // 높은 배음은 더 빨리 사라지게 해서 자연스러운 여운을 만듦
    const partialGain = ctx.createGain();
    partialGain.gain.setValueAtTime(partial.gain, start);
    partialGain.gain.exponentialRampToValueAtTime(0.0001, start + bell.duration * partial.decay);

    osc.connect(partialGain);
    partialGain.connect(envelope);
    osc.start(start);
    osc.stop(end + 0.1); // 다 울리면 정리
  });
}

// 소리 켜기/끄기
function toggleSound() {
  sound.enabled = !sound.enabled;

  // 이미 울리고 있는 소리도 부드럽게 줄이거나 키움
  if (sound.master) {
    const target = sound.enabled ? MASTER_VOLUME : 0;
    sound.master.gain.setTargetAtTime(target, sound.ctx.currentTime, 0.05);
  }
  updateSoundButton();
}

// 소리 버튼 모양과 설명을 현재 상태에 맞게
function updateSoundButton() {
  const button = document.getElementById('btn-sound');
  button.setAttribute('aria-pressed', String(sound.enabled));
  button.setAttribute('aria-label', sound.enabled ? '소리 끄기' : '소리 켜기');
}


/* =========================================================
   화면 꺼짐 방지 — Screen Wake Lock API
   ---------------------------------------------------------
   세션 중에 휴대폰 화면이 저절로 꺼지지 않게 해요.
   지원하지 않는 브라우저에서는 아무 일도 하지 않고 조용히 넘어가요.
   ========================================================= */
const wake = {
  lock: null,
};

async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return; // 지원 안 함 → 조용히 무시
  try {
    const lock = await navigator.wakeLock.request('screen');
    // 기다리는 사이 세션이 이미 끝났다면 바로 풀어줌
    if (!session.running) {
      lock.release().catch(function () {});
      return;
    }
    wake.lock = lock;
    // 브라우저가 스스로 해제하면(예: 다른 앱으로 전환) 기억을 지움
    wake.lock.addEventListener('release', function () {
      wake.lock = null;
    });
  } catch (error) {
    // 배터리 절약 모드 등으로 거절될 수 있음 → 조용히 무시
    wake.lock = null;
  }
}

function releaseWakeLock() {
  if (wake.lock) {
    wake.lock.release().catch(function () {});
    wake.lock = null;
  }
}


/* =========================================================
   3-3) 세션 화면 — 호흡 엔진
   ---------------------------------------------------------
   [작동 원리]
   1. 시작할 때 설정 데이터를 펼쳐서 "시간표(timeline)"를 만들어요.
      예) 0~4초 들숨, 4~10초 날숨, 10~14초 들숨 ...
   2. 화면이 새로 그려질 때마다(1초에 약 60번) "시작 후 몇 초 지났나"를 재고,
      시간표에서 지금 구간을 찾아 원 크기와 글자를 바꿔요.
   3. 실제 시계 기준으로 계산하므로, 오래 진행해도 시간이 어긋나지 않아요.
   ========================================================= */
const session = {
  timeline: [],     // 펼쳐진 구간 목록
  total: 0,         // 전체 길이(초)
  startTime: 0,     // 시작한 시각 (일시정지한 시간만큼 뒤로 밀림)
  pausedAt: null,   // 일시정지한 시각 (진행 중이면 null)
  running: false,   // 세션이 진행 중인지
  frameId: null,    // 화면 갱신 예약 번호 (멈출 때 사용)
  intervalId: null, // 보조 시계 번호 (화면 갱신이 느려져도 소리를 놓치지 않게)
  index: -1,        // 지금 몇 번째 구간인지
  lastCount: null,  // 마지막으로 표시한 숫자 (같으면 다시 그리지 않음)
  noticeTimer: null,
};

// 화면 요소를 미리 찾아두기 (매번 찾지 않도록)
const el = {};

// 설정 데이터를 시간표로 펼치기
function buildTimeline(technique) {
  const list = [];
  let time = 0;
  technique.stages.forEach(function (stage) {
    for (let round = 0; round < stage.repeat; round++) {
      stage.phases.forEach(function (phase, phaseIndex) {
        list.push({
          type: phase.type,
          seconds: phase.seconds,
          start: time,
          end: time + phase.seconds,
          // 묶음의 맨 첫 구간에만 안내 문구를 붙임
          notice: round === 0 && phaseIndex === 0 ? stage.notice || null : null,
        });
        time += phase.seconds;
      });
    }
  });
  return { list: list, total: time };
}

// 지금 구간에서 원이 어떤 크기여야 하는지 계산
function getCircleScale(index, progress) {
  const phase = session.timeline[index];
  if (phase.type === 'inhale') {
    return CIRCLE_MIN + (CIRCLE_MAX - CIRCLE_MIN) * easeInOut(progress);
  }
  if (phase.type === 'exhale') {
    return CIRCLE_MAX - (CIRCLE_MAX - CIRCLE_MIN) * easeInOut(progress);
  }
  // 멈춤: 바로 앞 구간이 끝났을 때 크기 그대로 유지
  // (들숨 뒤 멈춤이면 큰 원, 날숨 뒤 멈춤이면 작은 원)
  for (let i = index - 1; i >= 0; i--) {
    const prev = session.timeline[i].type;
    if (prev === 'inhale') return CIRCLE_MAX;
    if (prev === 'exhale') return CIRCLE_MIN;
  }
  return CIRCLE_MIN;
}

// 지금 시각 (밀리초)
function now() {
  return performance.now();
}

// 세션 시작
function startSession(state) {
  stopSession(); // 혹시 남아 있는 세션 정리

  // 버튼을 누른 바로 이 순간에 오디오를 준비 (브라우저 정책)
  ensureAudio();
  // 세션 동안 화면이 꺼지지 않게
  requestWakeLock();

  const built = buildTimeline(state.technique);
  session.timeline = built.list;
  session.total = built.total;
  session.startTime = now();
  session.pausedAt = null;
  session.running = true;
  session.index = -1;
  session.lastCount = null;

  // 화면 준비
  setMood('session', state);
  el.sessionName.textContent = state.technique.name;
  // 원 안에서 떠오르는 해는 설정에 sun 색이 있는 상태(피곤·무기력)만
  el.stage.classList.toggle('has-sun', Boolean(state.colors.sun));
  el.circle.style.transform = 'scale(' + CIRCLE_MIN + ')';
  el.ring.style.transform = 'scale(' + (CIRCLE_MIN * 1.14) + ')';
  el.circle.style.setProperty('--breath', '0');
  // 첫 화면부터 이번 세션 값이 보이도록 글자 초기화 (이전 세션 값이 잠깐 보이지 않게)
  const first = session.timeline[0];
  el.label.textContent = PHASE_LABELS[first.type];
  el.count.textContent = first.seconds;
  el.remaining.textContent = formatClock(session.total);
  el.screen.classList.remove('is-paused');
  el.pause.textContent = '일시정지';
  el.pause.setAttribute('aria-pressed', 'false');
  updateSoundButton();
  hideNotice();
  showScreen('screen-session');

  session.frameId = requestAnimationFrame(tick);
  // 보조 시계: 0.25초마다 한 번씩도 확인
  // (화면 그리기는 창이 가려지면 멈추지만, 이 시계는 계속 돌아서 소리 타이밍을 지켜줘요)
  session.intervalId = setInterval(update, 250);
}

// 화면이 새로 그려질 때마다 불리는 함수 (부드러운 원 움직임 담당)
function tick() {
  if (!session.running) return;
  update();
  if (session.running) {
    session.frameId = requestAnimationFrame(tick);
  }
}

// 지금 시각에 맞춰 구간·원·숫자를 맞추는 함수
// (tick과 보조 시계가 함께 부르지만, 같은 일을 두 번 해도 결과는 같아요)
function update() {
  // 세션이 끝났거나 일시정지 중이면 아무것도 바꾸지 않음
  if (!session.running || session.pausedAt !== null) return;

  const elapsed = (now() - session.startTime) / 1000; // 지난 시간(초)

  // 모든 구간이 끝났으면 마무리
  if (elapsed >= session.total) {
    finishSession();
    return;
  }

  // 시간표에서 지금 구간 찾기
  // (화면이 잠시 꺼졌다 켜지면 여러 구간을 건너뛸 수 있어서 while 사용)
  let index = Math.max(session.index, 0);
  while (index < session.timeline.length - 1 && elapsed >= session.timeline[index].end) {
    index++;
  }
  if (index !== session.index) {
    session.index = index;
    onPhaseStart(session.timeline[index]);
  }

  const phase = session.timeline[index];
  const progress = (elapsed - phase.start) / phase.seconds; // 이 구간 진행률 0~1

  // 원 크기
  const scale = getCircleScale(index, progress);
  el.circle.style.transform = 'scale(' + scale.toFixed(4) + ')';
  // 멈춤 고리는 원보다 조금 더 크게, 원 크기를 그대로 따라가요
  el.ring.style.transform = 'scale(' + (scale * 1.14).toFixed(4) + ')';
  // 숨이 얼마나 차 있는지(0~1): 피곤·무기력의 해가 이 값만큼 떠올라요
  el.circle.style.setProperty('--breath', ((scale - CIRCLE_MIN) / (CIRCLE_MAX - CIRCLE_MIN)).toFixed(3));

  // 숫자는 바뀔 때만 다시 씀
  const count = Math.max(1, Math.ceil(phase.end - elapsed));
  if (count !== session.lastCount) {
    session.lastCount = count;
    el.count.textContent = count;
  }
  el.remaining.textContent = formatClock(Math.ceil(session.total - elapsed));
}

// 새 구간이 시작될 때 한 번 불림
function onPhaseStart(phase) {
  el.label.textContent = PHASE_LABELS[phase.type];
  // 멈춤 구간이면 원 바깥 고리가 천천히 나타났다 사라짐
  el.stage.classList.toggle('is-hold', phase.type === 'hold');

  // 들숨엔 "딩", 날숨엔 "동", 멈춤엔 소리 없음
  if (phase.type === 'inhale') playBell(BELLS.inhale);
  if (phase.type === 'exhale') playBell(BELLS.exhale);

  if (phase.notice) {
    showNotice(phase.notice);
  }
}

// 원 아래 안내 문구를 잠깐 보여주기
function showNotice(text) {
  clearTimeout(session.noticeTimer);
  el.notice.textContent = text;
  el.notice.classList.add('is-visible');
  session.noticeTimer = setTimeout(hideNotice, NOTICE_DURATION);
}

function hideNotice() {
  clearTimeout(session.noticeTimer);
  el.notice.classList.remove('is-visible');
}

// 일시정지 ↔ 계속
function togglePause() {
  if (!session.running) return;

  if (session.pausedAt === null) {
    // 일시정지: 멈춘 시각을 기억
    session.pausedAt = now();
    el.screen.classList.add('is-paused');
    el.pause.textContent = '계속';
    el.pause.setAttribute('aria-pressed', 'true');
    el.label.textContent = '잠시 멈춤';
  } else {
    // 계속: 멈춰 있던 시간만큼 시작 시각을 뒤로 미뤄서 이어가기
    session.startTime += now() - session.pausedAt;
    session.pausedAt = null;
    el.screen.classList.remove('is-paused');
    el.pause.textContent = '일시정지';
    el.pause.setAttribute('aria-pressed', 'false');
    el.label.textContent = PHASE_LABELS[session.timeline[session.index].type];
  }
}

// 세션 정리 (화면 갱신 멈춤)
function stopSession() {
  session.running = false;
  cancelAnimationFrame(session.frameId);
  clearInterval(session.intervalId);
  releaseWakeLock();
  hideNotice();
  if (el.stage) {
    el.stage.classList.remove('is-hold');
  }
}

// "그만하기": 세션을 멈추고 추천 화면으로
function quitSession() {
  stopSession();
  openRecommend(appState.selected);
}

// 정해진 횟수를 모두 마쳤을 때
function finishSession() {
  stopSession();
  playBell(BELLS.end); // 길고 깊게 울리는 마지막 종소리
  setMood('session', appState.selected); // 세션과 같은 배경으로 차분하게 마무리
  showScreen('screen-finish');
}


/* =========================================================
   3-5) 입문 안내 화면 — 스와이프 카드 6장
   ---------------------------------------------------------
   카드 6장을 가로로 한 줄로 세워두고, 줄 전체를 왼쪽으로 밀어서
   (transform: translateX) 한 장씩 보여주는 방식이에요.
   - 휴대폰: 손가락으로 좌우로 밀기
   - PC: "이전·다음" 버튼, 키보드 ← → 화살표
   ========================================================= */
const intro = {
  index: 0,          // 지금 보고 있는 카드 번호 (0부터 시작)
  slides: [],        // 카드 요소들
  dots: [],          // 점 요소들
  previewTimers: [], // 소리 미리 듣기 예약들
};

// 설정 데이터(INTRO_CARDS)를 보고 카드와 점을 만들어 넣기
function renderIntroCards() {
  const track = document.getElementById('intro-track');
  const dotsBox = document.getElementById('intro-dots');
  track.innerHTML = '';
  dotsBox.innerHTML = '';

  INTRO_CARDS.forEach(function (card, i) {
    const slide = document.createElement('div');
    slide.className = 'intro-slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', '카드');
    slide.setAttribute('aria-label', (i + 1) + ' / ' + INTRO_CARDS.length);

    // 그림 칸: 4번 카드는 탭할 수 있는 버튼, 나머지는 그냥 그림
    let illust;
    if (card.special === 'preview') {
      illust =
        '<button type="button" class="intro-illust intro-preview" ' +
          'aria-label="소리 미리 듣기: 들숨 딩, 날숨 동">' +
          card.svg +
          '<span class="preview-caption" aria-live="polite">탭해서 소리 들어보기</span>' +
        '</button>';
    } else {
      illust = '<div class="intro-illust">' + card.svg + '</div>';
    }

    slide.innerHTML =
      illust +
      '<h2>' + card.title + '</h2>' +
      '<p>' + card.body + '</p>' +
      (card.special === 'start'
        ? '<button type="button" class="primary-button intro-start">이제 시작해볼까요?</button>'
        : '');

    track.appendChild(slide);

    const dot = document.createElement('span');
    dot.className = 'intro-dot';
    dotsBox.appendChild(dot);
  });

  intro.slides = Array.prototype.slice.call(track.children);
  intro.dots = Array.prototype.slice.call(dotsBox.children);

  // 4번 카드: 탭하면 소리 미리 듣기
  const previewButton = track.querySelector('.intro-preview');
  if (previewButton) previewButton.addEventListener('click', playPreview);

  // 6번 카드: 시작 버튼 → 홈
  const startButton = track.querySelector('.intro-start');
  if (startButton) startButton.addEventListener('click', goHome);
}

// 입문 안내 열기 (항상 첫 카드부터)
function openIntro() {
  setMood('home');
  showScreen('screen-intro');
  goToCard(0);
}

// n번째 카드로 이동
function goToCard(n) {
  const last = INTRO_CARDS.length - 1;
  intro.index = Math.max(0, Math.min(last, n)); // 0 ~ 마지막 사이로 제한

  const track = document.getElementById('intro-track');
  track.style.transform = 'translateX(' + (-intro.index * 100) + '%)';

  // 지금 카드만 키보드·화면 읽기 프로그램이 접근하도록 (안 보이는 카드는 inert)
  intro.slides.forEach(function (slide, i) {
    slide.inert = i !== intro.index;
    slide.setAttribute('aria-hidden', String(i !== intro.index));
  });
  intro.dots.forEach(function (dot, i) {
    dot.classList.toggle('is-current', i === intro.index);
  });

  // 첫 카드에선 "이전", 마지막 카드에선 "다음"을 숨김
  const prev = document.getElementById('btn-intro-prev');
  const next = document.getElementById('btn-intro-next');
  // 숨겨질 버튼에 포커스가 있었다면 반대쪽 버튼으로 옮겨줌
  if (intro.index === 0 && document.activeElement === prev) next.focus();
  if (intro.index === last && document.activeElement === next) prev.focus();
  prev.disabled = intro.index === 0;
  next.disabled = intro.index === last;

  document.getElementById('intro-position').textContent =
    (intro.index + 1) + '번째 카드, 전체 ' + INTRO_CARDS.length + '장: ' + INTRO_CARDS[intro.index].title;
}

// 손가락(또는 마우스)으로 밀어서 카드 넘기기
function setupSwipe() {
  const viewport = document.getElementById('intro-viewport');
  const track = document.getElementById('intro-track');
  const SWIPE_DISTANCE = 50; // 이만큼(px) 이상 밀면 다음/이전 카드로

  let startX = 0;
  let startY = 0;
  let deltaX = 0;
  let tracking = false;  // 손가락이 닿아 있는지
  let dragging = false;  // 가로로 미는 중이라고 판단했는지

  viewport.addEventListener('pointerdown', function (event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    tracking = true;
    dragging = false;
    startX = event.clientX;
    startY = event.clientY;
    deltaX = 0;
  });

  viewport.addEventListener('pointermove', function (event) {
    if (!tracking) return;
    deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    // 처음 조금 움직였을 때 가로 방향이면 "카드 넘기기"로 판단
    if (!dragging) {
      if (Math.abs(deltaX) < 8 || Math.abs(deltaX) < Math.abs(deltaY)) return;
      dragging = true;
      viewport.setPointerCapture(event.pointerId);
      track.classList.add('is-dragging');
    }

    // 첫 카드에서 오른쪽, 마지막 카드에서 왼쪽으로 밀면 살짝만 따라오게(고무줄 느낌)
    const atStart = intro.index === 0 && deltaX > 0;
    const atEnd = intro.index === INTRO_CARDS.length - 1 && deltaX < 0;
    const offset = atStart || atEnd ? deltaX / 3 : deltaX;

    track.style.transform =
      'translateX(calc(' + (-intro.index * 100) + '% + ' + offset + 'px))';
  });

  function endSwipe() {
    if (!tracking) return;
    tracking = false;
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging');

    if (deltaX <= -SWIPE_DISTANCE) goToCard(intro.index + 1);
    else if (deltaX >= SWIPE_DISTANCE) goToCard(intro.index - 1);
    else goToCard(intro.index); // 조금만 밀었으면 제자리로
  }

  viewport.addEventListener('pointerup', endSwipe);
  viewport.addEventListener('pointercancel', endSwipe);

  // 밀어서 넘긴 직후 손을 뗄 때, 그 아래 버튼이 눌리지 않게 막기
  viewport.addEventListener('click', function (event) {
    if (Math.abs(deltaX) >= 8) {
      event.stopPropagation();
      event.preventDefault();
      deltaX = 0;
    }
  }, true);
}

// 4번 카드: "딩"(들숨) → 잠시 뒤 "동"(날숨) 들려주기
function playPreview(event) {
  const caption = event.currentTarget.querySelector('.preview-caption');
  ensureAudio(); // 탭한 순간 오디오 준비 (브라우저 정책)

  // 이전에 예약된 소리가 있으면 취소하고 처음부터
  intro.previewTimers.forEach(clearTimeout);

  playBell(BELLS.inhale, true);
  caption.textContent = '딩 — 들이쉴 때';

  intro.previewTimers = [
    setTimeout(function () {
      playBell(BELLS.exhale, true);
      caption.textContent = '동 — 내쉴 때';
    }, 1800),
    setTimeout(function () {
      caption.textContent = '탭해서 소리 들어보기';
    }, 4000),
  ];
}


/* =========================================================
   4) 버튼 연결 & 앱 시작
   ========================================================= */
function init() {
  // 세션 화면 요소 찾아두기
  el.screen = document.getElementById('screen-session');
  el.sessionName = document.getElementById('session-name');
  el.stage = document.getElementById('breath-stage');
  el.circle = document.getElementById('breath-circle');
  el.ring = document.getElementById('breath-ring');
  el.label = document.getElementById('breath-label');
  el.count = document.getElementById('breath-count');
  el.notice = document.getElementById('breath-notice');
  el.remaining = document.getElementById('session-remaining');
  el.pause = document.getElementById('btn-pause');

  renderMosaic();
  renderStateCards();

  // 추천 화면
  document.getElementById('btn-rec-back').addEventListener('click', goHome);
  document.getElementById('btn-start').addEventListener('click', function () {
    startSession(appState.selected);
  });

  // 세션 화면
  el.pause.addEventListener('click', togglePause);
  document.getElementById('btn-sound').addEventListener('click', toggleSound);

  // 다른 앱에 갔다 돌아오면 브라우저가 화면 꺼짐 방지를 풀어버리므로 다시 요청
  // 휴대폰이 잠시 오디오를 재워뒀을 수도 있어서 함께 깨움
  // (아이폰은 'suspended' 대신 'interrupted' 상태가 되기도 해서 "실행 중이 아니면" 깨워요)
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && session.running) {
      if (!wake.lock) requestWakeLock();
      if (sound.ctx && sound.ctx.state !== 'running') sound.ctx.resume().catch(function () {});
    }
  });

  // 휴대폰·브라우저 "뒤로 가기" → 앱 안에서 한 단계 뒤로
  window.addEventListener('popstate', handleBack);
  document.getElementById('btn-stop').addEventListener('click', quitSession);

  // 키보드 스페이스바로도 일시정지/계속 (버튼에 포커스가 있을 땐 버튼이 처리)
  document.addEventListener('keydown', function (event) {
    if (event.code !== 'Space' || el.screen.hidden) return;
    if (event.target.closest('button')) return;
    event.preventDefault();
    togglePause();
  });

  // 마무리 화면
  document.getElementById('btn-again').addEventListener('click', function () {
    startSession(appState.selected);
  });
  document.getElementById('btn-home').addEventListener('click', goHome);

  // 홈: "처음이신가요?" → 입문 안내
  renderIntroCards();
  setupSwipe();
  document.getElementById('btn-intro').addEventListener('click', openIntro);
  document.getElementById('btn-intro-skip').addEventListener('click', goHome);
  document.getElementById('btn-intro-prev').addEventListener('click', function () {
    goToCard(intro.index - 1);
  });
  document.getElementById('btn-intro-next').addEventListener('click', function () {
    goToCard(intro.index + 1);
  });

  // 키보드 ← → 로 카드 넘기기 (입문 안내 화면일 때만)
  document.addEventListener('keydown', function (event) {
    if (document.getElementById('screen-intro').hidden) return;
    if (event.key === 'ArrowRight') goToCard(intro.index + 1);
    if (event.key === 'ArrowLeft') goToCard(intro.index - 1);
  });

  // 처음에는 홈 화면부터 (첫 화면에서는 제목에 포커스를 옮기지 않음)
  document.getElementById('screen-home').hidden = false;
}

// HTML을 모두 읽은 뒤 앱 시작
document.addEventListener('DOMContentLoaded', init);
