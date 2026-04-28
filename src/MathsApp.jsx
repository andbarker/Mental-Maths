import { useState, useEffect, useRef } from "react";

// localStorage shim — mimics the artifact's window.storage API so the rest of
// the component is unchanged when ported out of the Claude artifact environment.
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    get: async (key) => {
      try {
        const value = window.localStorage.getItem(key);
        return value === null ? null : { value };
      } catch (e) {
        return null;
      }
    },
    set: async (key, value) => {
      try {
        window.localStorage.setItem(key, value);
        return { value };
      } catch (e) {
        return null;
      }
    },
  };
}

// All problems from the worksheet
const DAYS = {
  Mon: {
    label: "Monday",
    emoji: "🐱",
    mascot: "cat",
    bg: "from-rose-200 via-orange-100 to-amber-100",
    accent: "#FF6B6B",
    soft: "#FFE5E5",
    problems: [
      { q: "22 + 5", a: 27 }, { q: "13 - 7", a: 6 }, { q: "14 + 6", a: 20 },
      { q: "24 + 6", a: 30 }, { q: "16 - 11", a: 5 }, { q: "25 - 9", a: 16 },
      { q: "23 - 7", a: 16 }, { q: "28 - 13", a: 15 }, { q: "17 + 12", a: 29 },
      { q: "15 + 9", a: 24 }, { q: "8 + 8", a: 16 }, { q: "11 + 11", a: 22 },
      { q: "12 + 6", a: 18 }, { q: "14 + 15", a: 29 }, { q: "12 + 14", a: 26 },
    ],
  },
  Tue: {
    label: "Tuesday",
    emoji: "🐰",
    mascot: "bunny",
    bg: "from-amber-100 via-yellow-100 to-lime-100",
    accent: "#F59E0B",
    soft: "#FFF4D6",
    problems: [
      { q: "15 + 11", a: 26 }, { q: "17 + 13", a: 30 }, { q: "9 + 9", a: 18 },
      { q: "19 - 8", a: 11 }, { q: "25 - 8", a: 17 }, { q: "24 + 5", a: 29 },
      { q: "11 + 15", a: 26 }, { q: "20 + 9", a: 29 }, { q: "13 + 16", a: 29 },
      { q: "17 - 11", a: 6 }, { q: "29 - 13", a: 16 }, { q: "13 + 15", a: 28 },
      { q: "15 + 15", a: 30 }, { q: "12 + 9", a: 21 }, { q: "23 + 4", a: 27 },
    ],
  },
  Wed: {
    label: "Wednesday",
    emoji: "🐸",
    mascot: "frog",
    bg: "from-lime-100 via-emerald-100 to-teal-100",
    accent: "#10B981",
    soft: "#D9F7E7",
    problems: [
      { q: "17 + 12", a: 29 }, { q: "13 + 9", a: 22 }, { q: "25 - 4", a: 21 },
      { q: "28 - 6", a: 22 }, { q: "13 + 13", a: 26 }, { q: "21 + 8", a: 29 },
      { q: "25 + 5", a: 30 }, { q: "13 + 12", a: 25 }, { q: "15 + 14", a: 29 },
      { q: "27 - 13", a: 14 }, { q: "26 - 7", a: 19 }, { q: "29 - 10", a: 19 },
      { q: "14 + 5", a: 19 }, { q: "23 + 5", a: 28 }, { q: "30 - 9", a: 21 },
    ],
  },
  Thu: {
    label: "Thursday",
    emoji: "🐳",
    mascot: "whale",
    bg: "from-sky-100 via-cyan-100 to-blue-100",
    accent: "#3B82F6",
    soft: "#DCEEFF",
    problems: [
      { q: "20 - 10", a: 10 }, { q: "20 - 11", a: 9 }, { q: "4 + 8", a: 12 },
      { q: "16 - 6", a: 10 }, { q: "21 + 7", a: 28 }, { q: "26 + 4", a: 30 },
      { q: "28 - 11", a: 17 }, { q: "24 + 5", a: 29 }, { q: "15 + 13", a: 28 },
      { q: "26 - 9", a: 17 }, { q: "20 - 13", a: 7 }, { q: "24 - 8", a: 16 },
      { q: "24 - 5", a: 19 }, { q: "17 + 3", a: 20 }, { q: "15 + 14", a: 29 },
    ],
  },
  Fri: {
    label: "Friday",
    emoji: "🦄",
    mascot: "unicorn",
    bg: "from-fuchsia-100 via-purple-100 to-violet-100",
    accent: "#A855F7",
    soft: "#F0E1FF",
    problems: [
      { q: "12 + 13", a: 25 }, { q: "10 + 15", a: 25 }, { q: "16 + 7", a: 23 },
      { q: "24 - 6", a: 18 }, { q: "13 - 5", a: 8 }, { q: "17 + 5", a: 22 },
      { q: "13 - 6", a: 7 }, { q: "10 + 12", a: 22 }, { q: "15 + 8", a: 23 },
      { q: "30 - 7", a: 23 },
    ],
  },
};

// Character config — each day has a kawaii friend
const CHARACTERS = {
  cat:     { body: "#FFC2A8", belly: "#FFE4D6", accent: "#FF8FA8", name: "Mochi" },
  bunny:   { body: "#FFE9A0", belly: "#FFF6D9", accent: "#FFB347", name: "Hop" },
  frog:    { body: "#A8E6CF", belly: "#D4F3E2", accent: "#5DBB87", name: "Pip" },
  whale:   { body: "#A8D8F0", belly: "#D8ECF7", accent: "#5BA3D0", name: "Bloop" },
  unicorn: { body: "#E5C9F2", belly: "#F2E0F7", accent: "#A56FBC", name: "Twinkle" },
};

const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const HAPPY_FACES = ["🥳", "🤩", "😻", "🦄", "🌟", "✨", "🎈"];
const ENCOURAGE = ["So close!", "Try again!", "You got this!", "Almost!", "Keep going!"];
const WIN_LINES = ["AMAZING", "SUPERSTAR", "WOW", "BRILLIANT", "FANTASTIC"];

