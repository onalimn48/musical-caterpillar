import { supabase } from '../teacher/supabaseClient.js';

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
    const response = error.context;

    if (response) {
      try {
        const payload = await response.json();

        if (payload?.error) {
          throw new Error(payload.error);
        }
      } catch (_jsonError) {
        try {
          const text = await response.text();

          if (text) {
            throw new Error(text);
          }
        } catch (_textError) {
          // Fall through to the generic error below.
        }
      }
    }

    throw new Error(error.message || 'Unable to look up class code.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.classroom) {
    throw new Error('Class not found.');
  }

  return data;
}
