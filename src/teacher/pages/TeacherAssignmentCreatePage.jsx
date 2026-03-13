import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import TeacherShell from '../TeacherShell.jsx';
import { useTeacherAuth } from '../TeacherAuthContext.jsx';
import { listTeacherClasses } from '../data/classroomApi.js';
import { createTeacherAssignment } from '../data/assignmentApi.js';
import { NPM_BENCHMARK_PRESETS } from '../../games/notes-per-minute/data/benchmarks.js';
import { STAGES } from '../../games/note-speller/data/stages.js';
import { CLEFS as NOTE_SPELLER_CLEFS } from '../../games/note-speller/data/clefs.js';

const NPM_CLEF_OPTIONS = ['Treble', 'Bass', 'Alto'];

function buildDefaultFormState(defaultClassId = '') {
  return {
    classId: defaultClassId,
    gameId: 'notes-per-minute',
    title: '',
    instructions: '',
    dueAt: '',
    npmRunType: 'benchmark',
    npmPresetId: NPM_BENCHMARK_PRESETS[0].id,
    npmPracticeClef: 'Treble',
    npmPracticeDurationSeconds: 60,
    npmPracticeAllowLedgerLines: false,
    npmPracticeIncludeAccidentals: false,
    noteSpellerClef: 'treble',
    noteSpellerStage: 1,
    noteSpellerTargetWords: 10,
  };
}

