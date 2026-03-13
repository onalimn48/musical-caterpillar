import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TeacherShell from '../TeacherShell.jsx';
import { useTeacherAuth } from '../TeacherAuthContext.jsx';
import {
  addBulkStudents,
  addSingleStudent,
  getTeacherClass,
  listClassStudents,
} from '../data/classroomApi.js';

export default function TeacherClassDetailPage() {
  const { classId } = useParams();
  const { teacher, session, loading, error, signOut } = useTeacherAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [singleStudent, setSingleStudent] = useState({
    firstName: '',
    lastInitial: '',
  });
  const [bulkText, setBulkText] = useState('');
  const [singleSubmitting, setSingleSubmitting] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [singleError, setSingleError] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [rosterNotice, setRosterNotice] = useState('');

  const teacherEmail = teacher?.email || session?.user?.email || '';

  useEffect(() => {
    if (!teacher?.approved || !classId) {
      setPageLoading(false);
      return;
    }

    let active = true;

    async function loadPage() {
      setPageLoading(true);
      setPageError('');

      try {
        const [classData, studentData] = await Promise.all([
          getTeacherClass({ teacherId: teacher.id, classId }),
          listClassStudents(classId),
        ]);

        if (!active) {
          return;
        }

        if (!classData) {
          setPageError('Class not found.');
          setClassroom(null);
          setStudents([]);
          return;
        }

        setClassroom(classData);
        setStudents(studentData);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setPageError(loadError.message || 'Unable to load class.');
      } finally {
        if (active) {
          setPageLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [classId, teacher]);

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError('');

    const result = await signOut();

    setSigningOut(false);

    if (result.error) {
      setSignOutError(result.error.message);
    }
  }

  async function handleAddSingleStudent(event) {
    event.preventDefault();
    setSingleSubmitting(true);
    setSingleError('');
    setRosterNotice('');

    try {
      const student = await addSingleStudent({
        classId,
        firstName: singleStudent.firstName,
        lastInitial: singleStudent.lastInitial,
      });

      setStudents((current) => [...current, student].sort((left, right) => (
        left.sort_name.localeCompare(right.sort_name)
      )));
      setSingleStudent({
        firstName: '',
        lastInitial: '',
      });
      setRosterNotice(`Added ${student.display_name}.`);
    } catch (studentError) {
      setSingleError(studentError.message || 'Unable to add student.');
    } finally {
      setSingleSubmitting(false);
    }
  }

  async function handleBulkAddStudents(event) {
    event.preventDefault();
    setBulkSubmitting(true);
    setBulkError('');
    setRosterNotice('');

    try {
      const createdStudents = await addBulkStudents({
        classId,
        rawText: bulkText,
      });

      setStudents((current) => [...current, ...createdStudents].sort((left, right) => (
        left.sort_name.localeCompare(right.sort_name)
      )));
      setBulkText('');
      setRosterNotice(`Added ${createdStudents.length} students.`);
    } catch (studentError) {
      setBulkError(studentError.message || 'Unable to add students.');
    } finally {
      setBulkSubmitting(false);
    }
  }

  async function handleCopyClassCode() {
    if (!classroom?.class_code || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(classroom.class_code);
    setRosterNotice(`Copied ${classroom.class_code}.`);
  }

  if (loading) {
    return (
      <TeacherShell teacherEmail={teacherEmail} title="Class detail">
        <section className="teacher-panel">
          <p className="teacher-support-copy">Loading class.</p>
        </section>
      </TeacherShell>
    );
  }

  if (error) {
    return (
      <TeacherShell
        teacherEmail={teacherEmail}
        title="Class detail"
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
        title="Class detail"
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
      title={classroom?.name || 'Class detail'}
      onSignOut={handleSignOut}
      signOutDisabled={signingOut}
    >
      <div className="teacher-stack">
        <section className="teacher-panel">
          <div className="teacher-panel__header">
            <div>
              <p className="teacher-overline">Class</p>
              <h2>{classroom?.name || 'Class detail'}</h2>
            </div>
            <div className="teacher-header-links">
              <Link className="teacher-inline-link" to={`/teacher/assignments/new?classId=${classId}`}>
                Create assignment
              </Link>
              <Link className="teacher-inline-link" to="/teacher/classes">
                Back to classes
              </Link>
            </div>
          </div>
          {pageLoading ? (
            <p className="teacher-support-copy">Loading class details.</p>
          ) : null}
          {pageError ? (
            <p className="teacher-alert teacher-alert--error">{pageError}</p>
          ) : null}
          {classroom ? (
            <div className="teacher-detail-grid">
              <div className="teacher-detail-card">
                <span className="teacher-label">Class code</span>
                <div className="teacher-code-row">
                  <strong>{classroom.class_code}</strong>
                  <button
                    className="teacher-secondary-button"
                    onClick={handleCopyClassCode}
                    type="button"
                  >
                    Copy code
                  </button>
                </div>
              </div>
              <div className="teacher-detail-card">
                <span className="teacher-label">Grade label</span>
                <strong>{classroom.grade_label || 'Not set'}</strong>
              </div>
              <div className="teacher-detail-card teacher-detail-card--full">
                <span className="teacher-label">Description</span>
                <p className="teacher-support-copy">
                  {classroom.description || 'No description yet.'}
                </p>
              </div>
            </div>
          ) : null}
          {rosterNotice ? (
            <p className="teacher-alert teacher-alert--success">{rosterNotice}</p>
          ) : null}
          {signOutError ? (
            <p className="teacher-alert teacher-alert--error">{signOutError}</p>
          ) : null}
        </section>

        {classroom ? (
          <div className="teacher-two-column">
            <section className="teacher-panel">
              <div className="teacher-panel__header">
                <div>
                  <p className="teacher-overline">Roster</p>
                  <h2>Add one student</h2>
                </div>
              </div>
              <form className="teacher-form-grid" onSubmit={handleAddSingleStudent}>
                <label className="teacher-field">
                  <span>First name</span>
                  <input
                    disabled={singleSubmitting}
                    onChange={(event) => setSingleStudent((current) => ({
                      ...current,
                      firstName: event.target.value,
                    }))}
                    required
                    type="text"
                    value={singleStudent.firstName}
                  />
                </label>
                <label className="teacher-field">
                  <span>Last initial</span>
                  <input
                    disabled={singleSubmitting}
                    maxLength={1}
                    onChange={(event) => setSingleStudent((current) => ({
                      ...current,
                      lastInitial: event.target.value,
                    }))}
                    placeholder="M"
                    type="text"
                    value={singleStudent.lastInitial}
                  />
                </label>
                <div className="teacher-button-row">
                  <button
                    className="teacher-primary-button"
                    disabled={singleSubmitting}
                    type="submit"
                  >
                    {singleSubmitting ? 'Adding...' : 'Add student'}
                  </button>
                </div>
              </form>
              {singleError ? (
                <p className="teacher-alert teacher-alert--error">{singleError}</p>
              ) : null}
            </section>

            <section className="teacher-panel">
              <div className="teacher-panel__header">
                <div>
                  <p className="teacher-overline">Roster</p>
                  <h2>Bulk paste students</h2>
                </div>
              </div>
              <form className="teacher-form-grid" onSubmit={handleBulkAddStudents}>
                <label className="teacher-field teacher-field--full">
                  <span>One name per line</span>
                  <textarea
                    disabled={bulkSubmitting}
                    onChange={(event) => setBulkText(event.target.value)}
                    placeholder={'Ava\nLeo M\nJordan'}
                    rows="8"
                    value={bulkText}
                  />
                </label>
                <div className="teacher-button-row">
                  <button
                    className="teacher-primary-button"
                    disabled={bulkSubmitting}
                    type="submit"
                  >
                    {bulkSubmitting ? 'Adding...' : 'Add roster'}
                  </button>
                </div>
              </form>
              {bulkError ? (
                <p className="teacher-alert teacher-alert--error">{bulkError}</p>
              ) : null}
            </section>
          </div>
        ) : null}

        <section className="teacher-panel">
          <div className="teacher-panel__header">
            <div>
              <p className="teacher-overline">Roster</p>
              <h2>Students</h2>
            </div>
          </div>
          {!students.length && !pageLoading && !pageError ? (
            <p className="teacher-support-copy">
              No students yet. Add your roster above.
            </p>
          ) : null}
          <div className="teacher-list">
            {students.map((student) => (
              <div className="teacher-list__item" key={student.id}>
                <span>{student.display_name}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </TeacherShell>
  );
}
