import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TeacherShell from '../TeacherShell.jsx';
import { useTeacherAuth } from '../TeacherAuthContext.jsx';
import { getTeacherAssignmentDetail } from '../data/assignmentApi.js';

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

function getAttemptSummary(attempt) {
  return attempt?.result_summary?.summary || {};
}

function getAttemptAccuracy(attempt) {
  const summary = getAttemptSummary(attempt);
  const value = attempt?.accuracy ?? summary.accuracy;
  return typeof value === 'number' ? value : Number(value);
}

function getAttemptScore(attempt) {
  const summary = getAttemptSummary(attempt);
  const value = attempt?.score ?? summary.score ?? summary.fluencyScore;
  return typeof value === 'number' ? value : Number(value);
}

function formatAttemptResult(gameId, attempt) {
  if (!attempt) {
    return 'No result yet';
  }

  if (attempt.status !== 'completed') {
    return `Started ${formatDateTime(attempt.started_at)}`;
  }

  const summary = getAttemptSummary(attempt);

  if (gameId === 'notes-per-minute') {
    const accuracy = getAttemptAccuracy(attempt);
    const score = getAttemptScore(attempt);
    const npmValue = summary.rawNpm ?? summary.npm;
    const npm = typeof npmValue === 'number' ? Math.round(npmValue) : Number(npmValue);
    const parts = [];

    if (Number.isFinite(accuracy)) {
      parts.push(`${Math.round(accuracy)}% accuracy`);
    }

    if (Number.isFinite(npm)) {
      parts.push(`${npm} NPM`);
    }

    if (Number.isFinite(score)) {
      parts.push(`Score ${Math.round(score)}`);
    }

    return parts.length > 0 ? parts.join(' · ') : 'Completed';
  }

  const score = getAttemptScore(attempt);
  const parts = [];

  if (Number.isFinite(score)) {
    parts.push(`Score ${Math.round(score)}`);
  }

  if (typeof summary.stage === 'number') {
    parts.push(`Stage ${summary.stage}`);
  }

  if (typeof summary.streak === 'number') {
    parts.push(`Streak ${summary.streak}`);
  }

  return parts.length > 0 ? parts.join(' · ') : 'Completed';
}

