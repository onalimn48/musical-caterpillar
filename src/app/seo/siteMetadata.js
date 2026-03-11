export const SITE_URL = "https://musicalcaterpillar.com";
export const SITE_NAME = "Musical Caterpillar";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;
export const WEB_MANIFEST_PATH = "/manifest.webmanifest";
export const APPLE_TOUCH_ICON_PATH = "/apple-touch-icon.png";
export const THEME_COLOR = "#162055";
export const FAVICON_DATA_URL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50%" y="0.9em" font-size="90" text-anchor="middle">&#x1F41B;</text></svg>',
)}`;

export const STATIC_CONTENT_PATHS = [
  "/music-theory-games-for-kids",
  "/music-classroom-games",
  "/how-to-teach-note-reading",
  "/music-warmups",
  "/music-theory-centers",
  "/note-reading-game",
  "/interval-training-game",
  "/chord-ear-training-game",
  "/treble-clef-practice",
  "/bass-clef-practice",
  "/notes-per-minute-fluency",
];

export const INDEXABLE_PATHS = [
  "/",
  "/about",
  "/why-musical-caterpillar",
  "/note-speller",
  "/notes-per-minute",
  "/chord-snowman",
  ...STATIC_CONTENT_PATHS,
];

export const PAGE_SEO = {
  "/": {
    title: "Musical Caterpillar | Free Music Games for Kids",
    description:
      "Fun music education games for kids. Practice note reading, ear training, and chord skills in Musical Caterpillar.",
    schemaType: "WebSite",
  },
  "/about": {
    title: "About Musical Caterpillar | Music Learning Games for Kids",
    description:
      "Learn about Musical Caterpillar, the music literacy game site built by Nico Carter for classrooms, lessons, and home practice.",
    schemaType: "AboutPage",
  },
  "/why-musical-caterpillar": {
    title: "Why Musical Caterpillar Teaches Real Music Literacy",
    description:
      "See how Musical Caterpillar helps students build real note-reading skills instead of relying on simplified music app shortcuts.",
    schemaType: "Article",
  },
  "/note-speller": {
    title: "Note Speller | Free Note Reading Game for Kids",
    description:
      "Play Note Speller on Musical Caterpillar to practice treble and bass clef note reading by spelling real words.",
    schemaType: "WebPage",
  },
  "/notes-per-minute": {
    title: "Notes Per Minute | Note Reading Speed Game",
    description:
      "Build note-reading fluency with Notes Per Minute, Musical Caterpillar's free sight-reading speed game for kids.",
    schemaType: "WebPage",
  },
  "/chord-snowman": {
    title: "Chord Snowman | Free Ear Training and Chord Game",
    description:
      "Train intervals, chords, and listening skills in Chord Snowman, a free ear training game on Musical Caterpillar.",
    schemaType: "WebPage",
  },
};

export function normalizeCanonicalPath(path = "/") {
  if (!path || path === "/") {
    return "/";
  }

  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  return withLeadingSlash.replace(/\/index\.html$/, "").replace(/\.html$/, "").replace(/\/+$/, "");
}

export function toCanonicalUrl(path = "/") {
  const canonicalPath = normalizeCanonicalPath(path);

  if (canonicalPath === "/") {
    return `${SITE_URL}/`;
  }

  return `${SITE_URL}${canonicalPath}`;
}
