import './teacher.css';

export default function TeacherShell({
  teacherEmail,
  title,
  children,
  onSignOut,
  signOutDisabled = false,
}) {
  return (
    <div className="teacher-shell">
      <div className="teacher-shell__backdrop"/>
      <div className="teacher-shell__content">
        <header className="teacher-shell__header">
          <div>
            <p className="teacher-eyebrow">Teacher</p>
            <h1>{title}</h1>
          </div>
          <div className="teacher-shell__header-actions">
            {teacherEmail ? (
              <span className="teacher-shell__email">{teacherEmail}</span>
            ) : null}
            {onSignOut ? (
              <button
                className="teacher-secondary-button"
                disabled={signOutDisabled}
                onClick={onSignOut}
                type="button"
              >
                Sign out
              </button>
            ) : null}
          </div>
        </header>
        <main className="teacher-shell__main">
          {children}
        </main>
      </div>
    </div>
  );
}
