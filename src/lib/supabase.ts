import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface SupabaseConfig {
	url: string
	anonKey: string
}

export class SupabaseConfigError extends Error {
	constructor() {
		super('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
		this.name = 'SupabaseConfigError'
	}
}

export const getSupabaseConfig = (): SupabaseConfig => {
	const url = import.meta.env.VITE_SUPABASE_URL
	const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

	if (!url || !anonKey) throw new SupabaseConfigError()

	return { url, anonKey }
}

export const isSupabaseConfigured = (): boolean =>
	Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

let client: SupabaseClient | null = null

export const getSupabaseClient = (): SupabaseClient => {
	if (!client) {
		const config = getSupabaseConfig()
		client = createClient(config.url, config.anonKey)
	}
	return client
}

export const getSupabase = getSupabaseClient
