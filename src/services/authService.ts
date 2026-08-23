import { getSupabaseClient } from '../lib/supabase'

export interface AuthenticatedUser {
  id: string
  email: string | null
}

export const signIn = async (email: string, password: string): Promise<AuthenticatedUser> => {
  const supabase = getSupabaseClient()
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!signInData.session) {
    throw new Error('Authentication succeeded without an active Supabase session.')
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    throw new Error(sessionError.message)
  }

  const user = sessionData.session?.user
  if (!user) {
    throw new Error('Authentication succeeded without an active Supabase session.')
  }

  return { id: user.id, email: user.email ?? null }
}

export const signOut = async (): Promise<void> => {
  const { error } = await getSupabaseClient().auth.signOut()
  if (error) {
    throw new Error(error.message)
  }
}
