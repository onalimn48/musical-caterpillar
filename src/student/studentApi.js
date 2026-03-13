import { supabase } from '../teacher/supabaseClient.js';

async function extractFunctionError(error) {
  const response = error?.context;

  if (!response) {
    return error?.message || 'Unable to look up class code.';
  }

  try {
    const payload = await response.clone().json();

    if (payload?.error) {
      return payload.error;
    }
  } catch (_jsonError) {
    // Fall through to text parsing.
  }

  try {
    const text = await response.text();

    if (text) {
      return text;
    }
  } catch (_textError) {
    // Fall through to the generic fallback below.
  }

  return error?.message || 'Unable to look up class code.';
}

export async function lookupClassByCode(classCode) {
  const normalizedCode = classCode.trim().toUpperCase();

  if (!normalizedCode) {
    throw new Error('Enter a class code.');
  }

  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.functions.invoke('lookup-class-by-code', {
    body: {
      classCode: normalizedCode,
    },
  });

  if (error) {
    throw new Error(await extractFunctionError(error));
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.classroom) {
    throw new Error('Class not found.');
  }

  return data;
}
