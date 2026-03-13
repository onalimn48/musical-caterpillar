import { Navigate } from 'react-router-dom';
import { useTeacherAuth } from './TeacherAuthContext.jsx';
import './teacher.css';

function TeacherRouteLoading() {
  return (
    <div className="teacher-auth-page">
      <div className="teacher-auth-card">
        <p className="teacher-eyebrow">Teacher</p>
        <h1>Loading account</h1>
        <p className="teacher-support-copy">
          Checking your session.
        </p>
      </div>
    </div>
  );
}

export default function TeacherProtectedRoute({ children }) {
  const { session, loading, configReady } = useTeacherAuth();

  if (!configReady) {
    return children;
  }

  if (loading) {
    return <TeacherRouteLoading/>;
  }

  if (!session) {
    return <Navigate to="/teacher/sign-in" replace/>;
  }

  return children;
}
