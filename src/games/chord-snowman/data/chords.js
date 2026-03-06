export const CHORD_TYPES = [
  { name: "Major", symbol: "", intervals: [0, 4, 7, 12], emoji: "😊", color: "#4ade80",
    desc: "Bright and happy! Built with a major 3rd (4 half steps) and a perfect 5th (7 half steps), topped with the octave." },
  { name: "Minor", symbol: "m", intervals: [0, 3, 7, 12], emoji: "😢", color: "#60a5fa",
    desc: "Sad and gentle. Built with a minor 3rd (3 half steps) and a perfect 5th (7 half steps), topped with the octave." },
  { name: "Augmented", symbol: "+", intervals: [0, 4, 8, 12], emoji: "😵", color: "#f472b6",
    desc: "Tense and dreamy — like a major chord stretched wider. Both intervals are major 3rds (4 half steps each), plus the octave." },
  { name: "Diminished 7th", symbol: "°7", intervals: [0, 3, 6, 9], emoji: "😰", color: "#fb923c",
    desc: "Dark and suspenseful — four notes stacked in minor 3rds (3 half steps each). Its symmetry gives it a uniquely eerie sound." },
];

export const CHORD_EAR_LEVELS = [
  { id: 0, name: "Major vs Minor", types: [0, 1], desc: "Happy or sad? Learn the two most common chords", needed: 8, lives: 5 },
  { id: 1, name: "Add Diminished", types: [0, 1, 3], desc: "Now with the dark, suspenseful chord", needed: 8, lives: 4 },
  { id: 2, name: "Add Augmented", types: [0, 1, 2, 3], desc: "All four types — the full challenge!", needed: 10, lives: 3 },
];
