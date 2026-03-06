function dedup(arr) {
  const seen = new Set();
  return arr.filter((item) => {
    if (seen.has(item.w)) return false;
    seen.add(item.w);
    return true;
  });
}

export const MUSIC_NOTES = new Set("ABCDEFG".split(""));

export const STAGE1_WORDS = dedup([
  { w: "BAD", h: "Not good" }, { w: "BED", h: "Where you sleep" }, { w: "BAG", h: "Carry things" },
  { w: "BEE", h: "Buzzy insect 🐝" }, { w: "ADD", h: "Put together" }, { w: "AGE", h: "How old you are" },
  { w: "ACE", h: "The best!" }, { w: "CAB", h: "Yellow taxi" }, { w: "DAD", h: "Your father" },
  { w: "DAB", h: "A little tap" }, { w: "EGG", h: "From a chicken 🥚" }, { w: "FAD", h: "Short trend" },
  { w: "FAB", h: "Fabulous!" }, { w: "FED", h: "Gave food to" }, { w: "FEE", h: "Money you pay" },
  { w: "GAB", h: "Chat a lot" }, { w: "GAG", h: "Funny joke" },
  { w: "AFF", h: "Short for affection" }, { w: "EBB", h: "Flow back out" },
  { w: "FIG", h: "A sweet fruit" }, { w: "GIG", h: "A music show" },
  { w: "BIG", h: "Not small" }, { w: "DIG", h: "Make a hole" },
  { w: "BIB", h: "Baby wears it" }, { w: "DID", h: "Past tense of do" }, { w: "BEG", h: "Ask nicely" },
  { w: "FACE", h: "In the mirror" }, { w: "FADE", h: "Slowly disappear" },
  { w: "CAGE", h: "Bird's home" }, { w: "BEAD", h: "Tiny jewel" },
  { w: "DEAF", h: "Cannot hear" }, { w: "EDGE", h: "The very end" },
  { w: "BADGE", h: "A pin you wear" }, { w: "AGED", h: "Gotten older" },
  { w: "GAFF", h: "A big mistake" }, { w: "BEEF", h: "Cow meat" },
  { w: "FEED", h: "Give food" }, { w: "DEED", h: "A brave act" },
  { w: "BABE", h: "A baby" }, { w: "CAFE", h: "Coffee shop ☕" },
  { w: "DACE", h: "A type of fish" }, { w: "GAGE", h: "A measuring tool" },
  { w: "ABBE", h: "A French monk" }, { w: "EDGED", h: "Had a border" },
  { w: "ADDED", h: "Put more in" }, { w: "FADED", h: "Lost color" },
  { w: "FACED", h: "Looked at bravely" }, { w: "CAGED", h: "Locked up" },
  { w: "BEADED", h: "Covered in beads" },
  { w: "FIB", h: "A small lie" }, { w: "DEF", h: "Definitely cool" }, { w: "GAD", h: "Roam around" },
  { w: "FOG", h: "Misty air 🌫️" }, { w: "FAN", h: "Keeps you cool" }, { w: "FUN", h: "Good times! 🎉" },
  { w: "FUR", h: "Soft animal coat" }, { w: "FIT", h: "In good shape 💪" }, { w: "BUG", h: "Tiny critter 🐛" },
  { w: "BUS", h: "Big yellow ride 🚌" }, { w: "BOB", h: "Move up and down" }, { w: "GUM", h: "Chew on it" },
  { w: "GEM", h: "Shiny jewel 💎" }, { w: "CUB", h: "Baby bear 🐻" }, { w: "CUP", h: "Drink from it ☕" },
  { w: "DUG", h: "Made a hole" }, { w: "GAP", h: "A space between" }, { w: "JAB", h: "A quick poke" },
  { w: "LAB", h: "Science room 🔬" }, { w: "NAB", h: "Grab quickly" }, { w: "NAG", h: "Keep bugging" },
  { w: "PAD", h: "Soft cushion" }, { w: "PEG", h: "A small pin" }, { w: "RAG", h: "Old cloth" },
  { w: "SOB", h: "Cry hard 😢" }, { w: "TAB", h: "A small flap" }, { w: "TAG", h: "You're it! 🏷️" },
  { w: "TUB", h: "Take a bath 🛁" }, { w: "TUG", h: "Pull hard" }, { w: "WAG", h: "Happy tail 🐕" },
  { w: "WEB", h: "Spider's home 🕸️" }, { w: "HUB", h: "Center of it all" }, { w: "JOB", h: "Work to do 💼" },
  { w: "RUG", h: "Floor carpet" }, { w: "SAG", h: "Droop down" },
]);

