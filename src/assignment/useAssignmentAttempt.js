import { useEffect, useRef, useState } from 'react';
import {
  recordAttemptCompleted,
  recordAttemptStarted,
} from './assignmentApi.js';

export function useAssignmentAttempt({ assignment, studentIdentity, enabled }) {
  const assignmentKey = assignment && studentIdentity
    ? `${assignment.id}:${studentIdentity.studentId}`
    : '';
  const [state, setState] = useState({
    attemptId: '',
    startedAt: '',
    startStatus: enabled ? 'idle' : 'disabled',
    completionStatus: 'idle',
    error: '',
    payload: null,
  });
  const completionStartedRef = useRef(false);
  const startedKeyRef = useRef('');

  useEffect(() => {
    completionStartedRef.current = false;
    if (startedKeyRef.current !== assignmentKey) {
      startedKeyRef.current = '';
    }
  }, [assignmentKey]);

  useEffect(() => {
    if (!enabled || !assignment || !studentIdentity) {
      return;
    }

    if (startedKeyRef.current === assignmentKey) {
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setState({
        attemptId: '',
        startedAt: '',
        startStatus: 'error',
        completionStatus: 'idle',
        error: 'You need internet to play an assigned game.',
        payload: null,
      });
      return;
    }

    let active = true;

    async function startAttempt() {
      startedKeyRef.current = assignmentKey;
      setState((current) => ({
        ...current,
        startStatus: 'starting',
        error: '',
      }));

      try {
        const data = await recordAttemptStarted({
          assignmentId: assignment.id,
          classId: studentIdentity.classId,
          studentId: studentIdentity.studentId,
        });

        if (!active) {
          return;
        }

        setState({
          attemptId: data.attemptId,
          startedAt: data.startedAt,
          startStatus: 'started',
          completionStatus: 'idle',
          error: '',
          payload: null,
        });
      } catch (error) {
        if (!active) {
          return;
        }

        startedKeyRef.current = '';

        setState({
          attemptId: '',
          startedAt: '',
          startStatus: 'error',
          completionStatus: 'idle',
          error: error.message || 'Unable to start assignment attempt.',
          payload: null,
        });
      }
    }

    startAttempt();

    return () => {
      active = false;
    };
  }, [assignment, assignmentKey, enabled, studentIdentity]);

  async function completeAttempt({ status = 'completed', summary, rawResult }) {
    if (!assignment || !studentIdentity || !state.attemptId || completionStartedRef.current) {
      return null;
    }

    completionStartedRef.current = true;
    setState((current) => ({
      ...current,
      completionStatus: 'completing',
      error: '',
    }));

    const completedAt = new Date().toISOString();
    const payload = {
      assignmentId: assignment.id,
      studentId: studentIdentity.studentId,
      gameId: assignment.gameId,
      gameVersion: '1',
      configSnapshot: assignment.activityConfig,
      startedAt: state.startedAt,
      completedAt,
      status,
      summary,
      rawResult,
    };

    try {
      const data = await recordAttemptCompleted({
        attemptId: state.attemptId,
        assignmentId: assignment.id,
        classId: studentIdentity.classId,
        studentId: studentIdentity.studentId,
        payload,
      });

      setState((current) => ({
        ...current,
        completionStatus: 'completed',
        error: '',
        payload,
      }));

      return data;
    } catch (error) {
      completionStartedRef.current = false;
      setState((current) => ({
        ...current,
        completionStatus: 'error',
        error: error.message || 'Unable to record assignment result.',
        payload,
      }));
      return null;
    }
  }

  return {
    ...state,
    completeAttempt,
  };
}
