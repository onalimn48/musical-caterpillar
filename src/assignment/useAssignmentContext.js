import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCurrentStudentIdentity } from '../student/studentStorage.js';
import { listAssignmentsForStudent } from './assignmentApi.js';

export function useAssignmentContext(expectedGameId = '') {
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('assignmentId') || '';
  const [state, setState] = useState({
    assignmentId,
    assignment: null,
    studentIdentity: getCurrentStudentIdentity(),
    loading: Boolean(assignmentId),
    error: '',
  });

  useEffect(() => {
    const studentIdentity = getCurrentStudentIdentity();

    if (!assignmentId) {
      setState({
        assignmentId: '',
        assignment: null,
        studentIdentity,
        loading: false,
        error: '',
      });
      return;
    }

    if (!studentIdentity) {
      setState({
        assignmentId,
        assignment: null,
        studentIdentity: null,
        loading: false,
        error: 'Choose your student name before opening an assignment.',
      });
      return;
    }

    let active = true;

    async function loadAssignment() {
      setState({
        assignmentId,
        assignment: null,
        studentIdentity,
        loading: true,
        error: '',
      });

      try {
        const data = await listAssignmentsForStudent({
          classId: studentIdentity.classId,
          studentId: studentIdentity.studentId,
          assignmentId,
        });

        if (!active) {
          return;
        }

        const assignment = data.assignment || null;

        if (!assignment) {
          setState({
            assignmentId,
            assignment: null,
            studentIdentity,
            loading: false,
            error: 'Assignment not found.',
          });
          return;
        }

        if (expectedGameId && assignment.gameId !== expectedGameId) {
          setState({
            assignmentId,
            assignment: null,
            studentIdentity,
            loading: false,
            error: 'This assignment belongs to a different game.',
          });
          return;
        }

        setState({
          assignmentId,
          assignment,
          studentIdentity,
          loading: false,
          error: '',
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setState({
          assignmentId,
          assignment: null,
          studentIdentity,
          loading: false,
          error: error.message || 'Unable to load assignment.',
        });
      }
    }

    loadAssignment();

    return () => {
      active = false;
    };
  }, [assignmentId, expectedGameId]);

  return {
    ...state,
    isAssignmentMode: Boolean(assignmentId),
  };
}