export const STAGE2_WORDS = dedup([
  { w: "BRIDGE", h: "Cross water 🌉" }, { w: "PLANET", h: "Earth is one 🌍" },
  { w: "BASKET", h: "Hoops 🏀" }, { w: "DRAGON", h: "Breathes fire 🐉" },
  { w: "GENTLE", h: "Soft and kind" }, { w: "CASTLE", h: "King's home 🏰" },
  { w: "GARDEN", h: "Flowers grow 🌸" }, { w: "BLANKET", h: "Keeps you warm" },
  { w: "DANGER", h: "Watch out ⚠️" }, { w: "FINGER", h: "You have ten 🖐️" },
  { w: "BEACH", h: "Sandy place 🏖️" }, { w: "CHANGE", h: "Make different" },
  { w: "EAGLE", h: "Soaring bird 🦅" }, { w: "FLAME", h: "Fire 🔥" },
  { w: "GRAPE", h: "Purple fruit 🍇" }, { w: "DREAM", h: "In your sleep 💤" },
  { w: "FEAST", h: "Big meal 🍽️" }, { w: "MAGIC", h: "Abracadabra 🪄" },
  { w: "PIRATE", h: "Sails the seas 🏴‍☠️" }, { w: "SPACE", h: "Where stars are ✨" },
  { w: "BRAVE", h: "Not afraid" }, { w: "STAGE", h: "Performers 🎭" },
  { w: "GREAT", h: "Really good!" }, { w: "WHALE", h: "Huge sea animal 🐋" },
  { w: "DANCE", h: "Move to music 💃" }, { w: "HEART", h: "Beats in chest ❤️" },
  { w: "TIGER", h: "Striped cat 🐯" }, { w: "SNACK", h: "Little bite 🍪" },
  { w: "PLACE", h: "A location" }, { w: "TRACE", h: "Follow the line" },
  { w: "GRACE", h: "Elegant beauty" }, { w: "BRACE", h: "Hold on tight" },
  { w: "BLADE", h: "Sharp edge 🗡️" }, { w: "CRANE", h: "Tall bird or machine" },
  { w: "GRADE", h: "Your score in school" }, { w: "SHAKE", h: "Wiggle it" },
  { w: "PLATE", h: "Eat off of it 🍽️" }, { w: "STALE", h: "Not fresh" },
  { w: "SCALE", h: "Weigh things ⚖️" }, { w: "SPARE", h: "Extra one" },
  { w: "CHASE", h: "Run after 🏃" }, { w: "SHAPE", h: "Circle or square" },
  { w: "DRAPE", h: "Hang fabric" }, { w: "BLAZE", h: "Bright fire 🔥" },
  { w: "RANGE", h: "From here to there" }, { w: "MANGE", h: "Skin disease" },
  { w: "LEDGE", h: "Narrow shelf" }, { w: "HEDGE", h: "Green wall of bushes" },
  { w: "WEDGE", h: "Triangle shape" }, { w: "RIDGE", h: "Top of a mountain" },
  { w: "BADGE", h: "Pin you wear" }, { w: "JUDGE", h: "In a courtroom ⚖️" },
  { w: "FUDGE", h: "Chocolate treat 🍫" }, { w: "NUDGE", h: "Gentle push" },
  { w: "LARGE", h: "Really big" }, { w: "MERGE", h: "Combine together" },
  { w: "SURGE", h: "Sudden rush" }, { w: "PURGE", h: "Clean out" },
  { w: "PEACE", h: "No fighting ☮️" }, { w: "LEASE", h: "Rent agreement" },
  { w: "TEASE", h: "Playful joking" }, { w: "GEESE", h: "Plural of goose 🪿" },
  { w: "PIECE", h: "A part of" }, { w: "NIECE", h: "Sister's daughter" },
  { w: "PHONE", h: "Call someone 📱" }, { w: "STONE", h: "A rock 🪨" },
  { w: "GLOBE", h: "Round like Earth 🌎" }, { w: "THEME", h: "Main idea" },
  { w: "SCENE", h: "Part of a movie 🎬" }, { w: "NERVE", h: "Feeling bold" },
  { w: "SOLVE", h: "Find the answer" }, { w: "CURVE", h: "Not straight" },
  { w: "PASTE", h: "Stick things" }, { w: "WASTE", h: "Throw away 🗑️" },
  { w: "TASTE", h: "Flavor in your mouth" }, { w: "HASTE", h: "In a hurry" },
  { w: "FABLE", h: "A story with a lesson 📖" }, { w: "CLIFF", h: "Steep rock edge 🏔️" },
  { w: "BLUFF", h: "Pretend you have it" }, { w: "BRIEF", h: "Short and quick" },
  { w: "CHIEF", h: "The leader 👑" }, { w: "CRAFT", h: "Make something ✂️" },
  { w: "DWARF", h: "Very small person" }, { w: "GRIEF", h: "Deep sadness 😞" },
  { w: "SCARF", h: "Keeps your neck warm 🧣" }, { w: "SHELF", h: "Hold your books 📚" },
  { w: "THIEF", h: "Sneaky stealer 🦹" }, { w: "STUFF", h: "All your things" },
  { w: "SNIFF", h: "Smell something 👃" }, { w: "STAFF", h: "Team of workers" },
  { w: "STIFF", h: "Hard to bend" }, { w: "SWIFT", h: "Super fast 💨" },
  { w: "CABLE", h: "Thick wire 🔌" }, { w: "FLOCK", h: "Group of birds 🐦" },
  { w: "FORCE", h: "Power and strength 💥" }, { w: "FORGE", h: "Shape with fire 🔨" },
  { w: "FETCH", h: "Go get it 🐕" }, { w: "BENCH", h: "Sit in the park 🪑" },
  { w: "BUNCH", h: "A group together" }, { w: "DRIFT", h: "Float along 🍂" },
  { w: "BUFFET", h: "All-you-can-eat 🍽️" }, { w: "COFFEE", h: "Morning drink ☕" },
  { w: "FIDGET", h: "Can't sit still" }, { w: "DEFEAT", h: "Beat the other team" },
  { w: "DEFEND", h: "Protect and guard 🛡️" }, { w: "BEFORE", h: "Earlier in time ⏰" },
  { w: "FABRIC", h: "Cloth material 🧵" }, { w: "BELIEF", h: "What you trust in" },
  { w: "EFFECT", h: "The result of something" }, { w: "COBWEB", h: "Spider's old web 🕸️" },
  { w: "BOBSLED", h: "Icy race ride 🛷" },
]);