export default function TeacherAssignmentCreatePage() {
  const { teacher, session, loading, error, signOut } = useTeacherAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultClassId = searchParams.get('classId') || '';
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [formState, setFormState] = useState(buildDefaultFormState(defaultClassId));

  const teacherEmail = teacher?.email || session?.user?.email || '';

  useEffect(() => {
    setFormState(buildDefaultFormState(defaultClassId));
  }, [defaultClassId]);

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

  const activityConfig = useMemo(() => {
    if (formState.gameId === 'note-speller') {
      return {
        gameId: 'note-speller',
        mode: 'game',
        clef: formState.noteSpellerClef,
        stage: Number(formState.noteSpellerStage),
        targetWords: Math.max(1, Math.min(50, Number(formState.noteSpellerTargetWords) || 10)),
      };
    }

    if (formState.npmRunType === 'practice') {
      return {
        gameId: 'notes-per-minute',
        runType: 'practice',
        clef: formState.npmPracticeClef,
        durationSeconds: Number(formState.npmPracticeDurationSeconds),
        allowLedgerLines: Boolean(formState.npmPracticeAllowLedgerLines),
        includeAccidentals: Boolean(formState.npmPracticeIncludeAccidentals),
      };
    }

    return {
      gameId: 'notes-per-minute',
      runType: 'benchmark',
      presetId: formState.npmPresetId,
    };
  }, [formState]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');
    setNotice('');

    try {
      if (!formState.classId) {
        throw new Error('Choose a class.');
      }

      const createdAssignment = await createTeacherAssignment({
        teacherId: teacher.id,
        classId: formState.classId,
        title: formState.title,
        instructions: formState.instructions,
        gameId: formState.gameId,
        activityConfig,
        dueAt: formState.dueAt,
      });

      setNotice('Assignment created.');
      navigate(`/teacher/assignments/${createdAssignment.id}`);
    } catch (submitError) {
      setFormError(submitError.message || 'Unable to create assignment.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <TeacherShell teacherEmail={teacherEmail} title="Create assignment">
        <section className="teacher-panel">
          <p className="teacher-support-copy">Loading assignment form.</p>
        </section>
      </TeacherShell>
    );
  }

  if (error) {
    return (
      <TeacherShell teacherEmail={teacherEmail} title="Create assignment" onSignOut={handleSignOut} signOutDisabled={signingOut}>
        <section className="teacher-panel">
          <p className="teacher-alert teacher-alert--error">{error}</p>
        </section>
      </TeacherShell>
    );
  }

  if (!teacher?.approved) {
    return (
      <TeacherShell teacherEmail={teacherEmail} title="Create assignment" onSignOut={handleSignOut} signOutDisabled={signingOut}>
        <section className="teacher-panel">
          <h2>Approval pending</h2>
          <p className="teacher-support-copy">Your account is pending approval.</p>
        </section>
      </TeacherShell>
    );
  }

  return (
    <TeacherShell teacherEmail={teacherEmail} title="Create assignment" onSignOut={handleSignOut} signOutDisabled={signingOut}>
      <div className="teacher-stack">
        <section className="teacher-panel">
          <div className="teacher-panel__header">
            <div>
              <p className="teacher-overline">Day 4</p>
              <h2>New assignment</h2>
            </div>
            <Link className="teacher-inline-link" to="/teacher">
              Back to dashboard
            </Link>
          </div>
          {classesError ? <p className="teacher-alert teacher-alert--error">{classesError}</p> : null}
          {classesLoading ? <p className="teacher-support-copy">Loading classes.</p> : null}
          {!classesLoading && classes.length === 0 ? (
            <p className="teacher-support-copy">Create a class before making assignments.</p>
          ) : null}
          <form className="teacher-form-grid" onSubmit={handleSubmit}>
            <label className="teacher-field">
              <span>Class</span>
              <select
                disabled={submitting || classesLoading || classes.length === 0}
                onChange={(event) => setFormState((current) => ({ ...current, classId: event.target.value }))}
                required
                value={formState.classId}
              >
                <option value="">Select a class</option>
                {classes.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="teacher-field">
              <span>Game</span>
              <select
                disabled={submitting}
                onChange={(event) => setFormState((current) => ({ ...current, gameId: event.target.value }))}
                value={formState.gameId}
              >
                <option value="notes-per-minute">Notes Per Minute</option>
                <option value="note-speller">Note Speller</option>
              </select>
            </label>
            <label className="teacher-field teacher-field--full">
              <span>Assignment title</span>
              <input
                disabled={submitting}
                onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
                required
                type="text"
                value={formState.title}
              />
            </label>
            <label className="teacher-field teacher-field--full">
              <span>Instructions</span>
              <textarea
                disabled={submitting}
                onChange={(event) => setFormState((current) => ({ ...current, instructions: event.target.value }))}
                rows="4"
                value={formState.instructions}
              />
            </label>
            <label className="teacher-field">
              <span>Due date</span>
              <input
                disabled={submitting}
                onChange={(event) => setFormState((current) => ({ ...current, dueAt: event.target.value }))}
                type="datetime-local"
                value={formState.dueAt}
              />
            </label>

            {formState.gameId === 'notes-per-minute' ? (
              <>
                <label className="teacher-field">
                  <span>Run type</span>
                  <select
                    disabled={submitting}
                    onChange={(event) => setFormState((current) => ({ ...current, npmRunType: event.target.value }))}
                    value={formState.npmRunType}
                  >
                    <option value="benchmark">Benchmark</option>
                    <option value="practice">Practice</option>
                  </select>
                </label>
                {formState.npmRunType === 'benchmark' ? (
                  <label className="teacher-field teacher-field--full">
                    <span>Benchmark preset</span>
                    <select
                      disabled={submitting}
                      onChange={(event) => setFormState((current) => ({ ...current, npmPresetId: event.target.value }))}
                      value={formState.npmPresetId}
                    >
                      {NPM_BENCHMARK_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.id} · {preset.description}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <>
                    <label className="teacher-field">
                      <span>Clef</span>
                      <select
                        disabled={submitting}
                        onChange={(event) => setFormState((current) => ({ ...current, npmPracticeClef: event.target.value }))}
                        value={formState.npmPracticeClef}
                      >
                        {NPM_CLEF_OPTIONS.map((clef) => (
                          <option key={clef} value={clef}>{clef}</option>
                        ))}
                      </select>
                    </label>
                    <label className="teacher-field">
                      <span>Duration seconds</span>
                      <input
                        disabled={submitting}
                        min="30"
                        onChange={(event) => setFormState((current) => ({
                          ...current,
                          npmPracticeDurationSeconds: Number(event.target.value || 60),
                        }))}
                        type="number"
                        value={formState.npmPracticeDurationSeconds}
                      />
                    </label>
                    <label className="teacher-checkbox">
                      <input
                        checked={formState.npmPracticeAllowLedgerLines}
                        disabled={submitting}
                        onChange={(event) => setFormState((current) => ({
                          ...current,
                          npmPracticeAllowLedgerLines: event.target.checked,
                        }))}
                        type="checkbox"
                      />
                      <span>Allow ledger lines</span>
                    </label>
                    <label className="teacher-checkbox">
                      <input
                        checked={formState.npmPracticeIncludeAccidentals}
                        disabled={submitting}
                        onChange={(event) => setFormState((current) => ({
                          ...current,
                          npmPracticeIncludeAccidentals: event.target.checked,
                        }))}
                        type="checkbox"
                      />
                      <span>Include accidentals</span>
                    </label>
                  </>
                )}
              </>
            ) : (
              <>
                <label className="teacher-field">
                  <span>Clef</span>
                  <select
                    disabled={submitting}
                    onChange={(event) => setFormState((current) => ({ ...current, noteSpellerClef: event.target.value }))}
                    value={formState.noteSpellerClef}
                  >
                    {NOTE_SPELLER_CLEFS.map((clef) => (
                      <option key={clef} value={clef}>{clef}</option>
                    ))}
                  </select>
                </label>
                <label className="teacher-field">
                  <span>Stage</span>
                  <select
                    disabled={submitting}
                    onChange={(event) => setFormState((current) => ({
                      ...current,
                      noteSpellerStage: Number(event.target.value),
                    }))}
                    value={formState.noteSpellerStage}
                  >
                    {STAGES.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        Stage {stage.id} · {stage.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="teacher-field">
                  <span>Number of words</span>
                  <input
                    disabled={submitting}
                    max="50"
                    min="1"
                    onChange={(event) => setFormState((current) => ({
                      ...current,
                      noteSpellerTargetWords: Number(event.target.value || 10),
                    }))}
                    type="number"
                    value={formState.noteSpellerTargetWords}
                  />
                </label>
              </>
            )}

            <div className="teacher-button-row">
              <button className="teacher-primary-button" disabled={submitting || classes.length === 0} type="submit">
                {submitting ? 'Saving...' : 'Create assignment'}
              </button>
            </div>
          </form>
          {formError ? <p className="teacher-alert teacher-alert--error">{formError}</p> : null}
          {notice ? <p className="teacher-alert teacher-alert--success">{notice}</p> : null}
        </section>
      </div>
    </TeacherShell>
  );
}
