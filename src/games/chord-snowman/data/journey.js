export const IE_OBSTACLES = [
  { name: "Snowdrift", emoji: "❄️", desc: "A wall of snow blocks the path!" },
  { name: "Frozen Stream", emoji: "🧊", desc: "A slippery frozen stream to cross!" },
  { name: "Ice Cave", emoji: "🕳️", desc: "A dark ice cave echoes with music!" },
  { name: "Blizzard", emoji: "🌨️", desc: "A howling blizzard — listen carefully!" },
  { name: "Snow Beast", emoji: "🐻‍❄️", desc: "A snow beast guards the way!" },
  { name: "Frozen Waterfall", emoji: "🏔️", desc: "A frozen waterfall blocks the trail!" },
  { name: "Avalanche", emoji: "⛰️", desc: "Rumbling from above — quick!" },
  { name: "Ice Maze", emoji: "🌀", desc: "A twisting maze of ice walls!" },
  { name: "Snow Wolves", emoji: "🐺", desc: "A pack of snow wolves circles!" },
  { name: "Frozen Lake", emoji: "💎", desc: "A vast frozen lake to navigate!" },
  { name: "Ice Dragon", emoji: "🐉", desc: "An ice dragon challenges you!" },
  { name: "The Summit", emoji: "🏆", desc: "The final climb to the snowman!" },
];

export const IE_LEVELS = [
  { id: 0, name: "Small Steps", ivs: [0, 1], newIv: null, desc: "Minor 2nd & Major 2nd", needed: 6, hp: 4, obstacle: 0 },
  { id: 1, name: "+ Minor 3rd", ivs: [0, 1, 2], newIv: 2, desc: "Adding the Minor 3rd", needed: 6, hp: 4, obstacle: 1 },
  { id: 2, name: "+ Major 3rd", ivs: [0, 1, 2, 3], newIv: 3, desc: "Adding the Major 3rd", needed: 7, hp: 4, obstacle: 2 },
  { id: 3, name: "+ Perfect 4th", ivs: [0, 1, 2, 3, 4], newIv: 4, desc: "Adding the Perfect 4th", needed: 7, hp: 3, obstacle: 3 },
  { id: 4, name: "+ Tritone", ivs: [0, 1, 2, 3, 4, 5], newIv: 5, desc: "Adding the devil's interval", needed: 8, hp: 3, obstacle: 4 },
  { id: 5, name: "+ Perfect 5th", ivs: [0, 1, 2, 3, 4, 5, 6], newIv: 6, desc: "Adding the Perfect 5th", needed: 8, hp: 3, obstacle: 5 },
  { id: 6, name: "+ Minor 6th", ivs: [0, 1, 2, 3, 4, 5, 6, 7], newIv: 7, desc: "Adding the Minor 6th", needed: 8, hp: 3, obstacle: 6 },
  { id: 7, name: "+ Major 6th", ivs: [0, 1, 2, 3, 4, 5, 6, 7, 8], newIv: 8, desc: "Adding the Major 6th", needed: 9, hp: 3, obstacle: 7 },
  { id: 8, name: "+ Minor 7th", ivs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], newIv: 9, desc: "Adding the Minor 7th", needed: 9, hp: 3, obstacle: 8 },
  { id: 9, name: "+ Major 7th", ivs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], newIv: 10, desc: "Adding the Major 7th", needed: 10, hp: 3, obstacle: 9 },
  { id: 10, name: "+ Octave", ivs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], newIv: 11, desc: "Adding the Octave", needed: 10, hp: 3, obstacle: 10 },
  { id: 11, name: "All Intervals", ivs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], newIv: null, desc: "The final challenge — all 12!", needed: 12, hp: 3, obstacle: 11 },
];
