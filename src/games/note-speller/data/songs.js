// All songs in C major, melody (right hand) only
// Sources cross-referenced from multiple music education sites
export const SONGS = [
  {
    id: 1, title: "Ode to Joy", composer: "Beethoven", genre: "Classical",
    color: "#7c3aed",
    notes: ["E","E","F","G","G","F","E","D","C","C","D","E","E","D","D",
            "E","E","F","G","G","F","E","D","C","C","D","E","D","C","C"],
    // 4/4 time, quarter=1 beat. E.D D is dotted quarter + eighth + half
    rhythm: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1.5,0.5,2,
             1,1,1,1, 1,1,1,1, 1,1,1,1, 1.5,0.5,2],
  },
  {
    id: 2, title: "Twinkle Twinkle", composer: "Traditional", genre: "Folk",
    color: "#3b82f6",
    notes: ["C","C","G","G","A","A","G",
            "F","F","E","E","D","D","C",
            "G","G","F","F","E","E","D",
            "G","G","F","F","E","E","D",
            "C","C","G","G","A","A","G",
            "F","F","E","E","D","D","C"],
    // quarter quarter quarter quarter quarter quarter half, repeated
    rhythm: [1,1,1,1,1,1,2,
             1,1,1,1,1,1,2,
             1,1,1,1,1,1,2,
             1,1,1,1,1,1,2,
             1,1,1,1,1,1,2,
             1,1,1,1,1,1,2],
  },
  {
    id: 3, title: "Jingle Bells", composer: "Pierpont", genre: "Holiday",
    color: "#dc2626",
    notes: ["E","E","E","E","E","E","E","G","C","D","E",
            "F","F","F","F","F","E","E","E","G","G","F","D","C"],
    // E E E(h) | E E E(h) | E G C D | E(w)
    // F F F F | F E E E | G G F D | C(w)
    rhythm: [1,1,2, 1,1,2, 1,1,1,1, 4,
             1,1,1,1, 1,1,0.5,0.5, 1,1,1,1, 4],
  },
  {
    id: 4, title: "Amazing Grace", composer: "Newton", genre: "Folk",
    color: "#22c55e",
    notes: ["G","C","E","C","E","D","C","A","G","C","E","C","E","D","G"],
    // 3/4 time: pickup(1) | C(2) E(1) C(1) E(1) | D(2) C(1) | A(2) G(1) | C(2) E(1) C(1) E(1) | D(2) G(2)
    rhythm: [1, 2,1,1,1, 2,1, 2,1, 2,1,1,1, 2,2],
  },
  {
    id: 5, title: "Mary Had a Little Lamb", composer: "Traditional", genre: "Folk",
    color: "#f59e0b",
    notes: ["E","D","C","D","E","E","E",
            "D","D","D","E","G","G",
            "E","D","C","D","E","E","E","E",
            "D","D","E","D","C"],
    // E D C D | E E E(h) | D D D(h) | E G G(h)
    // E D C D | E E E E | D D E D | C(w)
    rhythm: [1,1,1,1, 1,1,2, 1,1,2, 1,1,2,
             1,1,1,1, 1,1,1,1, 1,1,1,1, 4],
  },
  {
    id: 6, title: "When the Saints", composer: "Traditional", genre: "Folk",
    color: "#e879f9",
    notes: ["C","E","F","G","C","E","F","G","C","E","F","G","E","C","E","D",
            "E","E","D","C","C","E","G","G","F","E","F","G","E","C","D","C"],
    // Oh when the saints (pickup feel): C(1) E(1) F(1) G(4) repeated pattern
    rhythm: [1,1,1,4, 1,1,1,4, 1,1,1,2, 1,1,1,2,
             1,1,1,2, 1,1,1,1, 1,1,1,2, 1,1,1,4],
  },
  {
    id: 7, title: "Shake It Off", composer: "Taylor Swift", genre: "Pop",
    color: "#ec4899",
    notes: ["C5","C5","D5","D5","D5","E5","C5","A","G","E","C",
            "C5","C5","D5","D5","D5","E5","C5","A","G","E","C",
            "C5","C5","D5","D5","D5","E5","C5","A","G","E","C",
            "C5","D5","E5","C5","C5","D5","E5","C5"],
    // Syncopated pop feel — eighth notes with longer holds
    rhythm: [0.5,0.5,0.5,0.5,0.5,1, 1,0.5,0.5,0.5,1,
             0.5,0.5,0.5,0.5,0.5,1, 1,0.5,0.5,0.5,1,
             0.5,0.5,0.5,0.5,0.5,1, 1,0.5,0.5,0.5,1,
             0.5,0.5,1,1, 0.5,0.5,1,2],
  },
  {
    id: 8, title: "Espresso", composer: "Sabrina Carpenter", genre: "Pop",
    color: "#f97316",
    notes: ["D","A","C5","C5","C5","E5","A","A","A","B",
            "G","G","G","B","C5","B","B","A",
            "C5","C5","C5","E5","A","A","A","B",
            "G","G","B","C5","B","B","A"],
    // Laid-back pop groove (10+8+8+7=33)
    rhythm: [1,0.5,0.5,0.5,0.5,1, 0.5,0.5,0.5,1.5,
             0.5,0.5,0.5,0.5,1, 0.5,0.5,2,
             0.5,0.5,0.5,0.5,1, 0.5,0.5,1.5,
             0.5,0.5,1,0.5,0.5,0.5,2],
  },
  {
    id: 9, title: "Golden", composer: "HUNTR/X (Demon Hunters)", genre: "Pop",
    color: "#eab308",
    notes: ["A","C5","F5","E5",
            "G","B","A5","G5",
            "B","D5","G5","F5","E5",
            "A","C5","F5","E5",
            "G","B","A5","G5",
            "B","D5","G5"],
    // Anthemic ascending feel — longer sustained notes
    rhythm: [1,1,1,2,
             1,1,1,2,
             1,1,1,1,2,
             1,1,1,2,
             1,1,1,2,
             1,1,4],
  },
];
