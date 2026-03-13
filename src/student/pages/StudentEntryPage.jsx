import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loadRememberedStudentIdentities,
  saveRememberedStudentIdentity,
} from '../studentStorage.js';
import { lookupClassByCode } from '../studentApi.js';
import '../student.css';

function buildIdentitySummary(identity) {
  return `${identity.studentDisplayName} in ${identity.className}`;
}

export default function StudentEntryPage() {
  const navigate = useNavigate();
  const [rememberedIdentities, setRememberedIdentities] = useState([]);
  const [selectedRememberedKey, setSelectedRememberedKey] = useState('');
  const [classCode, setClassCode] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [missingNameMessage, setMissingNameMessage] = useState('');
  const [selectionError, setSelectionError] = useState('');
  const [classroom, setClassroom] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [activeIdentity, setActiveIdentity] = useState(null);
  const selectedRememberedIdentity = rememberedIdentities.find(
    (item) => `${item.classId}:${item.studentId}` === selectedRememberedKey
  ) || rememberedIdentities[0] || null;

  useEffect(() => {
    const identities = loadRememberedStudentIdentities();
    setRememberedIdentities(identities);

    if (identities.length > 0) {
      setSelectedRememberedKey(`${identities[0].classId}:${identities[0].studentId}`);
    }
  }, []);

  async function handleLookupClass(event) {
    event.preventDefault();
    setLookupLoading(true);
    setLookupError('');
    setMissingNameMessage('');
    setSelectionError('');
    setActiveIdentity(null);

    try {
      const data = await lookupClassByCode(classCode);
      setClassroom(data.classroom);
      setSelectedStudentId(data.classroom.students[0]?.id || '');
      setClassCode(data.classroom.classCode);
    } catch (error) {
      setClassroom(null);
      setSelectedStudentId('');
      setLookupError(error.message || 'Unable to look up class.');
    } finally {
      setLookupLoading(false);
    }
  }

  function handleSelectIdentity() {
    if (!classroom || !selectedStudentId) {
      setSelectionError('Choose your name first.');
      return;
    }

    const student = classroom.students.find((item) => item.id === selectedStudentId);

    if (!student) {
      setSelectionError('Choose your name first.');
      return;
    }

    const identity = {
      classId: classroom.id,
      className: classroom.name,
      studentId: student.id,
      studentDisplayName: student.displayName,
    };

    const nextIdentities = saveRememberedStudentIdentity(identity);
    setRememberedIdentities(nextIdentities);
    setSelectedRememberedKey(`${identity.classId}:${identity.studentId}`);
    setActiveIdentity(identity);
    setSelectionError('');
    setMissingNameMessage('');
    navigate('/student/assignments');
  }

  function handleContinueRememberedIdentity() {
    const identity = selectedRememberedIdentity;

    if (!identity) {
      return;
    }

    setActiveIdentity(identity);
    setClassroom(null);
    setLookupError('');
    setMissingNameMessage('');
    setSelectionError('');
    navigate('/student/assignments');
  }

  function handleChooseAnotherStudent() {
    setActiveIdentity(null);
    setLookupError('');
    setMissingNameMessage('');
    setSelectionError('');
  }

  function handleEnterDifferentClassCode() {
    setActiveIdentity(null);
    setClassroom(null);
    setClassCode('');
    setSelectedStudentId('');
    setLookupError('');
    setMissingNameMessage('');
    setSelectionError('');
  }

  return (
    <div className="student-page">
      <div className="student-page__content">
        <header className="student-page__hero">
          <p className="student-eyebrow">Student</p>
          <h1>Find your class</h1>
          <p>Enter your class code, choose your name, and this device will remember you.</p>
        </header>

        <div className="student-stack">
          {rememberedIdentities.length > 0 ? (
            <section className="student-card">
              <p className="student-eyebrow">Welcome back</p>
              <h2>
                Welcome back, {activeIdentity?.studentDisplayName || selectedRememberedIdentity?.studentDisplayName}
              </h2>
              <p>Continue with a saved student profile from this device.</p>
              {rememberedIdentities.length > 1 ? (
                <label className="student-field">
                  <span className="student-label">Saved students</span>
                  <select
                    onChange={(event) => setSelectedRememberedKey(event.target.value)}
                    value={selectedRememberedKey}
                  >
                    {rememberedIdentities.map((identity) => (
                      <option
                        key={`${identity.classId}:${identity.studentId}`}
                        value={`${identity.classId}:${identity.studentId}`}
                      >
                        {buildIdentitySummary(identity)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <div className="student-actions">
                <button
                  className="student-primary-button"
                  onClick={handleContinueRememberedIdentity}
                  type="button"
                >
                  Continue
                </button>
                <button
                  className="student-secondary-button"
                  onClick={handleChooseAnotherStudent}
                  type="button"
                >
                  Choose another student
                </button>
                <button
                  className="student-secondary-button"
                  onClick={handleEnterDifferentClassCode}
                  type="button"
                >
                  Enter different class code
                </button>
              </div>
            </section>
          ) : null}

          {activeIdentity ? (
            <section className="student-card">
              <span className="student-pill">Signed in on this device</span>
              <div className="student-identity-summary">
                <h2>{activeIdentity.studentDisplayName}</h2>
                <p>{activeIdentity.className}</p>
                <p className="student-alert student-alert--info">
                  You are ready for the next student step once assignments are added.
                </p>
              </div>
            </section>
          ) : null}

          <section className="student-card">
            <p className="student-eyebrow">Class code</p>
            <h2>Enter your class code</h2>
            <form className="student-form" onSubmit={handleLookupClass}>
              <label className="student-field">
                <span className="student-label">Class code</span>
                <input
                  autoCapitalize="characters"
                  disabled={lookupLoading}
                  onChange={(event) => setClassCode(event.target.value.toUpperCase())}
                  placeholder="MUSIC-4829"
                  type="text"
                  value={classCode}
                />
              </label>
              <button
                className="student-primary-button"
                disabled={lookupLoading}
                type="submit"
              >
                {lookupLoading ? 'Looking up...' : 'Find class'}
              </button>
            </form>
            {lookupError ? (
              <p className="student-alert student-alert--error">{lookupError}</p>
            ) : null}
          </section>

          {classroom ? (
            <section className="student-card">
              <p className="student-eyebrow">Roster</p>
              <h3>{classroom.name}</h3>
              {classroom.students.length > 0 ? (
                <>
                  <p>Choose your name from the class roster.</p>
                  <label className="student-field">
                    <span className="student-label">Your name</span>
                    <select
                      onChange={(event) => setSelectedStudentId(event.target.value)}
                      value={selectedStudentId}
                    >
                      {classroom.students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.displayName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="student-actions">
                    <button
                      className="student-primary-button"
                      onClick={handleSelectIdentity}
                      type="button"
                    >
                      That&apos;s me
                    </button>
                    <button
                      className="student-secondary-button"
                      onClick={() => {
                        setMissingNameMessage('Your name is missing. Ask your teacher to add you to the class roster.');
                        setSelectionError('');
                      }}
                      type="button"
                    >
                      My name is missing
                    </button>
                  </div>
                  {selectionError ? (
                    <p className="student-alert student-alert--error">{selectionError}</p>
                  ) : null}
                  {missingNameMessage ? (
                    <p className="student-alert student-alert--info">{missingNameMessage}</p>
                  ) : null}
                  <ul className="student-list">
                    {classroom.students.map((student) => (
                      <li key={student.id}>{student.displayName}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="student-alert student-alert--info">
                  This class roster is empty. Ask your teacher to add your name.
                </p>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
