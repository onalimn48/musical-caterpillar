import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAssignmentsForStudent } from './assignmentApi.js';
import { getCurrentStudentIdentity } from '../student/studentStorage.js';

export default function StudentResultScreen({
  title,
  subtitle,
  summaryLines,
  currentAssignmentId = '',
  error = '',
}) {
  const [remainingAssignments, setRemainingAssignments] = useState([]);
  const [remainingLoading, setRemainingLoading] = useState(false);

  useEffect(() => {
    const studentIdentity = getCurrentStudentIdentity();

    if (!studentIdentity || error) {
      setRemainingAssignments([]);
      setRemainingLoading(false);
      return;
    }

    let active = true;

    async function loadRemainingAssignments() {
      setRemainingLoading(true);

      try {
        const data = await listAssignmentsForStudent({
          classId: studentIdentity.classId,
          studentId: studentIdentity.studentId,
        });

        if (!active) {
          return;
        }

        setRemainingAssignments(
          (data.assignments || []).filter((assignment) => (
            assignment.id !== currentAssignmentId && assignment.studentStatus !== 'completed'
          ))
        );
      } catch (_loadError) {
        if (!active) {
          return;
        }

        setRemainingAssignments([]);
      } finally {
        if (active) {
          setRemainingLoading(false);
        }
      }
    }

    loadRemainingAssignments();

    return () => {
      active = false;
    };
  }, [currentAssignmentId, error]);

  const hasRemainingAssignments = remainingAssignments.length > 0;
  const assignmentsButtonLabel = hasRemainingAssignments ? 'Go to remaining assignments' : 'Back to assignments';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'linear-gradient(180deg, #132238 0%, #29446b 100%)',
      color: '#f8fbff',
      fontFamily: '"Trebuchet MS", "Avenir Next", sans-serif',
      padding: 24,
    }}>
      <div style={{
        width: 'min(100%, 520px)',
        borderRadius: 24,
        padding: 28,
        background: 'rgba(12, 20, 36, 0.72)',
        border: '1px solid rgba(255,255,255,0.16)',
      }}>
        <p style={{
          margin: '0 0 8px',
          color: '#fde68a',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
          Assignment
        </p>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <p style={{ color: '#d7e5f7', lineHeight: 1.5 }}>{subtitle}</p>
        {summaryLines?.length ? (
          <ul style={{ color: '#d7e5f7', paddingLeft: 18 }}>
            {summaryLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
        {!error && !remainingLoading && hasRemainingAssignments ? (
          <p style={{
            margin: '14px 0 0',
            padding: '12px 14px',
            borderRadius: 14,
            background: 'rgba(125, 211, 252, 0.14)',
            color: '#dbeafe',
          }}>
            You still have {remainingAssignments.length} assignment{remainingAssignments.length === 1 ? '' : 's'} left.
          </p>
        ) : null}
        {error ? (
          <p style={{
            padding: '12px 14px',
            borderRadius: 14,
            background: 'rgba(248, 113, 113, 0.16)',
            color: '#fecaca',
          }}>
            {error}
          </p>
        ) : null}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
          <Link
            to="/student/assignments"
            style={{
              borderRadius: 999,
              background: 'linear-gradient(135deg, #fde68a 0%, #7dd3fc 100%)',
              color: '#122033',
              fontWeight: 700,
              padding: '12px 18px',
              textDecoration: 'none',
            }}
          >
            {assignmentsButtonLabel}
          </Link>
          <Link
            to="/student"
            style={{
              borderRadius: 999,
              background: 'rgba(255,255,255,0.1)',
              color: '#f8fbff',
              padding: '12px 18px',
              textDecoration: 'none',
            }}
          >
            Switch student
          </Link>
        </div>
      </div>
    </div>
  );
}
