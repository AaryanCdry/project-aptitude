import { createClient } from '@/lib/supabase/client';

export async function uploadQuestionImage(file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `questions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('question-images').upload(path, file);
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('question-images').getPublicUrl(path);
  return data.publicUrl;
}
