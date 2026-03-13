import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentStudentIdentity } from '../studentStorage.js';
import { listAssignmentsForStudent } from '../../assignment/assignmentApi.js';
import { getGamePathByGameId } from '../../assignment/gamePaths.js';
import '../student.css';

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

function handleRetry() {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

export default function StudentAssignmentsPage() {
  const [studentIdentity, setStudentIdentity] = useState(getCurrentStudentIdentity());
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(Boolean(studentIdentity));
  const [error, setError] = useState('');

  useEffect(() => {
    const identity = getCurrentStudentIdentity();
    setStudentIdentity(identity);

    if (!identity) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadAssignments() {
      setLoading(true);
      setError('');

      try {
        const data = await listAssignmentsForStudent({
          classId: identity.classId,
          studentId: identity.studentId,
        });

        if (!active) {
          return;
        }

        setAssignments(data.assignments || []);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError.message || 'Unable to load assignments.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAssignments();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="student-page">
      <div className="student-page__content">
        <header className="student-page__hero">
          <p className="student-eyebrow">Student</p>
          <h1>Assignments</h1>
          <p>Open your current assignments and start the correct game with the locked assignment settings.</p>
        </header>

        <div className="student-stack">
          {!studentIdentity ? (
            <section className="student-card">
              <h2>No student selected</h2>
              <p>Choose your student name first.</p>
              <Link className="student-primary-button" to="/student">
                Go to student entry
              </Link>
            </section>
          ) : (
            <section className="student-card">
              <p className="student-eyebrow">Current student</p>
              <h2>{studentIdentity.studentDisplayName}</h2>
              <p>{studentIdentity.className}</p>
              <div className="student-actions">
                <Link className="student-secondary-button" to="/student">
                  Choose another student
                </Link>
              </div>
            </section>
          )}

          <section className="student-card">
            <p className="student-eyebrow">Current work</p>
            <h2>Assignment list</h2>
            {error ? <p className="student-alert student-alert--error">{error}</p> : null}
            {error ? (
              <div className="student-actions">
                <button className="student-secondary-button" onClick={handleRetry} type="button">
                  Try again
                </button>
              </div>
            ) : null}
            {loading ? <p>Loading assignments.</p> : null}
            {!loading && !error && assignments.length === 0 ? (
              <p>No assignments have been posted for this student yet.</p>
            ) : null}
            <div className="student-stack">
              {assignments.map((assignment) => (
                <article className="student-card" key={assignment.id}>
                  <p className="student-eyebrow">{assignment.gameId}</p>
                  <h3>{assignment.title}</h3>
                  {assignment.instructions ? <p>{assignment.instructions}</p> : null}
                  <p>Due: {formatDueDate(assignment.dueAt)}</p>
                  {assignment.studentStatus === 'completed' ? (
                    <p className="student-alert student-alert--info">
                      Completed{assignment.completedAt ? ` on ${formatDueDate(assignment.completedAt)}` : ''}.
                    </p>
                  ) : (
                    <Link
                      className="student-primary-button"
                      to={`${getGamePathByGameId(assignment.gameId)}?assignmentId=${assignment.id}`}
                    >
                      Start
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