export const STAGE3_WORDS = dedup([
  { w: "BADGE", h: "Pin you wear" }, { w: "FACE", h: "In the mirror" }, { w: "CAGE", h: "Bird's home" },
  { w: "EDGE", h: "The very end" }, { w: "FADE", h: "Disappear" }, { w: "BEAD", h: "Tiny jewel" },
  { w: "DEAF", h: "Cannot hear" }, { w: "BRIDGE", h: "Cross water 🌉" }, { w: "CASTLE", h: "King's home 🏰" },
  { w: "GARDEN", h: "Flowers 🌸" }, { w: "DANGER", h: "Watch out ⚠️" }, { w: "EAGLE", h: "Soaring 🦅" },
  { w: "FLAME", h: "Fire 🔥" }, { w: "GRAPE", h: "Purple fruit 🍇" }, { w: "FEAST", h: "Big meal 🍽️" },
  { w: "DANCE", h: "Move to music 💃" }, { w: "BRAVE", h: "Not afraid" }, { w: "STAGE", h: "Performers 🎭" },
  { w: "GREAT", h: "Really good!" }, { w: "BEACH", h: "Sandy place 🏖️" }, { w: "CHANGE", h: "Make different" },
  { w: "SPACE", h: "Stars ✨" }, { w: "FINGER", h: "You have ten 🖐️" }, { w: "DRAGON", h: "Fire! 🐉" },
  { w: "PLACE", h: "A location" }, { w: "TRACE", h: "Follow the line" },
  { w: "GRACE", h: "Elegant beauty" }, { w: "BLADE", h: "Sharp edge 🗡️" },
  { w: "CRANE", h: "Tall bird" }, { w: "GRADE", h: "School score" },
  { w: "CHASE", h: "Run after 🏃" }, { w: "BLAZE", h: "Bright fire 🔥" },
  { w: "RANGE", h: "From here to there" }, { w: "LEDGE", h: "Narrow shelf" },
  { w: "HEDGE", h: "Green bushes" }, { w: "RIDGE", h: "Mountain top" },
  { w: "JUDGE", h: "Courtroom ⚖️" }, { w: "FUDGE", h: "Chocolate 🍫" },
  { w: "LARGE", h: "Really big" }, { w: "MERGE", h: "Combine" },
  { w: "SURGE", h: "Sudden rush" }, { w: "PEACE", h: "No fighting ☮️" },
  { w: "GEESE", h: "Plural of goose 🪿" }, { w: "PIECE", h: "A part of" },
  { w: "SCENE", h: "Part of a movie 🎬" }, { w: "NERVE", h: "Feeling bold" },
  { w: "CURVE", h: "Not straight" }, { w: "TASTE", h: "Flavor" },
  { w: "ADDED", h: "Put more in" }, { w: "FACED", h: "Looked bravely" },
  { w: "CAGED", h: "Locked up" }, { w: "EDGED", h: "Had a border" },
  { w: "REFUGE", h: "A safe place 🏠" }, { w: "REBUFF", h: "Turn away sharply" },
  { w: "BEHALF", h: "In support of" }, { w: "ENGULF", h: "Swallow up completely" },
  { w: "REBUKE", h: "Scold someone" }, { w: "BUDGET", h: "Plan your money 💰" },
  { w: "RUBBLE", h: "Broken pieces of stone" }, { w: "FUMBLE", h: "Drop the ball 🏈" },
  { w: "FRIDGE", h: "Keeps food cold 🧊" }, { w: "BREEZE", h: "Gentle wind 🌬️" },
  { w: "FREEZE", h: "Turn to ice ❄️" }, { w: "CUDGEL", h: "A heavy stick" },
  { w: "BADGER", h: "Stripy animal 🦡" }, { w: "BAFFLE", h: "Really confuse" },
  { w: "BOBBLE", h: "Wobble around" }, { w: "BUCKLE", h: "Fasten your belt" },
  { w: "CANDLE", h: "Flickering light 🕯️" }, { w: "DAGGER", h: "Short sharp blade 🗡️" },
  { w: "LEAGUE", h: "A group of teams ⚽" }, { w: "VOYAGE", h: "A long journey 🚢" },
  { w: "FORAGE", h: "Search for food 🌿" }, { w: "MIRAGE", h: "Desert illusion 🏜️" },
  { w: "SAUSAGE", h: "Breakfast meat 🌭" }, { w: "CABBAGE", h: "Green veggie 🥬" },
  { w: "BANDAGE", h: "Wrap a wound 🩹" }, { w: "GARBAGE", h: "Throw it out 🗑️" },
  { w: "PACKAGE", h: "Delivered box 📦" }, { w: "MASSAGE", h: "Rub away stress 💆" },
  { w: "COURAGE", h: "Being brave 🦁" }, { w: "COTTAGE", h: "Cozy little house 🏡" },
  { w: "LUGGAGE", h: "Travel bags 🧳" }, { w: "PASSAGE", h: "A narrow path" },
  { w: "VILLAGE", h: "Small town 🏘️" }, { w: "AVERAGE", h: "Right in the middle" },
  { w: "BAGGAGE", h: "Stuff you carry" }, { w: "FOOTAGE", h: "Video recording 🎥" },
  { w: "STORAGE", h: "Where you keep things 📦" }, { w: "VINTAGE", h: "Cool and old-school 🎸" },
]);

export const ALL_WORDS = [...STAGE1_WORDS, ...STAGE2_WORDS, ...STAGE3_WORDS];

export const ARCADE_WORDS = ALL_WORDS.filter(
  (word, index, all) => all.findIndex((candidate) => candidate.w === word.w) === index
);

export const SCRAMBLE_WORDS = (() => {
  const seen = new Set();
  return ALL_WORDS.filter((word) => {
    if (seen.has(word.w)) return false;
    const allMusic = word.w.split("").every((ch) => MUSIC_NOTES.has(ch));
    const unique = new Set(word.w.split("")).size;
    if (allMusic && word.w.length >= 3 && unique >= 2) {
      seen.add(word.w);
      return true;
    }
    return false;
  });
})();
