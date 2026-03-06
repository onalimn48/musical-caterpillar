export const STORY_CHAPTERS = [
  {
    id: 1,
    title: "The Enchanted Gate",
    narrative: "Deep in the Whispering Woods, you discover a moss-covered gate sealed with musical runes. To open it, you must name the notes that form the ancient password...",
    word: { w: "BADGE", h: "A crest on the gate" },
    bg: "#1a2e1a",
    scene: (done) => (
      <svg viewBox="0 0 360 200" style={{ width: "100%", maxWidth: 360, borderRadius: 16 }}>
        <defs>
          <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0d1b2a"/><stop offset="100%" stopColor="#1b3a2a"/></linearGradient>
          <linearGradient id="gate1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b6914"/><stop offset="100%" stopColor="#5c4510"/></linearGradient>
        </defs>
        <rect width="360" height="200" fill="url(#sky1)"/>
        {/* Stars */}
        {[40,90,140,200,260,310,70,170,250].map((x,i)=><circle key={i} cx={x} cy={10+i*8%60} r={1+i%2} fill="#fffbe6" opacity={0.5+i%3*0.2}/>)}
        {/* Trees */}
        <polygon points="30,200 50,80 70,200" fill="#0a3a1a" opacity=".8"/>
        <polygon points="290,200 310,90 330,200" fill="#0a3a1a" opacity=".8"/>
        <polygon points="10,200 35,100 60,200" fill="#0d4520" opacity=".6"/>
        <polygon points="300,200 325,95 350,200" fill="#0d4520" opacity=".6"/>
        {/* Ground */}
        <ellipse cx="180" cy="210" rx="200" ry="40" fill="#1a3a1a"/>
        {/* Gate */}
        <rect x="135" y="70" width="15" height="120" fill="url(#gate1)" rx="3"/>
        <rect x="210" y="70" width="15" height="120" fill="url(#gate1)" rx="3"/>
        <path d="M135 70 Q180 30 225 70" fill="none" stroke="#8b6914" strokeWidth="8"/>
        <path d="M140 70 Q180 35 220 70" fill="none" stroke="#d4a017" strokeWidth="3"/>
        {/* Runes on gate */}
        {["♪","♫","♩"].map((r,i)=><text key={i} x={165+i*15} y={120+i*12} fontSize="14" fill={done?"#4ade80":"#f59e0b"} textAnchor="middle" fontFamily="serif" opacity={done?1:0.6+Math.sin(i)*0.3}>{r}</text>)}
        {/* Glow when done */}
        {done && <ellipse cx="180" cy="110" rx="50" ry="60" fill="#4ade80" opacity=".15"/>}
        {/* Moss */}
        {[140,155,170,185,200,215].map((x,i)=><circle key={`m${i}`} cx={x} cy={188+i%3*2} r={3+i%2} fill="#2d5a2d" opacity=".7"/>)}
        {/* Fireflies */}
        <circle cx="100" cy="100" r="2" fill="#facc15" opacity=".8"><animate attributeName="opacity" values=".3;1;.3" dur="2s" repeatCount="indefinite"/></circle>
        <circle cx="260" cy="80" r="2" fill="#facc15" opacity=".6"><animate attributeName="opacity" values=".6;1;.6" dur="1.5s" repeatCount="indefinite"/></circle>
      </svg>
    ),
  },
  {
    id: 2,
    title: "The Dragon's Bridge",
    narrative: "Beyond the gate lies a canyon with a crumbling bridge. A young dragon guards it, demanding a toll — not gold, but a word spelled in music!",
    word: { w: "CAGE", h: "The dragon's old home" },
    bg: "#2a1a0a",
    scene: (done) => (
      <svg viewBox="0 0 360 200" style={{ width: "100%", maxWidth: 360, borderRadius: 16 }}>
        <defs>
          <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1a0a2e"/><stop offset="60%" stopColor="#4a1a0a"/><stop offset="100%" stopColor="#2a1a0a"/></linearGradient>
        </defs>
        <rect width="360" height="200" fill="url(#sky2)"/>
        {/* Lava glow */}
        <ellipse cx="180" cy="195" rx="160" ry="15" fill="#ff4500" opacity=".3"/>
        <ellipse cx="180" cy="190" rx="120" ry="8" fill="#ff6b35" opacity=".2"/>
        {/* Canyon walls */}
        <polygon points="0,100 0,200 120,200 100,130" fill="#3a2010"/>
        <polygon points="360,100 360,200 240,200 260,130" fill="#3a2010"/>
        {/* Bridge */}
        <line x1="100" y1="130" x2="260" y2="130" stroke="#8b6914" strokeWidth="5"/>
        <line x1="100" y1="130" x2="100" y2="115" stroke="#6b5410" strokeWidth="3"/>
        <line x1="260" y1="130" x2="260" y2="115" stroke="#6b5410" strokeWidth="3"/>
        {[120,150,180,210,240].map((x,i)=><line key={i} x1={x} y1="130" x2={x} y2="115" stroke="#6b5410" strokeWidth="1.5" strokeDasharray="2 2"/>)}
        <path d="M100 115 Q180 105 260 115" fill="none" stroke="#8b6914" strokeWidth="2"/>
        {/* Dragon */}
        <ellipse cx="180" cy="95" rx="20" ry="14" fill={done?"#4ade80":"#dc2626"} opacity=".9"/>
        <circle cx="180" cy="78" r="10" fill={done?"#4ade80":"#dc2626"}/>
        <circle cx="176" cy="76" r="2.5" fill="#fffbe6"/><circle cx="184" cy="76" r="2.5" fill="#fffbe6"/>
        <circle cx="176.5" cy="76.5" r="1.2" fill="#1a1a2e"/><circle cx="184.5" cy="76.5" r="1.2" fill="#1a1a2e"/>
        {/* Wings */}
        <path d="M160 90 Q145 70 155 85" fill={done?"#22c55e":"#b91c1c"} opacity=".7"/>
        <path d="M200 90 Q215 70 205 85" fill={done?"#22c55e":"#b91c1c"} opacity=".7"/>
        {/* Fire breath (if not done) */}
        {!done && <><ellipse cx="180" cy="62" rx="6" ry="4" fill="#f59e0b" opacity=".7"><animate attributeName="ry" values="4;6;4" dur="0.5s" repeatCount="indefinite"/></ellipse>
        <ellipse cx="180" cy="55" rx="4" ry="3" fill="#fbbf24" opacity=".5"><animate attributeName="opacity" values=".3;.7;.3" dur="0.4s" repeatCount="indefinite"/></ellipse></>}
        {/* Happy puffs when done */}
        {done && <text x="180" y="60" textAnchor="middle" fontSize="16">💚</text>}
      </svg>
    ),
  },
  {
    id: 3,
    title: "The Crystal Cave",
    narrative: "Inside the mountain, crystals hum with ancient melodies. A sealed chamber blocks your path — its lock responds only to the language of music notes.",
    word: { w: "EDGE", h: "The crystal's sharp side" },
    bg: "#0a1a2e",
    scene: (done) => (
      <svg viewBox="0 0 360 200" style={{ width: "100%", maxWidth: 360, borderRadius: 16 }}>
        <rect width="360" height="200" fill="#0a0e1a"/>
        {/* Cave walls */}
        <path d="M0 0 L60 70 L20 200 L0 200Z" fill="#1a1e2e"/>
        <path d="M360 0 L300 70 L340 200 L360 200Z" fill="#1a1e2e"/>
        <path d="M0 0 L120 30 L180 0 L240 25 L360 0 L360 10 L0 10Z" fill="#1a1e2e"/>
        {/* Crystals */}
        {[{x:80,h:60,c:"#818cf8"},{x:130,h:45,c:"#c084fc"},{x:220,h:55,c:"#38bdf8"},{x:270,h:40,c:"#e879f9"},{x:160,h:35,c:"#67e8f9"}].map((cr,i)=>(
          <g key={i}>
            <polygon points={`${cr.x-8},200 ${cr.x},${200-cr.h} ${cr.x+8},200`}
              fill={done?cr.c:cr.c} opacity={done?0.9:0.5}/>
            {done&&<polygon points={`${cr.x-8},200 ${cr.x},${200-cr.h} ${cr.x+8},200`}
              fill={cr.c} opacity=".3"><animate attributeName="opacity" values=".2;.5;.2" dur={`${1.5+i*0.3}s`} repeatCount="indefinite"/></polygon>}
          </g>
        ))}
        {/* Stalactites */}
        {[50,110,190,250,320].map((x,i)=><polygon key={`st${i}`} points={`${x-5},0 ${x},${25+i*5} ${x+5},0`} fill="#2a2e3e"/>)}
        {/* Sealed door */}
        <rect x="145" y="90" width="70" height="100" fill="#2a2040" rx="5" stroke={done?"#4ade80":"#6366f1"} strokeWidth="2"/>
        <circle cx="180" cy="135" r="8" fill="none" stroke={done?"#4ade80":"#6366f1"} strokeWidth="2"/>
        {done && <path d="M176 135 L180 140 L188 130" stroke="#4ade80" strokeWidth="2.5" fill="none"/>}
        {/* Glow particles */}
        {done && [150,170,190,210].map((x,i)=><circle key={`g${i}`} cx={x} cy={100+i*10} r="2" fill="#4ade80" opacity=".6"><animate attributeName="cy" values={`${100+i*10};${90+i*10};${100+i*10}`} dur={`${2+i*0.5}s`} repeatCount="indefinite"/></circle>)}
      </svg>
    ),
  },
  {
    id: 4,
    title: "The Enchantress's Garden",
    narrative: "You emerge into a magical garden where flowers bloom to the sound of music. The enchantress offers you a gift — if you can name her favorite melody.",
    word: { w: "GRACE", h: "Elegant beauty" },
    bg: "#1a2a1a",
    scene: (done) => (
      <svg viewBox="0 0 360 200" style={{ width: "100%", maxWidth: 360, borderRadius: 16 }}>
        <defs>
          <linearGradient id="sky4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1a0a3a"/><stop offset="100%" stopColor="#1a3a2a"/></linearGradient>
        </defs>
        <rect width="360" height="200" fill="url(#sky4)"/>
        {/* Moon */}
        <circle cx="300" cy="35" r="20" fill="#fef3c7" opacity=".8"/>
        <circle cx="308" cy="30" r="18" fill="#1a0a3a"/>
        {/* Ground */}
        <ellipse cx="180" cy="210" rx="200" ry="35" fill="#1a3a1a"/>
        {/* Flowers */}
        {[{x:60,c:"#f472b6"},{x:100,c:"#c084fc"},{x:150,c:"#fb923c"},{x:210,c:"#38bdf8"},{x:260,c:"#f472b6"},{x:310,c:"#a78bfa"}].map((f,i)=>(
          <g key={i}>
            <line x1={f.x} y1="200" x2={f.x} y2={155-i%3*5} stroke="#16a34a" strokeWidth="2"/>
            <circle cx={f.x} cy={150-i%3*5} r={done?8:5} fill={f.c} opacity={done?0.9:0.5}>
              {done&&<animate attributeName="r" values="7;9;7" dur={`${2+i*0.3}s`} repeatCount="indefinite"/>}
            </circle>
            {done&&<circle cx={f.x} cy={150-i%3*5} r="3" fill="#fef3c7" opacity=".6"/>}
          </g>
        ))}
        {/* Enchantress */}
        <ellipse cx="180" cy="155" rx="12" ry="25" fill="#7c3aed"/>
        <circle cx="180" cy="125" r="10" fill="#fde68a"/>
        <circle cx="176" cy="123" r="2" fill="#5b21b6"/><circle cx="184" cy="123" r="2" fill="#5b21b6"/>
        <path d="M175 128Q180 132 185 128" stroke="#7c3aed" strokeWidth="1.5" fill="none"/>
        {/* Hat */}
        <polygon points="165,118 180,95 195,118" fill="#5b21b6"/>
        <circle cx="180" cy="93" r="3" fill="#fbbf24"/>
        {/* Wand */}
        <line x1="195" y1="140" x2="215" y2="120" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="215" cy="118" r="3" fill="#fbbf24"><animate attributeName="opacity" values=".5;1;.5" dur="1s" repeatCount="indefinite"/></circle>
        {/* Sparkles */}
        {done && [140,170,200,230].map((x,i)=><text key={i} x={x} y={130+i*8} fontSize="10" opacity=".7"><animate attributeName="opacity" values=".3;1;.3" dur={`${1+i*0.4}s`} repeatCount="indefinite"/>✨</text>)}
      </svg>
    ),
  },
  {
    id: 5,
    title: "The Wizard's Tower",
    narrative: "The tower spirals into the clouds, its door sealed by the most complex spell yet. Inside lies the legendary Staff of Songs. Focus — this one is tricky!",
    word: { w: "FADED", h: "Lost its color" },
    bg: "#1a1a2e",
    scene: (done) => (
      <svg viewBox="0 0 360 200" style={{ width: "100%", maxWidth: 360, borderRadius: 16 }}>
        <defs>
          <linearGradient id="sky5" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0a0a1e"/><stop offset="100%" stopColor="#1a1a3e"/></linearGradient>
        </defs>
        <rect width="360" height="200" fill="url(#sky5)"/>
        {/* Stars */}
        {[30,70,120,180,240,290,340,55,160,310].map((x,i)=><circle key={i} cx={x} cy={8+i*6%50} r={0.8+i%3*0.5} fill="#fffbe6" opacity={0.4+i%4*0.15}/>)}
        {/* Tower */}
        <rect x="155" y="50" width="50" height="150" fill="#2a2040" rx="3"/>
        <polygon points="150,50 180,15 210,50" fill="#3a2060"/>
        <circle cx="180" cy="25" r="4" fill="#fbbf24"><animate attributeName="opacity" values=".5;1;.5" dur="1.5s" repeatCount="indefinite"/></circle>
        {/* Windows */}
        {[75,105,140].map((y,i)=><rect key={i} x="170" y={y} width="20" height="15" rx="8" fill={done?"#4ade80":"#fbbf24"} opacity={done?.7:.3}/>)}
        {/* Door */}
        <rect x="168" y="170" width="24" height="30" fill="#1a1030" rx="12" stroke={done?"#4ade80":"#6366f1"} strokeWidth="2"/>
        {/* Clouds */}
        <ellipse cx="80" cy="40" rx="40" ry="15" fill="#2a2a4e" opacity=".5"/>
        <ellipse cx="290" cy="55" rx="35" ry="12" fill="#2a2a4e" opacity=".4"/>
        {/* Lightning when not done */}
        {!done && <path d="M100 0 L105 30 L95 32 L102 60" stroke="#818cf8" strokeWidth="1.5" fill="none" opacity=".4"><animate attributeName="opacity" values="0;.6;0" dur="3s" repeatCount="indefinite"/></path>}
        {/* Celebration */}
        {done && <><text x="180" y="8" textAnchor="middle" fontSize="14">⭐</text><text x="160" y="45" fontSize="10">🎵</text><text x="200" y="45" fontSize="10">🎵</text></>}
      </svg>
    ),
  },
  {
    id: 6,
    title: "The Final Spell",
    narrative: "With the Staff of Songs in hand, you stand before the Great Hall. One final melody will break the curse and restore music to the realm forever!",
    word: { w: "DANCE", h: "Move to music 💃" },
    bg: "#2a1a3a",
    scene: (done) => (
      <svg viewBox="0 0 360 200" style={{ width: "100%", maxWidth: 360, borderRadius: 16 }}>
        <defs>
          <linearGradient id="sky6" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={done?"#0a2a1a":"#1a0a2a"}/><stop offset="100%" stopColor={done?"#1a4a2a":"#2a1a3a"}/></linearGradient>
          <radialGradient id="glow6" cx="50%" cy="50%"><stop offset="0%" stopColor={done?"#4ade80":"#c084fc"} stopOpacity=".3"/><stop offset="100%" stopColor="transparent"/></radialGradient>
        </defs>
        <rect width="360" height="200" fill="url(#sky6)"/>
        {/* Grand hall pillars */}
        {[60,120,240,300].map((x,i)=><rect key={i} x={x-8} y="40" width="16" height="160" fill="#2a2040" rx="4"/>)}
        {/* Arch */}
        <path d="M60 40 Q180 -10 300 40" fill="none" stroke="#5b21b6" strokeWidth="6"/>
        <path d="M65 40 Q180 -5 295 40" fill="none" stroke="#7c3aed" strokeWidth="2"/>
        {/* Central glow */}
        <circle cx="180" cy="110" r="60" fill="url(#glow6)"/>
        {/* Hero with staff */}
        <ellipse cx="180" cy="155" rx="10" ry="22" fill="#3b82f6"/>
        <circle cx="180" cy="128" r="9" fill="#fde68a"/>
        <circle cx="176" cy="126" r="2" fill="#1e1b4b"/><circle cx="184" cy="126" r="2" fill="#1e1b4b"/>
        <path d="M176 131Q180 134 184 131" stroke="#92400e" strokeWidth="1" fill="none"/>
        {/* Staff */}
        <line x1="195" y1="130" x2="200" y2="80" stroke="#d4a017" strokeWidth="2.5"/>
        <circle cx="200" cy="78" r="5" fill={done?"#4ade80":"#c084fc"}><animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite"/></circle>
        {/* Musical notes floating */}
        {done && ["♪","♫","♩","♬","♪","♫"].map((n,i)=>(
          <text key={i} x={80+i*40} y={40+i%3*20} fontSize="16" fill={["#4ade80","#fbbf24","#f472b6","#38bdf8","#a78bfa","#fb923c"][i]} opacity=".8">
            <animate attributeName="y" values={`${40+i%3*20};${30+i%3*20};${40+i%3*20}`} dur={`${2+i*0.3}s`} repeatCount="indefinite"/>
            {n}
          </text>
        ))}
        {/* Victory text */}
        {done && <text x="180" y="190" textAnchor="middle" fontSize="11" fill="#4ade80" fontFamily="'Fredoka',sans-serif" fontWeight="700">🎵 Music Restored! 🎵</text>}
      </svg>
    ),
  },
];
