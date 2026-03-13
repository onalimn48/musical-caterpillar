import { lazy } from 'react';

export const gameRegistry = [
  {
    path: '/teacher/sign-in',
    title: 'Teacher Sign In',
    layout: 'teacher',
    component: lazy(() => import('../../teacher/pages/TeacherSignInPage.jsx')),
  },
  {
    path: '/teacher',
    title: 'Teacher Home',
    layout: 'teacher',
    requiresTeacherAuth: true,
    component: lazy(() => import('../../teacher/pages/TeacherHomePage.jsx')),
  },
  {
    path: '/teacher/classes',
    title: 'Teacher Classes',
    layout: 'teacher',
    requiresTeacherAuth: true,
    component: lazy(() => import('../../teacher/pages/TeacherClassesPage.jsx')),
  },
  {
    path: '/teacher/classes/:classId',
    title: 'Teacher Class Detail',
    layout: 'teacher',
    requiresTeacherAuth: true,
    component: lazy(() => import('../../teacher/pages/TeacherClassDetailPage.jsx')),
  },
  {
    path: '/teacher/assignments/new',
    title: 'Teacher Assignment Create',
    layout: 'teacher',
    requiresTeacherAuth: true,
    component: lazy(() => import('../../teacher/pages/TeacherAssignmentCreatePage.jsx')),
  },
  {
    path: '/teacher/assignments/:assignmentId',
    title: 'Teacher Assignment Detail',
    layout: 'teacher',
    requiresTeacherAuth: true,
    component: lazy(() => import('../../teacher/pages/TeacherAssignmentDetailPage.jsx')),
  },
  {
    path: '/student',
    title: 'Student Entry',
    layout: 'student',
    component: lazy(() => import('../../student/pages/StudentEntryPage.jsx')),
  },
  {
    path: '/student/assignments',
    title: 'Student Assignments',
    layout: 'student',
    component: lazy(() => import('../../student/pages/StudentAssignmentsPage.jsx')),
  },
  {
    path: '/bearglar',
    title: 'Bearglar',
    layout: 'game',
    component: lazy(() => import('../../games/the-heist/index.jsx')),
  },
  {
    path: '/synth-lab',
    title: 'Synth Lab',
    layout: 'game',
    component: lazy(() => import('../../games/synth-lab/index.jsx')),
  },
  {
    path: '/caterpillar-sequencer',
    title: 'Caterpillar Sequencer',
    layout: 'game',
    component: lazy(() => import('../../games/caterpillar-sequencer/index.jsx')),
  },
  {
    path: '/note-speller',
    title: 'Note Speller',
    layout: 'game',
    component: lazy(() => import('../../games/note-speller/index.jsx')),
  },
  {
    path: '/notes-per-minute',
    title: 'Notes Per Minute',
    layout: 'game',
    component: lazy(() => import('../../games/notes-per-minute/index.jsx')),
  },
  {
    path: '/chord-snowman',
    title: 'Chord Snowman',
    layout: 'game',
    component: lazy(() => import('../../games/chord-snowman/index.jsx')),
  },
];