// Sticker catalog — earned by getting answers right. Some are rare.
const STICKERS = [
  // Animals
  { id: "a1", e: "🦋", name: "Butterfly", cat: "Animals", rare: false, color: "#FFB3D9" },
  { id: "a2", e: "🦊", name: "Foxy",     cat: "Animals", rare: false, color: "#FFB088" },
  { id: "a3", e: "🐢", name: "Shelly",   cat: "Animals", rare: false, color: "#A8E6A0" },
  { id: "a4", e: "🐧", name: "Pengu",    cat: "Animals", rare: false, color: "#B8D4E8" },
  { id: "a5", e: "🦒", name: "Stretch",  cat: "Animals", rare: false, color: "#FFE082" },
  { id: "a6", e: "🦁", name: "Mighty",   cat: "Animals", rare: true,  color: "#FFD54F" },
  { id: "a7", e: "🐳", name: "Bigblue",  cat: "Animals", rare: true,  color: "#90CAF9" },
  // Yummy
  { id: "y1", e: "🧁", name: "Cuppy",    cat: "Yummy", rare: false, color: "#FFC1E0" },
  { id: "y2", e: "🍩", name: "Donut",    cat: "Yummy", rare: false, color: "#FFD4A8" },
  { id: "y3", e: "🍓", name: "Berry",    cat: "Yummy", rare: false, color: "#FF99A8" },
  { id: "y4", e: "🍦", name: "Scoops",   cat: "Yummy", rare: false, color: "#FFE5C4" },
  { id: "y5", e: "🍪", name: "Choccy",   cat: "Yummy", rare: false, color: "#D7B894" },
  { id: "y6", e: "🍕", name: "Slice",    cat: "Yummy", rare: false, color: "#FFC078" },
  { id: "y7", e: "🍰", name: "Birthday", cat: "Yummy", rare: true,  color: "#FFB3D9" },
  // Magic
  { id: "m1", e: "🌈", name: "Rainbow",  cat: "Magic", rare: false, color: "#C8B6FF" },
  { id: "m2", e: "🌟", name: "Twinkle",  cat: "Magic", rare: false, color: "#FFE066" },
  { id: "m3", e: "💫", name: "Whoosh",   cat: "Magic", rare: false, color: "#B5DEFF" },
  { id: "m4", e: "⚡", name: "Zappy",    cat: "Magic", rare: false, color: "#FFE066" },
  { id: "m5", e: "🪄", name: "Wand",     cat: "Magic", rare: true,  color: "#D9C5FF" },
  { id: "m6", e: "🔮", name: "Crystal",  cat: "Magic", rare: true,  color: "#C8B6FF" },
  { id: "m7", e: "🦄", name: "Lucky",    cat: "Magic", rare: true,  color: "#F0C8FF" },
  // Cool
  { id: "c1", e: "🚀", name: "Zoom",     cat: "Cool", rare: false, color: "#B5DEFF" },
  { id: "c2", e: "🎮", name: "Gamer",    cat: "Cool", rare: false, color: "#A8C8FF" },
  { id: "c3", e: "🤖", name: "Beep",     cat: "Cool", rare: false, color: "#C0C8D0" },
  { id: "c4", e: "🎨", name: "Splat",    cat: "Cool", rare: false, color: "#FFB3D9" },
  { id: "c5", e: "🎭", name: "Drama",    cat: "Cool", rare: false, color: "#FFC078" },
  { id: "c6", e: "👾", name: "Pixel",    cat: "Cool", rare: true,  color: "#A8E6A0" },
  { id: "c7", e: "🛸", name: "UFO",      cat: "Cool", rare: true,  color: "#B5DEFF" },
  // Nature
  { id: "n1", e: "🌸", name: "Bloom",    cat: "Nature", rare: false, color: "#FFCDE0" },
  { id: "n2", e: "🌻", name: "Sunny",    cat: "Nature", rare: false, color: "#FFE066" },
  { id: "n3", e: "🌳", name: "Tree",     cat: "Nature", rare: false, color: "#A8E6A0" },
  { id: "n4", e: "🌊", name: "Wavy",     cat: "Nature", rare: false, color: "#90CAF9" },
  { id: "n5", e: "☀️", name: "Sunshine", cat: "Nature", rare: false, color: "#FFE066" },
  { id: "n6", e: "🌙", name: "Moony",    cat: "Nature", rare: false, color: "#D9C5FF" },
  { id: "n7", e: "🏝️", name: "Island",  cat: "Nature", rare: true,  color: "#FFE5C4" },
];

const STICKER_CATEGORIES = ["Animals", "Yummy", "Magic", "Cool", "Nature"];

