export type SpeechServiceError =
	| 'not-supported'
	| 'permission-denied'
	| 'audio-capture'
	| 'network'
	| 'aborted'
	| 'no-speech'
	| 'unknown'

export interface SpeechServiceCallbacks {
	onInterimTranscript?: (text: string) => void
	onFinalTranscript?: (text: string) => void
	onError?: (error: SpeechServiceError) => void
	onListeningChange?: (isListening: boolean) => void
}

interface SpeechRecognitionEventLike extends Event {
	results: SpeechRecognitionResultListLike
}

interface SpeechRecognitionResultListLike {
	length: number
	[index: number]: SpeechRecognitionResultLike
}

interface SpeechRecognitionResultLike {
	isFinal: boolean
	length: number
	[index: number]: { transcript: string }
}

interface SpeechRecognitionLike {
	continuous: boolean
	interimResults: boolean
	lang: string
	onend: (() => void) | null
	onerror: ((event: { error: string }) => void) | null
	onresult: ((event: SpeechRecognitionEventLike) => void) | null
	start: () => void
	stop: () => void
	abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

const getRecognitionConstructor = (): SpeechRecognitionConstructor | undefined => {
	const browserWindow = window as typeof window & {
		SpeechRecognition?: SpeechRecognitionConstructor
		webkitSpeechRecognition?: SpeechRecognitionConstructor
	}

	return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition
}

export const isSpeechRecognitionSupported = (): boolean =>
	typeof window !== 'undefined' && Boolean(getRecognitionConstructor())

export const requestMicrophonePermission = async (): Promise<MediaStream> => {
	if (!navigator.mediaDevices?.getUserMedia) {
		throw new Error('Microphone access is not supported by this browser.')
	}

	try {
		return await navigator.mediaDevices.getUserMedia({ audio: true })
	} catch (error) {
		if (error instanceof DOMException && error.name === 'NotAllowedError') {
			throw new Error('Microphone permission was denied.')
		}
		throw error
	}
}

export class SpeechRecognitionService {
	private recognition: SpeechRecognitionLike | null = null
	private microphoneStream: MediaStream | null = null
	private shouldRestart = false
	private isStarting = false
	private readonly callbacks: SpeechServiceCallbacks

	constructor(callbacks: SpeechServiceCallbacks = {}) {
		this.callbacks = callbacks
	}

	get isSupported(): boolean {
		return isSpeechRecognitionSupported()
	}

	async start(): Promise<void> {
		if (!this.isSupported || this.isStarting) {
			if (!this.isSupported) this.callbacks.onError?.('not-supported')
			return
		}

		this.isStarting = true
		this.shouldRestart = true
		try {
			this.microphoneStream = await requestMicrophonePermission()
			this.createRecognition()
			this.recognition?.start()
			this.callbacks.onListeningChange?.(true)
		} catch (error) {
			this.shouldRestart = false
			this.microphoneStream?.getTracks().forEach((track) => track.stop())
			this.microphoneStream = null
			if (error instanceof Error && error.message.includes('permission')) {
				this.callbacks.onError?.('permission-denied')
			} else {
				this.callbacks.onError?.('unknown')
			}
			if (!(error instanceof DOMException && error.name === 'InvalidStateError')) throw error
		} finally {
			this.isStarting = false
		}
	}

	stop(): void {
		this.shouldRestart = false
		this.isStarting = false
		this.recognition?.stop()
		this.microphoneStream?.getTracks().forEach((track) => track.stop())
		this.microphoneStream = null
		this.callbacks.onListeningChange?.(false)
	}

	destroy(): void {
		this.stop()
		this.recognition?.abort()
		this.recognition = null
	}

	private createRecognition(): void {
		const Recognition = getRecognitionConstructor()
		if (!Recognition) return

		this.recognition = new Recognition()
		this.recognition.continuous = true
		this.recognition.interimResults = true
		this.recognition.lang = 'en-US'
		this.recognition.onresult = (event) => {
			let interim = ''
			let finalText = ''

			for (let index = 0; index < event.results.length; index += 1) {
				const result = event.results[index]
				if (result.isFinal) finalText += result[0].transcript
				else interim += result[0].transcript
			}

			if (interim.trim()) this.callbacks.onInterimTranscript?.(interim.trim())
			if (finalText.trim()) this.callbacks.onFinalTranscript?.(finalText.trim())
		}
		this.recognition.onerror = (event) => {
			const error = event.error === 'not-allowed' ? 'permission-denied' : event.error as SpeechServiceError
			this.callbacks.onError?.(error in errorMap ? error : 'unknown')
		}
		this.recognition.onend = () => {
			this.callbacks.onListeningChange?.(false)
			if (this.shouldRestart) {
				window.setTimeout(() => {
					if (!this.shouldRestart || this.isStarting) return
					try {
						this.recognition?.start()
						this.callbacks.onListeningChange?.(true)
					} catch {
						this.callbacks.onError?.('unknown')
					}
				}, 150)
			}
		}
	}
}

const errorMap: Record<SpeechServiceError, true> = {
	'not-supported': true,
	'permission-denied': true,
	'audio-capture': true,
	network: true,
	aborted: true,
	'no-speech': true,
	unknown: true,
}
