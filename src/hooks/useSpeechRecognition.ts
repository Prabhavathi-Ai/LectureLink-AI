import { useEffect, useRef, useState } from 'react'
import {
  isSpeechRecognitionSupported,
  SpeechRecognitionService,
  type SpeechServiceError,
} from '../services/speechService'

export interface SpeechRecognitionState {
  isListening: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  isSupported: boolean
  startListening: () => Promise<void>
  stopListening: () => void
  clearTranscript: () => void
}

export function useSpeechRecognition(): SpeechRecognitionState {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const serviceRef = useRef<SpeechRecognitionService | null>(null)
  const transcriptRef = useRef('')
  const lastFinalResultRef = useRef('')

  useEffect(() => {
    const service = new SpeechRecognitionService({
      onInterimTranscript: setInterimTranscript,
      onFinalTranscript: (text) => {
        const normalizedText = text.trim()
        if (!normalizedText || normalizedText === lastFinalResultRef.current) return

        lastFinalResultRef.current = normalizedText
        transcriptRef.current = `${transcriptRef.current}${transcriptRef.current ? '\n' : ''}${normalizedText}`
        setTranscript(transcriptRef.current)
        setInterimTranscript('')
      },
      onError: (serviceError: SpeechServiceError) => {
        setError(serviceError)
        setIsListening(false)
      },
      onListeningChange: setIsListening,
    })
    serviceRef.current = service
    return () => service.destroy()
  }, [])

  const startListening = async (): Promise<void> => {
    if (!isSpeechRecognitionSupported()) {
      setError('not-supported')
      setIsListening(false)
      return
    }

    setError(null)
    try {
      await serviceRef.current?.start()
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'unknown'
      setError(message)
      setIsListening(false)
    }
  }

  const stopListening = (): void => {
    serviceRef.current?.stop()
    setIsListening(false)
    setInterimTranscript('')
  }

  const clearTranscript = (): void => {
    transcriptRef.current = ''
    lastFinalResultRef.current = ''
    setTranscript('')
    setInterimTranscript('')
  }

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported: isSpeechRecognitionSupported(),
    startListening,
    stopListening,
    clearTranscript,
  }
}