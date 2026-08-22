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
  error: SpeechServiceError | null
  isSupported: boolean
  startListening: () => Promise<void>
  stopListening: () => void
  getTranscript: () => string
}

export function useSpeechRecognition(): SpeechRecognitionState {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<SpeechServiceError | null>(null)
  const serviceRef = useRef<SpeechRecognitionService | null>(null)
  const transcriptRef = useRef('')

  useEffect(() => {
    const service = new SpeechRecognitionService({
      onInterimTranscript: setInterimTranscript,
      onFinalTranscript: (text) => {
        transcriptRef.current = `${transcriptRef.current}${transcriptRef.current ? ' ' : ''}${text}`
        setTranscript(transcriptRef.current)
        setInterimTranscript('')
      },
      onError: setError,
      onListeningChange: setIsListening,
    })
    serviceRef.current = service
    return () => service.destroy()
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported: isSpeechRecognitionSupported(),
    startListening: async () => {
      setError(null)
      await serviceRef.current?.start()
    },
    stopListening: () => serviceRef.current?.stop(),
    getTranscript: () => transcriptRef.current,
  }
}