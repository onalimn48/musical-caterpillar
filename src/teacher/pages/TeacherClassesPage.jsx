import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TeacherShell from '../TeacherShell.jsx';
import { useTeacherAuth } from '../TeacherAuthContext.jsx';
import {
  createTeacherClass,
  listTeacherClasses,
} from '../data/classroomApi.js';
import { generateClassCode } from '../utils/classCodes.js';

export default function TeacherClassesPage() {
  const { teacher, session, loading, error, signOut } = useTeacherAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState('');
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);
  const [draftCode, setDraftCode] = useState(generateClassCode());
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    gradeLabel: '',
  });

  const teacherEmail = teacher?.email || session?.user?.email || '';

  useEffect(() => {
    if (!teacher?.approved) {
      setClassesLoading(false);
      return;
    }

    let active = true;

    async function loadClasses() {
      setClassesLoading(true);
      setClassesError('');

      try {
        const data = await listTeacherClasses(teacher.id);

        if (!active) {
          return;
        }

        setClasses(data);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setClassesError(loadError.message || 'Unable to load classes.');
      } finally {
        if (active) {
          setClassesLoading(false);
        }
      }
    }

    loadClasses();

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

  async function handleCreateClass(event) {
    event.preventDefault();
    const action = event.nativeEvent.submitter?.value || 'add-students';

    setCreating(true);
    setFormError('');

    try {
      const createdClass = await createTeacherClass({
        teacherId: teacher.id,
        name: formState.name.trim(),
        description: formState.description.trim(),
        gradeLabel: formState.gradeLabel.trim(),
        preferredCode: draftCode,
      });

      setClasses((current) => [createdClass, ...current]);
      setFormState({
        name: '',
        description: '',
        gradeLabel: '',
      });
      setDraftCode(generateClassCode());

      if (action === 'add-students') {
        navigate(`/teacher/classes/${createdClass.id}`);
      }
    } catch (createError) {
      setFormError(createError.message || 'Unable to create class.');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <TeacherShell teacherEmail={teacherEmail} title="Classes">
        <section className="teacher-panel">
          <p className="teacher-support-copy">Loading your classes.</p>
        </section>
      </TeacherShell>
    );
  }

  if (error) {
    return (
      <TeacherShell
        teacherEmail={teacherEmail}
        title="Classes"
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
        title="Classes"
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
      title="Classes"
      onSignOut={handleSignOut}
      signOutDisabled={signingOut}
    >
      <div className="teacher-stack">
        <section className="teacher-panel">
          <div className="teacher-panel__header">
            <div>
              <p className="teacher-overline">Day 2</p>
              <h2>Create class</h2>
            </div>
            <Link className="teacher-inline-link" to="/teacher">
              Back to dashboard
            </Link>
          </div>
          <form className="teacher-form-grid" onSubmit={handleCreateClass}>
            <label className="teacher-field">
              <span>Class name</span>
              <input
                disabled={creating}
                onChange={(event) => setFormState((current) => ({
                  ...current,
                  name: event.target.value,
                }))}
                required
                type="text"
                value={formState.name}
              />
            </label>
            <label className="teacher-field">
              <span>Grade label</span>
              <input
                disabled={creating}
                onChange={(event) => setFormState((current) => ({
                  ...current,
                  gradeLabel: event.target.value,
                }))}
                placeholder="3rd Grade"
                type="text"
                value={formState.gradeLabel}
              />
            </label>
            <label className="teacher-field teacher-field--full">
              <span>Description</span>
              <textarea
                disabled={creating}
                onChange={(event) => setFormState((current) => ({
                  ...current,
                  description: event.target.value,
                }))}
                placeholder="Optional note for this class"
                rows="4"
                value={formState.description}
              />
            </label>
            <div className="teacher-field teacher-field--full">
              <span>Class code</span>
              <div className="teacher-code-row">
                <input disabled type="text" value={draftCode}/>
                <button
                  className="teacher-secondary-button"
                  disabled={creating}
                  onClick={() => setDraftCode(generateClassCode())}
                  type="button"
                >
                  Regenerate
                </button>
              </div>
            </div>
            <div className="teacher-button-row">
              <button
                className="teacher-primary-button"
                disabled={creating}
                type="submit"
                value="add-students"
              >
                {creating ? 'Saving...' : 'Save and add students'}
              </button>
              <button
                className="teacher-secondary-button"
                disabled={creating}
                type="submit"
                value="stay"
              >
                Save class
              </button>
            </div>
          </form>
          {formError ? (
            <p className="teacher-alert teacher-alert--error">{formError}</p>
          ) : null}
        </section>

        <section className="teacher-panel">
          <div className="teacher-panel__header">
            <div>
              <p className="teacher-overline">Roster</p>
              <h2>Your classes</h2>
            </div>
          </div>
          {classesError ? (
            <p className="teacher-alert teacher-alert--error">{classesError}</p>
          ) : null}
          {classesLoading ? (
            <p className="teacher-support-copy">Loading classes.</p>
          ) : null}
          {!classesLoading && classes.length === 0 ? (
            <p className="teacher-support-copy">
              No classes yet. Create your first class above.
            </p>
          ) : null}
          <div className="teacher-card-list">
            {classes.map((classroom) => (
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
                  {classroom.description ? (
                    <p className="teacher-support-copy">{classroom.description}</p>
                  ) : null}
                </article>
              </Link>
            ))}
          </div>
          {signOutError ? (
            <p className="teacher-alert teacher-alert--error">{signOutError}</p>
          ) : null}
        </section>
      </div>
    </TeacherShell>
  );
}
