export function getGamePathByGameId(gameId) {
  switch (gameId) {
    case 'notes-per-minute':
      return '/notes-per-minute';
    case 'note-speller':
      return '/note-speller';
    default:
      return '/student/assignments';
  }
}
