"use server";

import { createServerClientComponent } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type TestType = 'public-persona' | 'private-persona' | 'innate-persona';
type TestData = Record<string, number | string>; 

function getTargetTable(testType: TestType): string {
  switch (testType) {
    case 'public-persona': return 'public-persona';
    case 'private-persona': return 'private-persona';
    case 'innate-persona': return 'innate-persona';
    default: throw new Error(`Invalid test type: ${testType}`);
  }
}

export async function submitTestData(test_type: TestType, data: TestData) {
  const supabase = createServerClientComponent();
  
  // 1. Authenticate User
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return redirect('/login');

  let targetTable = getTargetTable(test_type);

  // 2. Fetch the most recent record to check the "1-month" window
  const { data: existingRecords } = await supabase
    .from(targetTable)
    .select('id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  const latestRecord = existingRecords?.[0];
  const dataToSave = { user_id: user.id, ...data };
  
  const ONE_MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;
  const nowUtc = new Date().getTime(); 
  
  let shouldOverwrite = false;
  
  if (latestRecord) {
    const lastSubmissionUtc = new Date(latestRecord.created_at).getTime();
    const timeDiff = nowUtc - lastSubmissionUtc;

    if (timeDiff < ONE_MONTH_IN_MS && timeDiff >= 0) {
      shouldOverwrite = true;
    }
  }

  let opError;

  if (shouldOverwrite && latestRecord) {
    const { error } = await supabase
      .from(targetTable)
      .update(dataToSave)
      .eq('id', latestRecord.id);
    opError = error;
  } else {
    const { error } = await supabase
      .from(targetTable)
      .insert([dataToSave]);
    opError = error;
  }

  if (opError) {
    console.error(`Database Error:`, opError);
    return { success: false, message: opError.message };
  }

  // --- UPDATED FLOW ---
  
  // Revalidate the new report path and the dashboard to ensure fresh data
  revalidatePath('/reports/public-persona');
  revalidatePath('/');

  // Return success instead of redirecting
  // This hands control back to the "use client" component handleSaveToServer function
  return { success: true };
}

export async function signOut() {
  const supabase = createServerClientComponent();
  await supabase.auth.signOut();
  revalidatePath('/');
  redirect('/login');
}