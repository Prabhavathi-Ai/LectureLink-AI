import { getSupabaseClient } from '../lib/supabase'

export interface TranscriptRow {
  id: string
  session_id: string
  text: string
  timestamp: string
  is_final: boolean
  is_important: boolean
  created_at: string
}

export const detectImportantPoint = (text: string): boolean => {
  const normalized = text.toLowerCase()
  return /important|remember|exam|examination|key point|note this|pay attention/.test(normalized)
}

export const saveTranscriptEntry = async (
  sessionId: string,
  text: string,
  isFinal: boolean,
): Promise<TranscriptRow> => {
  const normalizedText = text.trim()
  if (!sessionId || !normalizedText) {
    throw new Error('A valid session ID and transcript text are required.')
  }

  const supabase = getSupabaseClient()
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  const debug = {
    hasSession: !!sessionData.session,
    sessionIdBeingInserted: sessionId,
    authenticatedUserId: sessionData.session?.user?.id ?? null,
    transcriptLength: normalizedText.length,
    errorCode: sessionError?.name ?? null,
    errorMessage: sessionError?.message ?? null,
  }
  console.log('TRANSCRIPT INSERT DEBUG:', debug)

  if (sessionError) throw new Error(sessionError.message)
  if (!sessionData.session) throw new Error('An authenticated Supabase session is required to save transcripts.')

  const { data: session, error: sessionLookupError } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .maybeSingle()

  if (sessionLookupError) {
    console.error('TRANSCRIPT SESSION LOOKUP ERROR:', {
      sessionId: 'present',
      errorCode: sessionLookupError.code ?? null,
      errorMessage: sessionLookupError.message,
    })
    throw new Error(sessionLookupError.message)
  }

  if (!session) {
    console.error('TRANSCRIPT SESSION MISSING:', {
      sessionId: 'present',
      transcriptLength: normalizedText.length,
    })
    throw new Error('The lecture session does not exist. Transcript was not saved.')
  }

  const { data, error } = await supabase
    .from('transcript_entries')
    .insert({
      session_id: sessionId,
      text: normalizedText,
      timestamp: new Date().toISOString(),
      is_final: isFinal,
      is_important: isFinal && detectImportantPoint(normalizedText),
    })
    .select()
    .single()

  if (error) {
    console.error('TRANSCRIPT INSERT ERROR:', {
      ...debug,
      errorCode: error.code ?? null,
      errorMessage: error.message,
    })
    throw new Error(error.message)
  }

  console.log('TRANSCRIPT INSERT RESULT:', {
    ...debug,
    inserted: !!data,
  })

  if (!data) {
    throw new Error('Transcript could not be saved.')
  }

  return data as TranscriptRow
}

export const getTranscriptEntries = async (sessionId: string): Promise<TranscriptRow[]> => {
  const supabase = getSupabaseClient()
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    throw new Error(sessionError.message)
  }

  if (!sessionData.session) {
    throw new Error('An authenticated Supabase session is required to read transcripts.')
  }

  const { data, error } = await supabase
    .from('transcript_entries')
    .select('*')
    .eq('session_id', sessionId)
    .eq('is_final', true)
    .order('timestamp', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as TranscriptRow[]
}
