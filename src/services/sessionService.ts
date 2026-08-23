import { getSupabaseClient } from '../lib/supabase'

export interface LectureSessionRecord {
  id: string
  faculty_id: string
  title: string
  subject: string
  status: 'active' | 'ended'
  started_at: string
  ended_at: string | null
  created_at: string
  updated_at: string
}

export const createSession = async (
  title: string,
  subject: string,
  facultyId: string = crypto.randomUUID(),
): Promise<LectureSessionRecord> => {
  const supabase = getSupabaseClient()
  const { data: { session }, error: authError } = await supabase.auth.getSession()

  console.log('AUTH DEBUG:', {
    hasSession: !!session,
    userId: session?.user?.id,
    email: session?.user?.email,
    error: authError,
  })

  if (authError) {
    throw new Error(authError.message)
  }

  if (!session) {
    throw new Error('No authenticated Supabase session is available for session creation.')
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      faculty_id: facultyId,
      title: title.trim(),
      subject: subject.trim() || 'General Lecture',
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Unable to create a session.')
  }

  if (!data.id || data.faculty_id !== facultyId) {
    throw new Error('Session creation returned an invalid session record.')
  }

  return data as LectureSessionRecord
}

export const getActiveSessions = async (): Promise<LectureSessionRecord[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('status', 'active')
    .order('started_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as LectureSessionRecord[]
}

export const getEndedSessions = async (): Promise<LectureSessionRecord[]> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('status', 'ended')
    .order('ended_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as LectureSessionRecord[]
}

export const getSessionById = async (sessionId: string): Promise<LectureSessionRecord | null> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data as LectureSessionRecord | null) ?? null
}

export const endSession = async (sessionId: string): Promise<LectureSessionRecord> => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('sessions')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Session not found.')
  }

  return data as LectureSessionRecord
}
