import { lazy } from 'react';

export const gameRegistry = [
  {
    path: '/bearglar',
    title: 'Bearglar',
    component: lazy(() => import('../../games/the-heist/index.jsx')),
  },
  {
    path: '/synth-lab',
    title: 'Synth Lab',
    component: lazy(() => import('../../games/synth-lab/index.jsx')),
  },
  {
    path: '/caterpillar-sequencer',
    title: 'Caterpillar Sequencer',
    component: lazy(() => import('../../games/caterpillar-sequencer/index.jsx')),
  },
  {
    path: '/note-speller',
    title: 'Note Speller',
    component: lazy(() => import('../../games/note-speller/index.jsx')),
  },
  {
    path: '/notes-per-minute',
    title: 'Notes Per Minute',
    component: lazy(() => import('../../games/notes-per-minute/index.jsx')),
  },
  {
    path: '/chord-snowman',
    title: 'Chord Snowman',
    component: lazy(() => import('../../games/chord-snowman/index.jsx')),
  },
];