export default function TeacherAssignmentDetailPage() {
  const { assignmentId } = useParams();
  const { teacher, session, loading, error, signOut } = useTeacherAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [assignmentDetail, setAssignmentDetail] = useState(null);

  const teacherEmail = teacher?.email || session?.user?.email || '';

  useEffect(() => {
    if (!teacher?.approved || !assignmentId) {
      setPageLoading(false);
      return;
    }

    let active = true;

    async function loadAssignmentDetail() {
      setPageLoading(true);
      setPageError('');

      try {
        const data = await getTeacherAssignmentDetail({
          teacherId: teacher.id,
          assignmentId,
        });

        if (!active) {
          return;
        }

        if (!data) {
          setAssignmentDetail(null);
          setPageError('Assignment not found.');
          return;
        }

        setAssignmentDetail(data);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setPageError(loadError.message || 'Unable to load assignment.');
      } finally {
        if (active) {
          setPageLoading(false);
        }
      }
    }

    loadAssignmentDetail();

    return () => {
      active = false;
    };
  }, [assignmentId, teacher]);

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError('');

    const result = await signOut();

    setSigningOut(false);

    if (result.error) {
      setSignOutError(result.error.message);
    }
  }

  if (loading) {
    return (
      <TeacherShell teacherEmail={teacherEmail} title="Assignment detail">
        <section className="teacher-panel">
          <p className="teacher-support-copy">Loading assignment.</p>
        </section>
      </TeacherShell>
    );
  }

  if (error) {
    return (
      <TeacherShell
        teacherEmail={teacherEmail}
        title="Assignment detail"
        onSignOut={handleSignOut}
        signOutDisabled={signingOut}
      >
        <section className="teacher-panel">
          <p className="teacher-alert teacher-alert--error">{error}</p>
          {signOutError ? <p className="teacher-alert teacher-alert--error">{signOutError}</p> : null}
        </section>
      </TeacherShell>
    );
  }

  if (!teacher?.approved) {
    return (
      <TeacherShell
        teacherEmail={teacherEmail}
        title="Assignment detail"
        onSignOut={handleSignOut}
        signOutDisabled={signingOut}
      >
        <section className="teacher-panel">
          <h2>Approval pending</h2>
          <p className="teacher-support-copy">Your account is pending approval.</p>
          {signOutError ? <p className="teacher-alert teacher-alert--error">{signOutError}</p> : null}
        </section>
      </TeacherShell>
    );
  }

  const assignment = assignmentDetail?.assignment;
  const completionSummary = assignmentDetail?.completionSummary;
  const studentSummaries = assignmentDetail?.studentSummaries || [];
  const studentsWithAttempts = studentSummaries.filter((studentSummary) => (
    studentSummary.attempts.length > 0
  ));

  return (
    <TeacherShell
      teacherEmail={teacherEmail}
      title={assignment?.title || 'Assignment detail'}
      onSignOut={handleSignOut}
      signOutDisabled={signingOut}
    >
      <div className="teacher-stack">
        <section className="teacher-panel">
          <div className="teacher-panel__header">
            <div>
              <p className="teacher-overline">Assignment</p>
              <h2>{assignment?.title || 'Assignment detail'}</h2>
            </div>
            <div className="teacher-header-links">
              {assignment?.class_id ? (
                <Link className="teacher-inline-link" to={`/teacher/classes/${assignment.class_id}`}>
                  Back to class
                </Link>
              ) : null}
              <Link className="teacher-inline-link" to="/teacher">
                Back to dashboard
              </Link>
            </div>
          </div>
          {pageLoading ? <p className="teacher-support-copy">Loading assignment details.</p> : null}
          {pageError ? <p className="teacher-alert teacher-alert--error">{pageError}</p> : null}
          {pageError ? (
            <div className="teacher-button-row">
              <button className="teacher-secondary-button" onClick={reloadPage} type="button">
                Try again
              </button>
            </div>
          ) : null}
          {assignment ? (
            <div className="teacher-detail-grid">
              <div className="teacher-detail-card">
                <span className="teacher-label">Class</span>
                <strong>{assignment.class?.name || 'Unknown class'}</strong>
                {assignment.class?.class_code ? (
                  <p className="teacher-muted-copy">{assignment.class.class_code}</p>
                ) : null}
              </div>
              <div className="teacher-detail-card">
                <span className="teacher-label">Game</span>
                <strong>{GAME_LABELS[assignment.game_id] || assignment.game_id}</strong>
              </div>
              <div className="teacher-detail-card">
                <span className="teacher-label">Created</span>
                <strong>{formatDateTime(assignment.created_at)}</strong>
              </div>
              <div className="teacher-detail-card">
                <span className="teacher-label">Due date</span>
                <strong>{formatDueDate(assignment.due_at)}</strong>
              </div>
              <div className="teacher-detail-card">
                <span className="teacher-label">Completion</span>
                <strong>
                  {completionSummary?.completedCount || 0} of {completionSummary?.totalStudents || 0} completed
                </strong>
                <p className="teacher-muted-copy">
                  {completionSummary?.startedCount || 0} started · {completionSummary?.notStartedCount || 0} not started
                </p>
              </div>
              <div className="teacher-detail-card">
                <span className="teacher-label">Recorded results</span>
                <strong>{completionSummary?.latestResultCount || 0} latest results saved</strong>
                <p className="teacher-muted-copy">
                  {completionSummary?.bestResultCount || 0} students have a best score recorded
                </p>
              </div>
              <div className="teacher-detail-card teacher-detail-card--full">
                <span className="teacher-label">Instructions</span>
                <p className="teacher-support-copy">
                  {assignment.instructions || 'No instructions yet.'}
                </p>
              </div>
            </div>
          ) : null}
          {signOutError ? <p className="teacher-alert teacher-alert--error">{signOutError}</p> : null}
        </section>

        <section className="teacher-panel">
          <div className="teacher-panel__header">
            <div>
              <p className="teacher-overline">Roster</p>
              <h2>Student progress</h2>
            </div>
          </div>
          {!pageLoading && !pageError && studentSummaries.length > 0 && studentsWithAttempts.length === 0 ? (
            <p className="teacher-support-copy">
              No attempts yet. Students will appear with results here after they open this assignment.
            </p>
          ) : null}
          {pageError ? (
            <p className="teacher-support-copy">
              Assignment results could not be loaded right now. Refresh and try again.
            </p>
          ) : null}
          {!pageLoading && !pageError && studentSummaries.length === 0 ? (
            <p className="teacher-support-copy">
              No active students are in this class. Archived students are not shown in assignment results.
            </p>
          ) : null}
          <div className="teacher-list">
            {studentSummaries.map((studentSummary) => (
              <article className="teacher-card" key={studentSummary.student.id}>
                <div className="teacher-assignment-row">
                  <div>
                    <h3>{studentSummary.student.display_name}</h3>
                    <p className="teacher-muted-copy">
                      Last activity: {formatDateTime(studentSummary.lastActivityAt)}
                    </p>
                  </div>
                  <span className={`teacher-status-pill teacher-status-pill--${studentSummary.status.replace(/\s+/g, '-')}`}>
                    {studentSummary.status}
                  </span>
                </div>
                <div className="teacher-stat-grid">
                  <div className="teacher-stat-card">
                    <span className="teacher-label">Latest result</span>
                    <strong>{formatAttemptResult(assignment?.game_id, studentSummary.latestCompletedAttempt)}</strong>
                    <p className="teacher-muted-copy">
                      Latest activity: {formatDateTime(studentSummary.lastActivityAt)}
                    </p>
                  </div>
                  <div className="teacher-stat-card">
                    <span className="teacher-label">Best result</span>
                    <strong>{formatAttemptResult(assignment?.game_id, studentSummary.bestAttempt)}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </TeacherShell>
  );
}
