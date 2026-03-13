import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTeacherAuth } from '../TeacherAuthContext.jsx';
import '../teacher.css';

export default function TeacherSignInPage() {
  const {
    session,
    loading,
    error: authError,
    configReady,
    signInWithPassword,
    signUpWithPassword,
  } = useTeacherAuth();
  const [mode, setMode] = useState('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  if (session && !loading) {
    return <Navigate to="/teacher" replace/>;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');
    setNotice('');

    const payload = {
      email: email.trim(),
      password,
    };

    const result = mode === 'sign-in'
      ? await signInWithPassword(payload)
      : await signUpWithPassword(payload);

    setSubmitting(false);

    if (result.error) {
      setFormError(result.error.message);
      return;
    }

    if (mode === 'create-account') {
      setNotice('Account created. If email confirmation is enabled, confirm your email, then sign in.');
      setMode('sign-in');
      setPassword('');
    }
  }

  return (
    <div className="teacher-auth-page">
      <div className="teacher-auth-card">
        <p className="teacher-eyebrow">Teacher</p>
        <h1>{mode === 'sign-in' ? 'Sign in' : 'Create account'}</h1>
        <p className="teacher-support-copy">
          {mode === 'sign-in'
            ? 'Use your Supabase email and password to access the teacher area.'
            : 'New teacher accounts start pending approval.'}
        </p>
        {!configReady ? (
          <p className="teacher-alert teacher-alert--error">{authError}</p>
        ) : null}
        {configReady && authError && !loading && !session ? (
          <p className="teacher-alert teacher-alert--error">{authError}</p>
        ) : null}
        {formError ? (
          <p className="teacher-alert teacher-alert--error">{formError}</p>
        ) : null}
        {notice ? (
          <p className="teacher-alert teacher-alert--success">{notice}</p>
        ) : null}
        <form className="teacher-auth-form" onSubmit={handleSubmit}>
          <label className="teacher-field">
            <span>Email</span>
            <input
              autoComplete="email"
              disabled={!configReady || submitting}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="teacher-field">
            <span>Password</span>
            <input
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              disabled={!configReady || submitting}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <button
            className="teacher-primary-button"
            disabled={!configReady || submitting}
            type="submit"
          >
            {submitting
              ? 'Working...'
              : mode === 'sign-in'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>
        <button
          className="teacher-link-button"
          disabled={!configReady || submitting}
          onClick={() => {
            setFormError('');
            setNotice('');
            setMode((current) => (
              current === 'sign-in' ? 'create-account' : 'sign-in'
            ));
          }}
          type="button"
        >
          {mode === 'sign-in'
            ? 'Need an account? Create one'
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
