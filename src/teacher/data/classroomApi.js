import { supabase } from '../supabaseClient.js';
import { generateClassCode } from '../utils/classCodes.js';
import {
  buildStudentRecord,
  parseBulkStudentText,
} from '../utils/studentNames.js';

const CLASS_SELECT_FIELDS = [
  'id',
  'teacher_id',
  'name',
  'description',
  'grade_label',
  'class_code',
  'archived',
  'created_at',
].join(', ');

const STUDENT_SELECT_FIELDS = [
  'id',
  'class_id',
  'display_name',
  'sort_name',
  'created_by_teacher',
  'archived',
  'created_at',
].join(', ');

function isClassCodeConflict(error) {
  return error?.code === '23505' && error.message?.includes('class_code');
}

export async function listTeacherClasses(teacherId) {
  const { data, error } = await supabase
    .from('classes')
    .select(CLASS_SELECT_FIELDS)
    .eq('teacher_id', teacherId)
    .eq('archived', false)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function createTeacherClass({
  teacherId,
  name,
  description,
  gradeLabel,
  preferredCode,
}) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error('Class name is required.');
  }

  let classCode = preferredCode || generateClassCode();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabase
      .from('classes')
      .insert({
        teacher_id: teacherId,
        name: trimmedName,
        description: description.trim(),
        grade_label: gradeLabel.trim(),
        class_code: classCode,
        allow_self_join: false,
      })
      .select(CLASS_SELECT_FIELDS)
      .single();

    if (!error) {
      return data;
    }

    if (!isClassCodeConflict(error)) {
      throw error;
    }

    classCode = generateClassCode();
  }

  throw new Error('Could not generate a unique class code. Please try again.');
}

export async function getTeacherClass({ teacherId, classId }) {
  const { data, error } = await supabase
    .from('classes')
    .select(CLASS_SELECT_FIELDS)
    .eq('teacher_id', teacherId)
    .eq('id', classId)
    .eq('archived', false)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function listClassStudents(classId) {
  const { data, error } = await supabase
    .from('students')
    .select(STUDENT_SELECT_FIELDS)
    .eq('class_id', classId)
    .eq('archived', false)
    .order('sort_name', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function addSingleStudent({
  classId,
  firstName,
  lastInitial,
}) {
  const student = buildStudentRecord({ firstName, lastInitial });
  const { data, error } = await supabase
    .from('students')
    .insert({
      class_id: classId,
      display_name: student.displayName,
      sort_name: student.sortName,
      created_by_teacher: true,
    })
    .select(STUDENT_SELECT_FIELDS)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function addBulkStudents({ classId, rawText }) {
  const students = parseBulkStudentText(rawText);

  if (!students.length) {
    throw new Error('Paste at least one student name.');
  }

  const { data, error } = await supabase
    .from('students')
    .insert(
      students.map((student) => ({
        class_id: classId,
        display_name: student.displayName,
        sort_name: student.sortName,
        created_by_teacher: true,
      }))
    )
    .select(STUDENT_SELECT_FIELDS);

  if (error) {
    throw error;
  }

  return data;
}
