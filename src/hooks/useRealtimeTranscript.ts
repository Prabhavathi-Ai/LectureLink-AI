import { useEffect, useRef, useState } from 'react'
import {
  RealtimeTranscriptService,
  type SessionStatus,
  type TranscriptEntry,
} from '../services/realtimeService'

export interface RealtimeTranscriptState {
  entries: TranscriptEntry[]
  status: SessionStatus
  error: Error | null
  joinSession: (sessionId: string) => Promise<void>
  leaveSession: () => void
  sendTranscript: (entry: TranscriptEntry) => Promise<void>
}

export function useRealtimeTranscript(service = new RealtimeTranscriptService()): RealtimeTranscriptState {
  const [entries, setEntries] = useState<TranscriptEntry[]>([])
  const [status, setStatus] = useState<SessionStatus>('ended')
  const [error, setError] = useState<Error | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const serviceRef = useRef(service)

  useEffect(() => () => serviceRef.current.unsubscribeFromTranscript(), [])

  return {
    entries,
    status,
    error,
    joinSession: async (sessionId) => {
      try {
        setError(null)
        await serviceRef.current.subscribeToTranscript(sessionId, (entry) => setEntries((current) => [...current, entry]))
        sessionIdRef.current = sessionId
        setStatus('active')
      } catch (caught) {
        setError(caught instanceof Error ? caught : new Error('Unable to join transcript session.'))
        setStatus('ended')
      }
    },
    leaveSession: () => {
      serviceRef.current.unsubscribeFromTranscript()
      sessionIdRef.current = null
      setStatus('ended')
    },
    sendTranscript: async (entry) => {
      if (!sessionIdRef.current || status !== 'active') throw new Error('No active transcript session.')
      await serviceRef.current.sendTranscript(sessionIdRef.current, entry)
    },
  }
}