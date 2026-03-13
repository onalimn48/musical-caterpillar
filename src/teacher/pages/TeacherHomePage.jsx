import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TeacherShell from '../TeacherShell.jsx';
import { useTeacherAuth } from '../TeacherAuthContext.jsx';
import { listTeacherClasses } from '../data/classroomApi.js';
import { listRecentTeacherAssignments } from '../data/assignmentApi.js';

const GAME_LABELS = {
  'note-speller': 'Note Speller',
  'notes-per-minute': 'Notes Per Minute',
};

function formatDateTime(value) {
  if (!value) {
    return 'No activity yet';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'No activity yet';
  }

  return date.toLocaleString();
}

function formatDueDate(value) {
  if (!value) {
    return 'No due date';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'No due date';
  }

  return date.toLocaleString();
}

function reloadPage() {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

export default function TeacherHomePage() {
  const { teacher, session, loading, error, signOut } = useTeacherAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [classes, setClasses] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [classesError, setClassesError] = useState('');
  const [assignmentsError, setAssignmentsError] = useState('');

  useEffect(() => {
    if (!teacher?.approved) {
      setClassesLoading(false);
      setAssignmentsLoading(false);
      return;
    }

    let active = true;

    async function loadDashboard() {
      setClassesLoading(true);
      setAssignmentsLoading(true);
      setClassesError('');
      setAssignmentsError('');

      try {
        const [classesResult, assignmentsResult] = await Promise.allSettled([
          listTeacherClasses(teacher.id),
          listRecentTeacherAssignments(teacher.id, 5),
        ]);

        if (!active) {
          return;
        }

        if (classesResult.status === 'fulfilled') {
          setClasses(classesResult.value);
        } else {
          setClasses([]);
          setClassesError(classesResult.reason?.message || 'Unable to load classes.');
        }

        if (assignmentsResult.status === 'fulfilled') {
          setRecentAssignments(assignmentsResult.value);
        } else {
          setRecentAssignments([]);
          setAssignmentsError(assignmentsResult.reason?.message || 'Unable to load recent assignments.');
        }
      } finally {
        if (active) {
          setClassesLoading(false);
          setAssignmentsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [teacher]);

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError('');

    const result = await signOut();

    setSigningOut(false);

    if (result.error) {
      setSignOutError(result.error.message);
    }
  }

  const teacherEmail = teacher?.email || session?.user?.email || '';
  const hasClasses = classes.length > 0;
  const hasAssignments = recentAssignments.length > 0;

  if (loading) {
    return (
      <TeacherShell
        teacherEmail={teacherEmail}
        title="Teacher Home"
      >
        <section className="teacher-panel">
          <p className="teacher-support-copy">Loading your teacher dashboard.</p>
        </section>
      </TeacherShell>
    );
  }

  if (error) {
    return (
      <TeacherShell
        teacherEmail={teacherEmail}
        title="Teacher Home"
        onSignOut={handleSignOut}
        signOutDisabled={signingOut}
      >
        <section className="teacher-panel">
          <p className="teacher-alert teacher-alert--error">{error}</p>
          {signOutError ? (
            <p className="teacher-alert teacher-alert--error">{signOutError}</p>
          ) : null}
        </section>
      </TeacherShell>
    );
  }

  if (!teacher?.approved) {
    return (
      <TeacherShell
        teacherEmail={teacherEmail}
        title="Teacher Home"
        onSignOut={handleSignOut}
        signOutDisabled={signingOut}
      >
        <section className="teacher-panel">
          <h2>Approval pending</h2>
          <p className="teacher-support-copy">
            Your account is pending approval.
          </p>
          {signOutError ? (
            <p className="teacher-alert teacher-alert--error">{signOutError}</p>
          ) : null}
        </section>
      </TeacherShell>
    );
  }

  return (
    <TeacherShell
      teacherEmail={teacherEmail}
      title="Teacher Home"
      onSignOut={handleSignOut}
      signOutDisabled={signingOut}
    >
      <section className="teacher-panel">
        <div className="teacher-panel__header">
          <div>
            <p className="teacher-overline">Welcome</p>
            <h2>Start here</h2>
          </div>
        </div>
        <p className="teacher-support-copy">
          Create one class, add your roster, then post your first assignment. Students use the class code once,
          choose their name, and their results come back here automatically.
        </p>
        <div className="teacher-onboarding-list">
          <div className="teacher-detail-card">
            <span className="teacher-label">Step 1</span>
            <strong>Create or open a class</strong>
            <p className="teacher-support-copy">
              {hasClasses
                ? 'Open a class to review the roster or copy its class code.'
                : 'Start by creating a class so you have a roster and class code ready.'}
            </p>
          </div>
          <div className="teacher-detail-card">
            <span className="teacher-label">Step 2</span>
            <strong>Add students</strong>
            <p className="teacher-support-copy">
              Add one student at a time or paste the full roster in bulk on the class page.
            </p>
          </div>
          <div className="teacher-detail-card">
            <span className="teacher-label">Step 3</span>
            <strong>Create an assignment</strong>
            <p className="teacher-support-copy">
              {hasAssignments
                ? 'Open a recent assignment below to review completion and best/latest results.'
                : 'Publish one assignment and students will see it on their assignment list right away.'}
            </p>
          </div>
        </div>
        <div className="teacher-button-row">
          <Link className="teacher-primary-button" to="/teacher/classes">
            {hasClasses ? 'Open classes' : 'Create your first class'}
          </Link>
          <Link className="teacher-secondary-button" to="/teacher/assignments/new">
            {hasAssignments ? 'Create another assignment' : 'Create assignment'}
          </Link>
        </div>
      </section>
      <section className="teacher-panel">
        <div className="teacher-panel__header">
          <div>
            <p className="teacher-overline">Dashboard</p>
            <h2>Classes</h2>
          </div>
          <div className="teacher-header-links">
            <Link className="teacher-inline-link" to="/teacher/classes">
              Manage classes
            </Link>
            <Link className="teacher-inline-link" to="/teacher/assignments/new">
              Create assignment
            </Link>
          </div>
        </div>
        {classesError ? (
          <p className="teacher-alert teacher-alert--error">{classesError}</p>
        ) : null}
        {classesError ? (
          <div className="teacher-button-row">
            <button className="teacher-secondary-button" onClick={reloadPage} type="button">
              Try again
            </button>
          </div>
        ) : null}
        {classesLoading ? (
          <p className="teacher-support-copy">Loading classes.</p>
        ) : null}
        {!classesLoading && classes.length === 0 ? (
          <p className="teacher-support-copy">
            No classes yet. Create your first class to build a roster before you assign work.
          </p>
        ) : null}
        <div className="teacher-card-list">
          {classes.slice(0, 3).map((classroom) => (
            <Link
              key={classroom.id}
              className="teacher-card-link"
              to={`/teacher/classes/${classroom.id}`}
            >
              <article className="teacher-card">
                <div className="teacher-card__header">
                  <h3>{classroom.name}</h3>
                  <span className="teacher-badge">{classroom.class_code}</span>
                </div>
                {classroom.grade_label ? (
                  <p className="teacher-muted-copy">{classroom.grade_label}</p>
                ) : null}
              </article>
            </Link>
          ))}
        </div>
      </section>
      <section className="teacher-panel">
        <div className="teacher-panel__header">
          <div>
            <p className="teacher-overline">Assignments</p>
            <h2>Recent assignments</h2>
          </div>
          <Link className="teacher-inline-link" to="/teacher/assignments/new">
            Create assignment
          </Link>
        </div>
        {assignmentsError ? (
          <p className="teacher-alert teacher-alert--error">{assignmentsError}</p>
        ) : null}
        {assignmentsError ? (
          <div className="teacher-button-row">
            <button className="teacher-secondary-button" onClick={reloadPage} type="button">
              Try again
            </button>
          </div>
        ) : null}
        {assignmentsLoading ? (
          <p className="teacher-support-copy">Loading recent assignments.</p>
        ) : null}
        {!assignmentsLoading && recentAssignments.length === 0 ? (
          <p className="teacher-support-copy">
            {classes.length === 0
              ? 'No assignments yet because you do not have any classes. Create a class first.'
              : 'No assignments yet. Create one for a class when you are ready to track results.'}
          </p>
        ) : null}
        <div className="teacher-card-list">
          {recentAssignments.map(({ assignment, completionSummary }) => (
            <Link
              key={assignment.id}
              className="teacher-card-link"
              to={`/teacher/assignments/${assignment.id}`}
            >
              <article className="teacher-card">
                <div className="teacher-card__header">
                  <h3>{assignment.title}</h3>
                  <span className="teacher-badge">
                    {completionSummary.completedCount}/{completionSummary.totalStudents} done
                  </span>
                </div>
                <p className="teacher-muted-copy">
                  {assignment.class?.name || 'Unknown class'} · {GAME_LABELS[assignment.game_id] || assignment.game_id}
                </p>
                <p className="teacher-support-copy">
                  {completionSummary.completedCount} completed · {completionSummary.startedCount} started · {completionSummary.notStartedCount} not started
                </p>
                <p className="teacher-muted-copy">
                  Due: {formatDueDate(assignment.due_at)}
                </p>
                <p className="teacher-muted-copy">
                  Latest activity: {formatDateTime(completionSummary.latestActivityAt)}
                </p>
              </article>
            </Link>
          ))}
        </div>
      </section>
      {signOutError ? (
        <p className="teacher-alert teacher-alert--error">{signOutError}</p>
      ) : null}
    </TeacherShell>
  );
}
