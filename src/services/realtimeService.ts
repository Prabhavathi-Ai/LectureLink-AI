import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js'

export interface TranscriptEntry {
	id: string
	sessionId: string
	text: string
	timestamp: string
	isImportant: boolean
	createdAt: string
}

export type SessionStatus = 'active' | 'ended'
export type TranscriptListener = (entry: TranscriptEntry) => void

export const createTranscriptEntry = (
	sessionId: string,
	text: string,
	isImportant = false,
): TranscriptEntry => {
	const now = new Date().toISOString()
	return {
		id: crypto.randomUUID(),
		sessionId,
		text,
		timestamp: now,
		isImportant,
		createdAt: now,
	}
}

const createConfiguredClient = (): SupabaseClient => {
	const url = import.meta.env.VITE_SUPABASE_URL
	const key = import.meta.env.VITE_SUPABASE_ANON_KEY
	if (!url || !key) throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
	return createClient(url, key)
}

export class RealtimeTranscriptService {
	private channel: RealtimeChannel | null = null
	private client: SupabaseClient | null

	constructor(client?: SupabaseClient) {
		this.client = client ?? null
	}

	async sendTranscript(sessionId: string, entry: TranscriptEntry): Promise<void> {
		if (entry.sessionId !== sessionId) throw new Error('Transcript entry session does not match the channel session.')
		const wasConnected = Boolean(this.channel)
		const channel = this.getChannel(sessionId)
		if (!wasConnected) {
			await new Promise<void>((resolve, reject) => {
				channel.subscribe((status) => status === 'SUBSCRIBED' ? resolve() : reject(new Error(`Unable to subscribe to transcript channel: ${status}`)))
			})
		}
		const result = await channel.send({ type: 'broadcast', event: 'transcript', payload: entry })
		if (result !== 'ok') throw new Error(`Unable to send transcript: ${result}`)
	}

	async subscribeToTranscript(sessionId: string, callback: TranscriptListener): Promise<void> {
		this.unsubscribeFromTranscript()
		this.channel = this.getClient().channel(`lecture:${sessionId}`)
		this.channel.on('broadcast', { event: 'transcript' }, ({ payload }) => callback(payload as TranscriptEntry))
		await new Promise<void>((resolve, reject) => {
			this.channel?.subscribe((status) => status === 'SUBSCRIBED' ? resolve() : reject(new Error(`Unable to subscribe to transcript channel: ${status}`)))
		})
	}

	unsubscribeFromTranscript(): void {
		if (this.channel) void this.getClient().removeChannel(this.channel)
		this.channel = null
	}

	private getChannel(sessionId: string): RealtimeChannel {
		if (!this.channel) this.channel = this.getClient().channel(`lecture:${sessionId}`)
		return this.channel
	}

	private getClient(): SupabaseClient {
		this.client ??= createConfiguredClient()
		return this.client
	}
}

export const sendTranscript = (sessionId: string, entry: TranscriptEntry): Promise<void> =>
	new RealtimeTranscriptService().sendTranscript(sessionId, entry)

export const subscribeToTranscript = (sessionId: string, callback: TranscriptListener): Promise<void> =>
	new RealtimeTranscriptService().subscribeToTranscript(sessionId, callback)
