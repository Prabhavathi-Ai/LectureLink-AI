export interface User {
	id: string;
	domainId: string;
	role: "faculty" | "student";
	createdAt: string;
}

export interface LectureSession {
	id: string;
	facultyId: string;
	title: string;
	subject: string;
	status: "active" | "ended";
	startedAt: string | null;
	endedAt: string | null;
	createdAt: string;
}

export interface TranscriptEntry {
	id: string;
	sessionId: string;
	text: string;
	timestamp: string;
	isImportant: boolean;
	createdAt: string;
}

export interface StructuredNote {
	heading: string;
	content: string[];
}

export interface KeyConcept {
	term: string;
	definition: string;
}

export interface GeneratedNotes {
	id: string;
	sessionId: string;
	summary: string;
	structuredNotes: StructuredNote[];
	importantPoints: string[];
	keyConcepts: KeyConcept[];
	teacherHighlights: string[];
	createdAt: string;
}

export interface ComparisonResult {
	coveredTopics: string[];
	partiallyCoveredTopics: string[];
	notCoveredTopics: string[];
	additionalLecturePoints: string[];
}
