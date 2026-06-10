import { supabase } from './supabaseClient'

export async function signUp(email: string, password: string) {
  // No email verification — auto-confirms the user immediately.
  // Requires "Confirm email" to be turned OFF in Supabase Auth settings.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  if (error) throw error
  if (!data.user) throw new Error('Sign up succeeded but no user returned.')
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error) throw error
  return session
}