// ============================================================================
// Kawaii Character — animated SVG that blinks, reacts to mood, sparkles
// ============================================================================
function KawaiiCharacter({ type = "cat", mood = "idle", size = 130 }) {
  const [blink, setBlink] = useState(false);

  // Random blinking
  useEffect(() => {
    let cancelled = false;
    const schedule = () => {
      const wait = 2200 + Math.random() * 2800;
      setTimeout(() => {
        if (cancelled) return;
        setBlink(true);
        setTimeout(() => {
          if (cancelled) return;
          setBlink(false);
          schedule();
        }, 130);
      }, wait);
    };
    schedule();
    return () => { cancelled = true; };
  }, []);

  const c = CHARACTERS[type] || CHARACTERS.cat;
  const isHappy = mood === "happy" || mood === "party";
  const isThinking = mood === "thinking";
  const isParty = mood === "party";

  const animClass = isParty
    ? "kw-bounce-big"
    : isHappy
    ? "kw-bounce"
    : isThinking
    ? "kw-tilt"
    : "kw-drift";

  // Frog has eyes on top bumps; everyone else has eyes on the body
  const eyeY = type === "frog" ? 30 : 56;
  const lEyeX = type === "frog" ? 42 : 48;
  const rEyeX = type === "frog" ? 78 : 72;

  const renderEyes = () => {
    if (blink) {
      return (
        <g stroke="#2D3047" strokeWidth={1.6} strokeLinecap="round">
          <line x1={lEyeX - 3.5} y1={eyeY} x2={lEyeX + 3.5} y2={eyeY} />
          <line x1={rEyeX - 3.5} y1={eyeY} x2={rEyeX + 3.5} y2={eyeY} />
        </g>
      );
    }
    if (isHappy) {
      // Happy ^ ^ closed eyes
      return (
        <g stroke="#2D3047" strokeWidth={2.2} fill="none" strokeLinecap="round">
          <path d={`M ${lEyeX - 3.5} ${eyeY + 1.5} Q ${lEyeX} ${eyeY - 3.5} ${lEyeX + 3.5} ${eyeY + 1.5}`} />
          <path d={`M ${rEyeX - 3.5} ${eyeY + 1.5} Q ${rEyeX} ${eyeY - 3.5} ${rEyeX + 3.5} ${eyeY + 1.5}`} />
        </g>
      );
    }
    // Default open kawaii eyes with shine
    return (
      <g>
        <ellipse cx={lEyeX} cy={eyeY} rx={3} ry={3.8} fill="#2D3047" />
        <ellipse cx={rEyeX} cy={eyeY} rx={3} ry={3.8} fill="#2D3047" />
        <circle cx={lEyeX + 0.9} cy={eyeY - 1.2} r={1} fill="white" />
        <circle cx={rEyeX + 0.9} cy={eyeY - 1.2} r={1} fill="white" />
      </g>
    );
  };

  const renderMouth = () => {
    if (isHappy) {
      return (
        <path
          d="M 50 70 Q 60 80 70 70 Q 65 73 60 73 Q 55 73 50 70 Z"
          fill="#FF6B6B"
          stroke="#2D3047"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      );
    }
    if (isThinking) {
      return (
        <path
          d="M 53 70 Q 56.5 68 60 70 Q 63.5 72 67 70"
          stroke="#2D3047"
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
        />
      );
    }
    return (
      <path
        d="M 55 70 Q 60 73 65 70"
        stroke="#2D3047"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
    );
  };

  return (
    <div className={`relative inline-block ${animClass}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={`belly-${type}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={c.belly} />
            <stop offset="100%" stopColor={c.body} />
          </radialGradient>
        </defs>

        {/* Soft shadow under character */}
        <ellipse cx={60} cy={108} rx={28} ry={4} fill="rgba(0,0,0,0.08)" />

        {/* Character-specific top features (drawn before body so body covers bottom) */}
        {type === "cat" && (
          <g>
            <polygon points="34,30 42,12 50,30" fill={c.body} />
            <polygon points="70,30 78,12 86,30" fill={c.body} />
            <polygon points="38,28 42,18 46,28" fill={c.accent} opacity={0.7} />
            <polygon points="74,28 78,18 82,28" fill={c.accent} opacity={0.7} />
          </g>
        )}
        {type === "bunny" && (
          <g>
            <ellipse cx={42} cy={22} rx={6} ry={18} fill={c.body} transform="rotate(-10 42 22)" />
            <ellipse cx={78} cy={22} rx={6} ry={18} fill={c.body} transform="rotate(10 78 22)" />
            <ellipse cx={42} cy={24} rx={3} ry={12} fill={c.accent} opacity={0.6} transform="rotate(-10 42 24)" />
            <ellipse cx={78} cy={24} rx={3} ry={12} fill={c.accent} opacity={0.6} transform="rotate(10 78 24)" />
          </g>
        )}
        {type === "frog" && (
          <g>
            <circle cx={42} cy={30} r={12} fill={c.body} />
            <circle cx={78} cy={30} r={12} fill={c.body} />
            <circle cx={42} cy={30} r={8} fill="white" />
            <circle cx={78} cy={30} r={8} fill="white" />
          </g>
        )}
        {type === "whale" && (
          <g>
            {/* Spout */}
            <ellipse cx={60} cy={20} rx={3.5} ry={6} fill="#B3E5FC" opacity={0.7} />
            <circle cx={56} cy={14} r={2} fill="#B3E5FC" opacity={0.55} />
            <circle cx={64} cy={11} r={1.5} fill="#B3E5FC" opacity={0.55} />
            <circle cx={60} cy={7} r={2.5} fill="#B3E5FC" opacity={0.45} />
            {/* Tail */}
            <path d="M 90 70 L 110 60 L 105 80 Z" fill={c.body} />
          </g>
        )}
        {type === "unicorn" && (
          <g>
            {/* Horn with stripes */}
            <polygon points="56,24 64,24 60,4" fill="#FFE48A" />
            <line x1={58} y1={20} x2={62} y2={20} stroke="#E0A800" strokeWidth={1.5} />
            <line x1={59} y1={14} x2={61} y2={14} stroke="#E0A800" strokeWidth={1.5} />
            {/* Mane (rainbow blobs) */}
            <circle cx={36} cy={36} r={7} fill="#FF99CC" />
            <circle cx={32} cy={48} r={6} fill="#FFCC99" />
            <circle cx={42} cy={28} r={6} fill="#99CCFF" />
            <circle cx={50} cy={22} r={5} fill="#C8B6FF" />
          </g>
        )}

        {/* Main body */}
        <ellipse cx={60} cy={64} rx={36} ry={32} fill={c.body} />
        {/* Belly highlight */}
        <ellipse cx={60} cy={70} rx={22} ry={18} fill={`url(#belly-${type})`} opacity={0.55} />

        {/* Eyes */}
        {renderEyes()}

        {/* Cheeks — more visible when happy */}
        <ellipse cx={42} cy={68} rx={5} ry={3} fill="#FF8FA8" opacity={isHappy ? 0.7 : 0.3} />
        <ellipse cx={78} cy={68} rx={5} ry={3} fill="#FF8FA8" opacity={isHappy ? 0.7 : 0.3} />

        {/* Mouth */}
        {renderMouth()}

        {/* Cat extras */}
        {type === "cat" && (
          <g>
            <polygon points="58,66 62,66 60,69" fill={c.accent} />
            <line x1={28} y1={68} x2={42} y2={67} stroke="#999" strokeWidth={0.7} strokeLinecap="round" />
            <line x1={28} y1={72} x2={42} y2={71} stroke="#999" strokeWidth={0.7} strokeLinecap="round" />
            <line x1={92} y1={68} x2={78} y2={67} stroke="#999" strokeWidth={0.7} strokeLinecap="round" />
            <line x1={92} y1={72} x2={78} y2={71} stroke="#999" strokeWidth={0.7} strokeLinecap="round" />
          </g>
        )}

        {/* Bunny nose */}
        {type === "bunny" && (
          <ellipse cx={60} cy={66} rx={2.5} ry={1.8} fill={c.accent} />
        )}

        {/* Unicorn cheek star */}
        {type === "unicorn" && (
          <text x={84} y={73} fontSize={8}>⭐</text>
        )}

        {/* Mood-based effects */}
        {isHappy && (
          <g className="kw-sparkle">
            <text x={8} y={32} fontSize={14}>✨</text>
            <text x={98} y={26} fontSize={12}>✨</text>
            <text x={14} y={92} fontSize={10}>⭐</text>
            <text x={96} y={96} fontSize={10}>💖</text>
          </g>
        )}

        {isThinking && (
          <g>
            <circle cx={94} cy={20} r={3.5} fill="white" stroke="#bbb" strokeWidth={1} />
            <circle cx={102} cy={14} r={2.5} fill="white" stroke="#bbb" strokeWidth={1} />
            <circle cx={108} cy={9} r={1.8} fill="white" stroke="#bbb" strokeWidth={1} />
          </g>
        )}
      </svg>
    </div>
  );
}

export default function MathsApp() {
  const [day, setDay] = useState("Mon");
  const [progress, setProgress] = useState({}); // { Mon: { solved: [0,1,2], stars: 3 }, ... }
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [wrongCount, setWrongCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [winLine, setWinLine] = useState("");
  const [dayDone, setDayDone] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [bearMood, setBearMood] = useState("default"); // default, happy, thinking, party
  const [reviewMode, setReviewMode] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [helpRevealed, setHelpRevealed] = useState(false);
  const [name, setName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [stickers, setStickers] = useState([]); // earned sticker IDs
  const [showStickerBook, setShowStickerBook] = useState(false);
  const [stickerReveal, setStickerReveal] = useState(null); // { sticker, isNew }
  const [streak, setStreak] = useState(0);
  const correctTimer = useRef(null);
  const resetConfirmTimer = useRef(null);

  // Load saved progress
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("maths-progress");
        if (res?.value) setProgress(JSON.parse(res.value));
      } catch (e) {
        // no saved progress yet
      }
      try {
        const n = await window.storage.get("maths-name");
        if (n?.value) {
          setName(n.value);
        } else {
          // First launch — ask their name
          setShowNameModal(true);
        }
      } catch (e) {
        setShowNameModal(true);
      }
      try {
        const st = await window.storage.get("maths-stickers");
        if (st?.value) setStickers(JSON.parse(st.value));
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  // Save stickers
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set("maths-stickers", JSON.stringify(stickers));
      } catch (e) {}
    })();
  }, [stickers, loaded]);

  // Save progress whenever it changes
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set("maths-progress", JSON.stringify(progress));
      } catch (e) {}
    })();
  }, [progress, loaded]);

  // Find first unsolved problem when day changes
  useEffect(() => {
    const dayProg = progress[day] || { solved: [], stars: 0 };
    const problems = DAYS[day].problems;
    const firstUnsolved = problems.findIndex((_, i) => !dayProg.solved.includes(i));
    if (firstUnsolved === -1) {
      setDayDone(true);
      setIdx(0);
    } else {
      setDayDone(false);
      setIdx(firstUnsolved);
    }
    setInput("");
    setFeedback(null);
    setWrongCount(0);
    setShowHint(false);
    setBearMood("default");
    setReviewMode(false);
    setHelpRevealed(false);
  }, [day, loaded]);

  const current = DAYS[day].problems[idx];
  const dayProg = progress[day] || { solved: [], stars: 0 };
  const totalProblems = DAYS[day].problems.length;
  const solvedCount = dayProg.solved.length;

  const launchConfetti = () => {
    const colors = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#C780FA", "#FF9F45"];
    const pieces = Array.from({ length: 32 }).map((_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 1.2 + Math.random() * 0.8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: Math.random() * 360,
      shape: Math.random() > 0.5 ? "circle" : "square",
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 2200);
  };

  const advanceToNext = () => {
    const dp = progress[day] || { solved: [], stars: 0 };
    const remaining = DAYS[day].problems
      .map((_, i) => i)
      .filter((i) => !dp.solved.includes(i));
    if (remaining.length === 0) {
      setDayDone(true);
      setBearMood("party");
      launchConfetti();
      return;
    }
    const next = remaining.find((i) => i > idx) ?? remaining[0];
    setIdx(next);
    setInput("");
    setFeedback(null);
    setWrongCount(0);
    setShowHint(false);
    setHelpRevealed(false);
    setBearMood("default");
  };

  const handleNum = (n) => {
    if (feedback === "correct") return;
    if (feedback === "wrong") {
      // Wrong answer is showing — start fresh with this digit
      setInput(n);
      setFeedback(null);
      setBearMood("default");
      return;
    }
    if (input.length >= 3) return;
    setInput((p) => p + n);
    setShowHint(false);
  };

  const handleClear = () => {
    setInput("");
    setFeedback(null);
    setBearMood("default");
    setShowHint(false);
  };

  const handleBack = () => {
    if (feedback === "wrong") {
      setInput("");
      setFeedback(null);
      setBearMood("default");
      return;
    }
    setInput((p) => p.slice(0, -1));
  };

  const handleSubmit = () => {
    if (input === "" || feedback === "correct") return;
    const guess = parseInt(input, 10);
    if (guess === current.a) {
      // Correct! No auto-advance — let her enjoy the moment.
      setFeedback("correct");
      setBearMood("happy");
      setWinLine(WIN_LINES[Math.floor(Math.random() * WIN_LINES.length)]);
      launchConfetti();

      const newSolved = [...new Set([...dayProg.solved, idx])];
      const newStars = newSolved.length;
      const newProg = { ...progress, [day]: { solved: newSolved, stars: newStars } };
      setProgress(newProg);

      // Streak: bump only if this was the first attempt at this problem (no prior wrongs)
      const newStreak = wrongCount === 0 ? streak + 1 : 1;
      setStreak(newStreak);

      // Sticker chance: 30% on first-try wins, 60% on streak ≥5, guaranteed on day complete
      const dayComplete = newSolved.length === DAYS[day].problems.length;
      const baseChance = wrongCount === 0 ? (newStreak >= 5 ? 0.6 : 0.3) : 0;
      const earnSticker = dayComplete || Math.random() < baseChance;

      if (earnSticker) {
        // Pool of unearned stickers; rare only if day complete or big streak
        const allowRare = dayComplete || newStreak >= 5;
        const pool = STICKERS.filter(
          (s) => !stickers.includes(s.id) && (allowRare || !s.rare)
        );
        // If only rare ones left and not allowed, fall back to any unearned
        const finalPool = pool.length > 0
          ? pool
          : STICKERS.filter((s) => !stickers.includes(s.id));
        if (finalPool.length > 0) {
          const got = finalPool[Math.floor(Math.random() * finalPool.length)];
          // Delay reveal so confetti + win register first
          setTimeout(() => {
            setStickers((cur) => [...cur, got.id]);
            setStickerReveal({ sticker: got, isNew: true });
          }, 700);
        }
      }
    } else {
      // Wrong — leave the feedback visible.
      setFeedback("wrong");
      setBearMood("thinking");
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      if (newWrong >= 2) setShowHint(true);
      setStreak(0); // streak broken
    }
  };

  const skipProblem = () => {
    // Move to next without crediting (for stuck moments)
    const remaining = DAYS[day].problems
      .map((_, i) => i)
      .filter((i) => !dayProg.solved.includes(i) && i !== idx);
    if (remaining.length === 0) return;
    const next = remaining.find((i) => i > idx) ?? remaining[0];
    setIdx(next);
    setInput("");
    setFeedback(null);
    setWrongCount(0);
    setShowHint(false);
    setBearMood("default");
  };

  const resetDay = async () => {
    const newProg = { ...progress };
    delete newProg[day];
    setProgress(newProg);
    setIdx(0);
    setInput("");
    setFeedback(null);
    setWrongCount(0);
    setShowHint(false);
    setDayDone(false);
    setBearMood("default");
  };

  // Map internal mood → character mood for the KawaiiCharacter component
  const charMood =
    feedback === "correct" || bearMood === "happy" ? "happy" :
    bearMood === "party" ? "party" :
    bearMood === "thinking" ? "thinking" :
    "idle";

  const totalStarsAcross = Object.values(progress).reduce((s, d) => s + (d.stars || 0), 0);
  const totalProblemsAcross = Object.values(DAYS).reduce((s, d) => s + d.problems.length, 0);

  return (
    <div
      className={`min-h-screen w-full bg-gradient-to-br ${DAYS[day].bg} relative overflow-hidden`}
      style={{ fontFamily: "'Fredoka', 'Comic Sans MS', system-ui, sans-serif" }}
    >
      {/* Google Font + animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
        @keyframes pop { 0%{transform:scale(.6);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        @keyframes wiggle { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-6deg)} 75%{transform:rotate(6deg)} }
        @keyframes bounce-in { 0%{transform:translateY(20px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        @keyframes float-up { from{transform:translateY(100vh) rotate(0)} to{transform:translateY(-10vh) rotate(720deg)} }
        @keyframes pulse-ring { 0%{transform:scale(.95);opacity:.7} 100%{transform:scale(1.4);opacity:0} }
        @keyframes star-pop { 0%{transform:scale(0) rotate(-180deg)} 60%{transform:scale(1.3) rotate(20deg)} 100%{transform:scale(1) rotate(0)} }
        @keyframes drift { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes kw-drift { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-6px) rotate(1deg)} }
        @keyframes kw-bounce { 0%,100%{transform:translateY(0) scale(1)} 30%{transform:translateY(-14px) scale(1.05)} 60%{transform:translateY(0) scale(.97)} }
        @keyframes kw-bounce-big { 0%,100%{transform:translateY(0) rotate(-3deg) scale(1)} 25%{transform:translateY(-18px) rotate(5deg) scale(1.08)} 50%{transform:translateY(-8px) rotate(-5deg) scale(1.04)} 75%{transform:translateY(-14px) rotate(3deg) scale(1.06)} }
        @keyframes kw-tilt { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
        @keyframes kw-sparkle { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.15)} }
        .pop { animation: pop .35s ease-out; }
        .wiggle { animation: wiggle .5s ease-in-out; }
        .bounce-in { animation: bounce-in .4s ease-out; }
        .shake { animation: shake .4s ease-in-out; }
        .drift { animation: drift 2.5s ease-in-out infinite; }
        .star-pop { animation: star-pop .5s cubic-bezier(.34,1.56,.64,1); }
        .kw-drift { animation: kw-drift 3.2s ease-in-out infinite; }
        .kw-bounce { animation: kw-bounce 1s ease-in-out infinite; }
        .kw-bounce-big { animation: kw-bounce-big 1.4s ease-in-out infinite; }
        .kw-tilt { animation: kw-tilt 1.2s ease-in-out infinite; }
        .kw-sparkle { animation: kw-sparkle 1.4s ease-in-out infinite; transform-origin: center; }
      `}</style>

      {/* Decorative background blobs */}
      <div className="absolute top-10 -left-10 w-40 h-40 rounded-full opacity-20 blur-2xl" style={{ background: DAYS[day].accent }} />
      <div className="absolute bottom-20 -right-10 w-56 h-56 rounded-full opacity-20 blur-2xl" style={{ background: DAYS[day].accent }} />

      {/* Confetti layer */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {confetti.map((c) => (
          <div
            key={c.id}
            className="absolute"
            style={{
              left: `${c.left}%`,
              top: "-10vh",
              width: "12px",
              height: "12px",
              background: c.color,
              borderRadius: c.shape === "circle" ? "50%" : "2px",
              animation: `float-up ${c.duration}s ${c.delay}s ease-out forwards`,
              transform: `rotate(${c.rotate}deg)`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 py-3 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <KawaiiCharacter type={DAYS[day].mascot} mood="idle" size={42} />
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-stone-500">
                {name ? `Hi, ${name}!` : "Maths Time"}
              </div>
              <div className="text-sm font-bold text-stone-700 flex items-center gap-1">
                {totalStarsAcross > 0 ? (
                  <>
                    <span>{totalStarsAcross}</span>
                    <span>⭐</span>
                    <span className="text-stone-400 font-normal">collected</span>
                  </>
                ) : (
                  <span className="text-stone-500">Let's go!</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStickerBook(true)}
              className="relative px-3 py-1.5 rounded-full bg-white/80 backdrop-blur shadow-sm hover:bg-white flex items-center gap-1.5"
              title="My sticker book"
              aria-label="Open sticker book"
            >
              <span className="text-base">📒</span>
              <span className="text-xs font-bold text-stone-700">{stickers.length}/{STICKERS.length}</span>
              {stickerReveal && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => {
                if (resetConfirm) {
                  resetDay();
                  setResetConfirm(false);
                  clearTimeout(resetConfirmTimer.current);
                } else {
                  setResetConfirm(true);
                  clearTimeout(resetConfirmTimer.current);
                  resetConfirmTimer.current = setTimeout(() => setResetConfirm(false), 3000);
                }
              }}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold shadow-sm transition-all ${
                resetConfirm
                  ? "bg-rose-500 text-white"
                  : "bg-white/70 backdrop-blur text-stone-600 hover:bg-white"
              }`}
            >
              {resetConfirm ? "Sure?" : "↻"}
            </button>
          </div>
        </div>

        {/* Day tabs */}
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {DAY_KEYS.map((d) => {
            const isActive = d === day;
            const dStars = progress[d]?.stars || 0;
            const dTotal = DAYS[d].problems.length;
            const isComplete = dStars === dTotal;
            return (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`relative py-2 rounded-2xl font-bold transition-all ${
                  isActive
                    ? "text-white shadow-lg scale-105"
                    : "bg-white/70 text-stone-600 hover:bg-white"
                }`}
                style={isActive ? { background: DAYS[d].accent } : {}}
              >
                <div className="text-lg leading-none">{DAYS[d].emoji}</div>
                <div className="text-xs mt-0.5 leading-none">{d}</div>
                {isComplete && (
                  <div className="absolute -top-1.5 -right-1.5 text-sm">✅</div>
                )}
                <div className={`text-xs mt-0.5 ${isActive ? "text-white/90" : "text-stone-500"}`} style={{ fontSize: "0.625rem" }}>
                  {dStars}/{dTotal}
                </div>
              </button>
            );
          })}
        </div>

        {/* Progress bar — compact one-row layout */}
        <div className="mb-2 flex items-center gap-2">
          <div className="flex-1 h-3 rounded-full bg-white/60 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(solvedCount / totalProblems) * 100}%`,
                background: `linear-gradient(90deg, ${DAYS[day].accent}, ${DAYS[day].accent}dd)`,
              }}
            />
          </div>
          <div className="text-xs font-bold text-stone-700 whitespace-nowrap">
            {solvedCount}/{totalProblems} ⭐
          </div>
          {solvedCount > 0 && !dayDone && (
            <button
              onClick={() => setReviewMode((r) => !r)}
              className="text-xs font-bold px-2 py-1 rounded-full bg-white/70 backdrop-blur text-stone-600 shadow-sm whitespace-nowrap"
            >
              {reviewMode ? "← Back" : "📖"}
            </button>
          )}
        </div>

        {/* Main card */}
        {reviewMode ? (
          <div className="flex-1 bg-white/85 backdrop-blur rounded-3xl shadow-xl p-5 mb-4 bounce-in overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xl font-black text-stone-800">My answers</div>
                <div className="text-xs text-stone-500">Tap any one to try it again</div>
              </div>
              <div className="text-3xl drift">{DAYS[day].emoji}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DAYS[day].problems.map((p, i) => {
                const solved = dayProg.solved.includes(i);
                return (
                  <button
                    key={i}
                    disabled={!solved}
                    onClick={() => {
                      // Remove from solved + jump to it for a redo
                      const newSolved = dayProg.solved.filter((x) => x !== i);
                      setProgress({
                        ...progress,
                        [day]: { solved: newSolved, stars: newSolved.length },
                      });
                      setIdx(i);
                      setReviewMode(false);
                      setInput("");
                      setFeedback(null);
                      setWrongCount(0);
                      setShowHint(false);
                      setBearMood("default");
                    }}
                    className={`relative p-3 rounded-2xl text-left transition-all ${
                      solved
                        ? "bg-white border-2 shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer"
                        : "bg-stone-50 border-2 border-stone-200 opacity-50 cursor-not-allowed"
                    }`}
                    style={solved ? { borderColor: DAYS[day].soft } : {}}
                  >
                    <div className="font-bold text-stone-400 mb-0.5" style={{ fontSize: "0.625rem" }}>
                      Q{i + 1}
                    </div>
                    <div className="text-base font-black text-stone-700">
                      {p.q} =
                    </div>
                    <div
                      className="text-2xl font-black mt-0.5"
                      style={{ color: solved ? DAYS[day].accent : "#d6d3d1" }}
                    >
                      {solved ? p.a : "?"}
                    </div>
                    {solved && <div className="absolute top-2 right-2 text-base">⭐</div>}
                  </button>
                );
              })}
            </div>
          </div>
        ) : dayDone ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur rounded-3xl shadow-xl p-8 bounce-in">
            <div className="text-6xl mb-2 wiggle">🏆</div>
            <KawaiiCharacter type={DAYS[day].mascot} mood="party" size={110} />
            <div className="text-3xl font-black text-stone-800 mb-1 mt-2">YOU DID IT!</div>
            <div className="text-stone-600 mb-1">
              {CHARACTERS[DAYS[day].mascot].name} is so proud of you!
            </div>
            <div className="text-2xl mb-6">⭐ × {totalProblems}</div>
            <button
              onClick={() => setReviewMode(true)}
              className="mb-3 text-sm font-bold text-stone-600 underline"
            >
              📖 See my answers
            </button>
            <div className="flex gap-2 w-full">
              <button
                onClick={resetDay}
                className="flex-1 py-3 rounded-2xl bg-white border-2 border-stone-200 font-bold text-stone-700"
              >
                Do it again
              </button>
              <button
                onClick={() => {
                  const nextIdx = (DAY_KEYS.indexOf(day) + 1) % DAY_KEYS.length;
                  setDay(DAY_KEYS[nextIdx]);
                }}
                className="flex-1 py-3 rounded-2xl text-white font-bold shadow-md"
                style={{ background: DAYS[day].accent }}
              >
                Next day →
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Problem card */}
            <div
              key={idx + day}
              className={`bg-white/85 backdrop-blur rounded-3xl shadow-xl p-4 mb-3 relative bounce-in ${
                feedback === "wrong" ? "shake" : ""
              }`}
            >
              {/* Question number badge */}
              <div className="absolute -top-3 left-5 px-3 py-1 rounded-full text-white text-xs font-bold shadow" style={{ background: DAYS[day].accent }}>
                Question {idx + 1}
              </div>

              {/* Streak badge — only shows at 3+ */}
              {streak >= 3 && (
                <div className="absolute -top-3 right-5 px-3 py-1 rounded-full text-white text-xs font-black shadow flex items-center gap-1 pop"
                  style={{ background: streak >= 10 ? "#A855F7" : streak >= 5 ? "#F97316" : "#FB923C" }}
                >
                  <span>🔥</span>
                  <span>{streak} {streak >= 10 ? "UNSTOPPABLE!" : streak >= 5 ? "ON FIRE!" : "in a row!"}</span>
                </div>
              )}

              {/* Day mascot — animated kawaii character */}
              <div className="flex justify-center mb-1">
                <KawaiiCharacter
                  type={DAYS[day].mascot}
                  mood={charMood}
                  size={80}
                />
              </div>

              {/* Problem */}
              <div className="text-center">
                <div className="text-5xl font-black text-stone-800 mb-2 tracking-tight">
                  {current.q} = ?
                </div>

                {/* Input display */}
                <div className="relative inline-block">
                  <div
                    className={`h-16 px-6 rounded-2xl flex items-center justify-center text-4xl font-black border-4 transition-all ${
                      feedback === "correct"
                        ? "border-green-400 bg-green-50 text-green-600 pop"
                        : feedback === "wrong"
                        ? "border-rose-300 bg-rose-50 text-rose-500"
                        : "border-stone-200 bg-white text-stone-800"
                    }`}
                    style={{ minWidth: 120, ...(feedback === null ? { borderColor: DAYS[day].soft } : {}) }}
                  >
                    {input || <span className="text-stone-300">?</span>}
                  </div>
                  {feedback === "correct" && (
                    <div className="absolute inset-0 rounded-2xl border-4 border-green-400" style={{ animation: "pulse-ring .8s ease-out" }} />
                  )}
                </div>

                {/* Status text */}
                <div className="h-7 mt-3 font-bold flex items-center justify-center">
                  {feedback === "correct" && (
                    <span className="text-green-600 text-xl pop inline-block">
                      {winLine}{name ? `, ${name}` : ""}! ✨
                    </span>
                  )}
                  {feedback === "wrong" && (
                    <span className="text-rose-500 text-lg">
                      {ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)]} 💪
                    </span>
                  )}
                  {feedback === null && showHint && !helpRevealed && (
                    <button
                      onClick={() => setHelpRevealed(true)}
                      className="text-sm text-stone-500 underline font-semibold"
                    >
                      Stuck? Tap to see the answer
                    </button>
                  )}
                </div>

                {/* Inline help reveal */}
                {helpRevealed && feedback !== "correct" && (
                  <div
                    className="mt-3 p-4 rounded-2xl bounce-in"
                    style={{ background: DAYS[day].soft }}
                  >
                    <div className="text-sm font-bold text-stone-600 mb-1">
                      No worries — the answer is
                    </div>
                    <div
                      className="text-4xl font-black mb-2"
                      style={{ color: DAYS[day].accent }}
                    >
                      {current.a}
                    </div>
                    <button
                      onClick={() => {
                        // Skip without crediting a star — she didn't solve it
                        skipProblem();
                        setHelpRevealed(false);
                      }}
                      className="w-full py-2.5 rounded-xl bg-white text-stone-700 font-bold text-sm active:scale-95 shadow-sm"
                    >
                      Got it — let's keep going →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action area: fixed height so layout doesn't shift between keypad and Next button */}
            <div style={{ minHeight: 300 }}>
              {feedback === "correct" ? (
                <div className="flex flex-col items-center justify-center h-full pt-2">
                  <button
                    onClick={advanceToNext}
                    className="w-full py-6 rounded-3xl text-white font-black text-3xl shadow-xl active:scale-95 transition-transform pop"
                    style={{
                      background: `linear-gradient(135deg, ${DAYS[day].accent}, ${DAYS[day].accent}dd)`,
                    }}
                  >
                    Next problem →
                  </button>
                  <div className="text-stone-400 text-sm mt-3 italic">
                    Tap when you're ready ✨
                  </div>
                </div>
              ) : (
                <>
                  {/* Number pad */}
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <button
                        key={n}
                        onClick={() => handleNum(String(n))}
                        className="h-14 rounded-2xl bg-white shadow-md text-2xl font-black text-stone-700 active:scale-95 transition-transform hover:shadow-lg"
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={handleBack}
                      className="h-14 rounded-2xl bg-white/80 shadow-md text-xl font-bold text-stone-500 active:scale-95"
                      aria-label="Backspace"
                    >
                      ⌫
                    </button>
                    <button
                      onClick={() => handleNum("0")}
                      className="h-14 rounded-2xl bg-white shadow-md text-2xl font-black text-stone-700 active:scale-95"
                    >
                      0
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!input}
                      className="h-14 rounded-2xl text-white shadow-md text-xl font-black active:scale-95 disabled:opacity-40 transition-all"
                      style={{ background: DAYS[day].accent }}
                      aria-label="Check my answer"
                    >
                      ✓
                    </button>
                  </div>

                  {/* Skip / clear row */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleClear}
                      className="flex-1 py-2 rounded-xl bg-white/60 text-stone-600 font-semibold text-sm active:scale-95"
                    >
                      Clear
                    </button>
                    <button
                      onClick={skipProblem}
                      className="flex-1 py-2 rounded-xl bg-white/60 text-stone-600 font-semibold text-sm active:scale-95"
                    >
                      Skip ↷
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* === First-launch name modal === */}
      {showNameModal && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 60 }}
        >
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl bounce-in text-center">
            <div className="flex justify-center mb-2">
              <KawaiiCharacter type="cat" mood="happy" size={90} />
            </div>
            <div className="text-2xl font-black text-stone-800 mb-1">Hi there!</div>
            <div className="text-sm text-stone-500 mb-4">What should I call you?</div>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value.slice(0, 12))}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 text-center text-xl font-bold focus:outline-none focus:border-rose-400 mb-3"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && nameInput.trim()) {
                  const n = nameInput.trim();
                  setName(n);
                  window.storage.set("maths-name", n).catch(() => {});
                  setShowNameModal(false);
                }
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowNameModal(false)}
                className="flex-1 py-3 rounded-2xl bg-stone-100 text-stone-600 font-bold text-sm"
              >
                Skip
              </button>
              <button
                onClick={() => {
                  const n = nameInput.trim();
                  if (n) {
                    setName(n);
                    window.storage.set("maths-name", n).catch(() => {});
                  }
                  setShowNameModal(false);
                }}
                disabled={!nameInput.trim()}
                className="flex-1 py-3 rounded-2xl bg-rose-400 text-white font-bold disabled:opacity-40"
              >
                Let's go! →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Sticker reveal modal === */}
      {stickerReveal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          style={{ zIndex: 55 }}
          onClick={() => setStickerReveal(null)}
        >
          <div className="bounce-in flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {stickerReveal.sticker.rare && (
              <div className="text-yellow-300 text-2xl font-black tracking-widest mb-1 pop"
                style={{ textShadow: "0 0 12px rgba(255,200,0,0.8)" }}>
                ⭐ RARE! ⭐
              </div>
            )}
            <div className="text-white text-sm font-bold mb-2 uppercase tracking-wider">
              You got a sticker!
            </div>
            <div
              className={`w-56 h-56 rounded-3xl flex flex-col items-center justify-center shadow-2xl pop relative ${
                stickerReveal.sticker.rare ? "kw-bounce-big" : "kw-bounce"
              }`}
              style={{
                background: `linear-gradient(135deg, ${stickerReveal.sticker.color}, white)`,
                border: stickerReveal.sticker.rare ? "5px solid #FFD700" : "5px solid white",
                boxShadow: stickerReveal.sticker.rare
                  ? "0 0 40px rgba(255,215,0,0.6), 0 20px 40px rgba(0,0,0,0.3)"
                  : "0 20px 40px rgba(0,0,0,0.3)",
              }}
            >
              <div className="text-8xl mb-1">{stickerReveal.sticker.e}</div>
              <div className="text-stone-700 font-black text-lg">{stickerReveal.sticker.name}</div>
              {stickerReveal.sticker.rare && (
                <>
                  <div className="absolute top-2 right-3 text-2xl kw-sparkle">✨</div>
                  <div className="absolute bottom-3 left-3 text-xl kw-sparkle" style={{ animationDelay: "0.3s" }}>✨</div>
                </>
              )}
            </div>
            <div className="text-white/80 text-xs mt-3 mb-4">
              {stickers.length} of {STICKERS.length} collected
            </div>
            <button
              onClick={() => setStickerReveal(null)}
              className="px-8 py-3 rounded-full bg-white text-stone-800 font-black shadow-lg active:scale-95"
            >
              Cool! ✨
            </button>
          </div>
        </div>
      )}

      {/* === Sticker book modal === */}
      {showStickerBook && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
          style={{ zIndex: 58 }}
          onClick={() => setShowStickerBook(false)}
        >
          <div
            className="bg-gradient-to-b from-amber-50 to-orange-50 rounded-t-3xl w-full max-w-md shadow-2xl bounce-in flex flex-col"
            style={{
              border: "3px solid #d4a373",
              maxHeight: "92vh",
              paddingTop: "env(safe-area-inset-top, 0px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Book header */}
            <div className="px-5 py-4 border-b-2 border-dashed border-amber-200 flex items-center justify-between">
              <div>
                <div className="text-xl font-black text-amber-900">📒 My Sticker Book</div>
                <div className="text-xs text-amber-700 font-bold">
                  {stickers.length} of {STICKERS.length} collected
                  {stickers.length === STICKERS.length && " — ALL DONE! 🎉"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStickerBook(false)}
                className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl font-black text-stone-700 shadow-md active:scale-90 transition-transform"
                aria-label="Close sticker book"
              >
                ✕
              </button>
            </div>

            {/* Pages */}
            <div className="flex-1 overflow-y-auto p-4">
              {STICKER_CATEGORIES.map((cat) => {
                const catStickers = STICKERS.filter((s) => s.cat === cat);
                const found = catStickers.filter((s) => stickers.includes(s.id)).length;
                return (
                  <div key={cat} className="mb-5">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <div className="font-black text-amber-900 text-sm uppercase tracking-wider">
                        {cat}
                      </div>
                      <div className="text-xs font-bold text-amber-700">
                        {found}/{catStickers.length}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {catStickers.map((s) => {
                        const earned = stickers.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all ${
                              earned
                                ? "shadow-md"
                                : "bg-stone-100/70 border-2 border-dashed border-stone-300"
                            }`}
                            style={
                              earned
                                ? {
                                    background: `linear-gradient(135deg, ${s.color}, white)`,
                                    border: s.rare ? "2px solid #FFD700" : "2px solid white",
                                  }
                                : {}
                            }
                          >
                            {earned ? (
                              <>
                                <div className="text-3xl">{s.e}</div>
                                <div className="font-bold text-stone-700 mt-0.5" style={{ fontSize: "0.625rem" }}>
                                  {s.name}
                                </div>
                                {s.rare && (
                                  <div className="absolute top-0.5 right-1" style={{ fontSize: "0.625rem" }}>⭐</div>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="text-3xl opacity-30">❓</div>
                                {s.rare && (
                                  <div className="font-bold text-amber-600 mt-0.5" style={{ fontSize: "0.5rem" }}>
                                    RARE
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="text-center text-xs text-amber-700 italic mt-2 pb-4">
                Get answers right to find more stickers ✨<br />
                Rare stickers come from streaks of 5+ or finishing a day!
              </div>
            </div>

            {/* Pinned bottom action bar — always visible, big tap target */}
            <div
              className="px-4 py-3 border-t-2 border-dashed border-amber-200 bg-amber-50"
              style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
            >
              <button
                type="button"
                onClick={() => setShowStickerBook(false)}
                className="w-full py-3 rounded-2xl bg-amber-500 text-white text-lg font-black shadow-md active:scale-95 transition-transform"
              >
                Done ✨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
