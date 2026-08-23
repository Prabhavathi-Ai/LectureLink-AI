import { useEffect, useState, useRef, type FormEvent, type ReactNode } from "react";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { signIn, signOut, type AuthenticatedUser } from "./services/authService";
import { getSupabaseClient } from "./lib/supabase";
import { createSession, endSession, getActiveSessions, getEndedSessions, getSessionById, type LectureSessionRecord } from "./services/sessionService";
import { getTranscriptEntries, saveTranscriptEntry, type TranscriptRow } from "./services/transcriptService";
import "./App.css";

type Page = "login" | "faculty" | "student" | "live" | "notes";
type Role = "faculty" | "student";

interface Lecture {
  title: string;
  subject: string;
  faculty: string;
  sessionId: string;
}

const emptyLecture: Lecture = {
  title: "",
  subject: "",
  faculty: "",
  sessionId: "",
};

const getTimestampLabel = () =>
  new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [role, setRole] = useState<Role | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthenticatedUser | null>(null);
  const [lecture, setLecture] = useState<Lecture>(emptyLecture);
  const logout = async () => {
    try {
      await signOut();
    } finally {
      setAuthenticatedUser(null);
      setRole(null);
      setCurrentPage("login");
    }
  };
  const openLiveSession = (nextLecture: Lecture = lecture) => {
    setLecture(nextLecture);
    setCurrentPage("live");
  };
  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          type="button"
          onClick={() => role && setCurrentPage(role)}
        >
          <span className="brand-mark">L</span>
          <span>
            LectureLink<span className="brand-accent">-AI</span>
          </span>
        </button>
        {role && (
          <div className="topbar-actions">
            <span className="role-chip">
              {role === "faculty" ? "Faculty" : "Student"}
            </span>
            <button className="text-button" type="button" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </header>
      <main className="page-content">
        {currentPage === "login" && (
          <LoginPage
            onLogin={(selectedRole, user) => {
              setAuthenticatedUser(user);
              setRole(selectedRole);
              setCurrentPage(selectedRole);
            }}
          />
        )}
        {currentPage === "faculty" && (
          <FacultyDashboard lecture={lecture} facultyId={authenticatedUser?.id} onStart={openLiveSession} />
        )}
        {currentPage === "student" && (
          <StudentDashboard
            onJoin={(session) => {
              setLecture({
                title: session.title,
                subject: session.subject,
                faculty: session.faculty_id,
                sessionId: session.id,
              });
              setCurrentPage("live");
            }}
            onViewNotes={(session) => {
              setLecture({
                title: session.title,
                subject: session.subject,
                faculty: session.faculty_id,
                sessionId: session.id,
              });
              setCurrentPage("notes");
            }}
          />
        )}
        {currentPage === "live" && (
          <LiveSessionPage
            lecture={lecture}
            role={role ?? "student"}
            onBack={() => setCurrentPage(role ?? "login")}
            onNotes={() => setCurrentPage("notes")}
            onEnd={() => setCurrentPage("notes")}
          />
        )}
        {currentPage === "notes" && (
          <NotesPage lecture={lecture} onBack={() => setCurrentPage("live")} />
        )}
      </main>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (role: Role, user: AuthenticatedUser) => void }) {
  const [domainId, setDomainId] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!domainId.trim() || !password.trim() || !selectedRole) {
      setError(
        "Enter your Domain ID, password, and select a role to continue.",
      );
      return;
    }
    setError("");
    setLoading(true);
    try {
      const user = await signIn(domainId, password);
      setLoading(false);
      onLogin(selectedRole, user);
    } catch (caughtError) {
      setLoading(false);
      setError(caughtError instanceof Error ? caughtError.message : "Unable to sign in.");
    }
  };
  return (
    <section className="login-layout">
      <div className="login-intro">
        <p className="eyebrow">THE CLASSROOM, CONNECTED</p>
        <h1>
          Never miss what matters <em>in a lecture.</em>
        </h1>
        <p className="intro-copy">
          Live transcripts, thoughtful notes, and a clearer way to learn
          together.
        </p>
        <div className="signal-art" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <form className="login-card" onSubmit={submit}>
        <div className="card-heading">
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to your classroom</h2>
        </div>
        <label>
          Domain ID
          <input
            value={domainId}
            onChange={(event) => setDomainId(event.target.value)}
            placeholder="you@university.edu"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
          />
        </label>
        <fieldset>
          <legend>I am signing in as</legend>
          <div className="role-options">
            <RoleButton
              role="faculty"
              selectedRole={selectedRole}
              onSelect={setSelectedRole}
              icon="F"
              label="Faculty"
            />
            <RoleButton
              role="student"
              selectedRole={selectedRole}
              onSelect={setSelectedRole}
              icon="S"
              label="Student"
            />
          </div>
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="primary-button full-width"
          type="submit"
          disabled={loading}
        >
          {loading ? "Opening classroom..." : "Continue"}{" "}
          <span aria-hidden="true">→</span>
        </button>
        <p className="secure-note">
          <span aria-hidden="true">◇</span> Secure access for your learning
          community
        </p>
      </form>
    </section>
  );
}
function RoleButton({
  role,
  selectedRole,
  onSelect,
  icon,
  label,
}: {
  role: Role;
  selectedRole: Role | null;
  onSelect: (role: Role) => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      className={`role-option ${selectedRole === role ? "selected" : ""}`}
      type="button"
      onClick={() => onSelect(role)}
    >
      <span className="role-icon">{icon}</span>
      <span>{label}</span>
      {selectedRole === role && <span className="checkmark">✓</span>}
    </button>
  );
}
function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function FacultyDashboard({
  lecture,
  facultyId,
  onStart,
}: {
  lecture: Lecture;
  facultyId?: string;
  onStart: (lecture: Lecture) => void;
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const start = async () => {
    if (!title.trim()) {
      setError("Add a lecture title before starting.");
      return;
    }

    setError("");
    setIsStarting(true);

    try {
      if (!facultyId) {
        throw new Error("Your authenticated faculty session is missing. Please sign in again.");
      }
      const session = await createSession(title.trim(), subject.trim() || "General Lecture", facultyId);
      console.log("SESSION CREATED:", {
        returnedSessionId: session.id,
        storedSessionId: session.id,
      });
      onStart({
        ...lecture,
        title: title.trim(),
        subject: subject.trim() || "General Lecture",
        faculty: lecture.faculty || "Faculty",
        sessionId: session.id,
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create the lecture session.");
    } finally {
      setIsStarting(false);
    }
  };
  return (
    <section className="dashboard-page">
      <PageHeader
        eyebrow="FACULTY DASHBOARD"
        title="Shape the room around learning."
        description="Start a live session and let every student follow along."
      />
      <div className="dashboard-grid">
        <div className="panel create-panel">
          <div className="panel-icon orange">＋</div>
          <h2>Start a new lecture</h2>
          <p>Share your words in real time with everyone in the room.</p>
          <label>
            Lecture title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter the lecture title"
            />
          </label>
          <label>
            Subject <span className="optional">Optional</span>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. Mathematics"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="button" onClick={() => void start()} disabled={isStarting}>
            {isStarting ? "Starting lecture..." : "Start live lecture"} <span>↗</span>
          </button>
        </div>
        <div className="panel status-panel">
          <div className="panel-topline">
            <p className="eyebrow">SESSION STATUS</p>
            <span className="status-dot live-dot">LIVE</span>
          </div>
          <h2>Ready when you are.</h2>
          <p>Your next lecture will appear here once you start broadcasting.</p>
          <div className="empty-wave">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR LIBRARY</p>
          <h2>Recent lectures</h2>
        </div>
        <button className="text-button" type="button">
          View all →
        </button>
      </div>
      <div className="recent-list">
        <div className="recent-item">
          <span className="date-badge">
            14
            <br />
            <small>MAR</small>
          </span>
          <div>
            <strong>{lecture.title}</strong>
            <p>{lecture.subject || "Mathematics"} · 42 minutes</p>
          </div>
          <span className="muted">Notes ready</span>
          <span className="arrow">→</span>
        </div>
      </div>
    </section>
  );
}

function StudentDashboard({
  onJoin,
  onViewNotes,
}: {
  onJoin: (session: LectureSessionRecord) => void;
  onViewNotes: (session: LectureSessionRecord) => void;
}) {
  const [activeSessions, setActiveSessions] = useState<LectureSessionRecord[]>([]);
  const [endedSessions, setEndedSessions] = useState<LectureSessionRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    const loadSessions = async () => {
      try {
        const [active, ended] = await Promise.all([getActiveSessions(), getEndedSessions()]);
        if (!isCancelled) {
          setActiveSessions(active);
          setEndedSessions(ended);
        }
      } catch (caughtError) {
        if (!isCancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load lectures.");
        }
      }
    };

    void loadSessions();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <section className="dashboard-page">
      <PageHeader
        eyebrow="STUDENT DASHBOARD"
        title="Student classroom"
        description="Join active lectures and revisit completed sessions."
      />
      <div className="section-heading active-heading">
        <div>
          <p className="eyebrow coral-text">HAPPENING NOW</p>
          <h2>Active live lectures</h2>
        </div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {activeSessions.length > 0 ? activeSessions.map((session) => (
        <div className="lecture-card" key={session.id}>
          <div className="lecture-card-main">
            <div className="live-banner">
              <span className="status-dot live-dot">ACTIVE</span>
              <span>Session {session.id}</span>
            </div>
            <h2>{session.title}</h2>
            <p>{session.subject} <span>·</span> Faculty {session.faculty_id}</p>
          </div>
          <button className="primary-button" type="button" onClick={() => onJoin(session)}>
            Join lecture <span>→</span>
          </button>
        </div>
      )) : (
        <div className="lecture-card">
          <div className="lecture-card-main">
            <h2>No active lecture</h2>
            <p>There are currently no live sessions available.</p>
          </div>
        </div>
      )}
      <div className="section-heading notes-heading">
        <div>
          <p className="eyebrow">YOUR LIBRARY</p>
          <h2>Previous notes</h2>
        </div>
      </div>
      <div className="recent-list">
        {endedSessions.length > 0 ? endedSessions.map((session) => (
          <div className="recent-item" key={session.id}>
            <span className="date-badge blue">✓</span>
            <div>
              <strong>{session.title}</strong>
              <p>{session.subject} · {session.id}</p>
            </div>
            <span className="muted">Completed</span>
            <button className="text-button" type="button" onClick={() => onViewNotes(session)}>View notes →</button>
          </div>
        )) : (
          <div className="recent-item">
            <div><strong>No previous lectures</strong><p>Completed sessions will appear here.</p></div>
          </div>
        )}
      </div>
    </section>
  );
}

function LiveSessionPage({
  lecture,
  role,
  onBack,
  onNotes,
  onEnd,
}: {
  lecture: Lecture;
  role: Role;
  onBack: () => void;
  onNotes: () => void;
  onEnd: () => void;
}) {
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [studentTranscript, setStudentTranscript] = useState<TranscriptRow[]>([]);
  const [isEnded, setIsEnded] = useState(false);
  const speech = useSpeechRecognition();
  const savedFinalLinesRef = useRef<Set<string>>(new Set());
  const pendingTranscriptWritesRef = useRef<Map<string, Promise<void>>>(new Map());

  const persistFinalLine = (line: string) => {
    if (!lecture.sessionId || savedFinalLinesRef.current.has(line)) return Promise.resolve();

    const pendingWrite = pendingTranscriptWritesRef.current.get(line);
    if (pendingWrite) return pendingWrite;

    const write = saveTranscriptEntry(lecture.sessionId, line, true)
      .then(() => {
        savedFinalLinesRef.current.add(line);
      })
      .finally(() => {
        pendingTranscriptWritesRef.current.delete(line);
      });

    pendingTranscriptWritesRef.current.set(line, write);
    return write;
  };

  const saveFinalTranscriptLines = async () => {
    if (!lecture.sessionId || role !== "faculty") return;

    const lines = speech.transcript
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    console.log("END LECTURE FLUSH:", {
      sessionId: lecture.sessionId ? "present" : "absent",
      transcriptLines: lines.length,
    });

    await Promise.all(lines.map((line) => persistFinalLine(line)));
  };

  const spokenEntries = speech.transcript
    .split("\n")
    .filter(Boolean)
    .map((text: string, index: number) => ({
      time: getTimestampLabel(),
      text,
      important: /note this|important|very important|remember this|exam point|key point|examination|exam/i.test(text),
      key: `spoken-${index}-${text}`,
    }));
  const displayedTranscript = role === "faculty"
    ? spokenEntries
    : studentTranscript.map((entry) => ({
      time: new Date(entry.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      text: entry.text,
      important: entry.is_important,
      key: entry.id,
    }));

  useEffect(() => {
    if (!lecture.sessionId || role !== "student") return;

    let isCancelled = false;
    const supabase = getSupabaseClient();
    const channel = supabase.channel(`student-session:${lecture.sessionId}`);

    const loadStudentSession = async () => {
      try {
        const [entries, session] = await Promise.all([
          getTranscriptEntries(lecture.sessionId),
          getSessionById(lecture.sessionId),
        ]);
        if (isCancelled) return;

        setStudentTranscript((current) => {
          const merged = new Map(current.map((entry) => [entry.id, entry]));
          entries.forEach((entry) => merged.set(entry.id, entry));
          return [...merged.values()].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
        });
        setIsEnded(session?.status === "ended");
      } catch (caughtError) {
        if (!isCancelled) {
          setSessionError(caughtError instanceof Error ? caughtError.message : "Unable to load the lecture transcript.");
        }
      }
    };

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transcript_entries",
          filter: `session_id=eq.${lecture.sessionId}`,
        },
        (payload) => {
          const entry = payload.new as TranscriptRow;
          if (entry.is_final) {
            setStudentTranscript((current) => current.some((item) => item.id === entry.id) ? current : [...current, entry]);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${lecture.sessionId}`,
        },
        (payload) => {
          const session = payload.new as LectureSessionRecord;
          if (session.status === "ended") setIsEnded(true);
        },
      );

    void loadStudentSession();
    void channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR" && !isCancelled) {
        setSessionError("Unable to subscribe to live transcript updates.");
      }
    });

    return () => {
      isCancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [lecture.sessionId, role]);

  useEffect(() => {
    if (!lecture.sessionId || role !== "faculty") return;

    const lines = speech.transcript
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    let isCancelled = false;

    const persistSessionLines = async () => {
      for (const line of lines) {
        try {
          await persistFinalLine(line);
        } catch (caughtError) {
          if (isCancelled) return;
          const message = caughtError instanceof Error ? caughtError.message : "Unable to save transcript.";
          setSessionError(message);
        }
      }
    };

    void persistSessionLines();

    return () => {
      isCancelled = true;
    };
  }, [lecture.sessionId, role, speech.transcript]);

  const handleEndLecture = async () => {
    if (!lecture.sessionId) {
      onEnd();
      return;
    }

    try {
      speech.stopListening();
      await saveFinalTranscriptLines();
      await endSession(lecture.sessionId);
      onEnd();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to end the lecture.";
      setSessionError(message);
    }
  };
  return (
    <section className="session-page">
      <button className="back-button" type="button" onClick={onBack}>
        ← <span>Back to dashboard</span>
      </button>
      <div className="session-heading">
        <div>
          <div className="session-kicker">
            <span className={`status-dot ${isEnded ? "ended-dot" : "live-dot"}`}>{isEnded ? "ENDED" : "LIVE"}</span>
            <span>Session {lecture.sessionId}</span>
          </div>
          <h1>{lecture.title}</h1>
          <p>
            {lecture.subject} <span>·</span> Hosted by {lecture.faculty}
          </p>
        </div>
        <div className="session-actions">
          {role === "faculty" && (
            <button className="danger-button" type="button" onClick={() => void handleEndLecture()}>
              End lecture
            </button>
          )}
          <button className="secondary-button" type="button" onClick={onNotes}>
            View generated notes <span>→</span>
          </button>
        </div>
      </div>
      <div className="transcript-layout">
        <div className="transcript-panel panel">
          <div className="transcript-header">
            <div>
              <p className="eyebrow">LIVE TRANSCRIPT</p>
              <h2>Follow along</h2>
            </div>
            <span className="sync-label"><i /> {isEnded ? "Lecture ended" : "Syncing live"}</span>
          </div>
          {role === "faculty" && (
            <div className="speech-controls">
              <div className={`microphone-status ${speech.isListening ? "listening" : ""}`}>
                <i /> {speech.isListening ? "Microphone listening" : "Microphone ready"}
              </div>
              <button className="primary-button" type="button" onClick={() => void speech.startListening()} disabled={speech.isListening || !speech.isSupported}>
                {speech.isListening ? "Listening..." : "Start listening"}
              </button>
              <button className="secondary-button" type="button" onClick={speech.stopListening} disabled={!speech.isListening}>Stop listening</button>
            </div>
          )}
          {role === "faculty" && !speech.isSupported && <p className="speech-error">Speech recognition is not supported in this browser.</p>}
          {role === "faculty" && speech.error && <p className="speech-error" role="alert">Speech recognition error: {speech.error}</p>}
          {sessionError && <p className="speech-error" role="alert">{sessionError}</p>}
          <div className="transcript-list">
            {displayedTranscript.length > 0 ? (
              displayedTranscript.map((entry) => (
                <div
                  className={`transcript-entry ${entry.important ? "important-entry" : ""}`}
                  key={String(entry.key)}
                >
                  <time>{entry.time}</time>
                  <p>
                    {entry.important && (
                      <span className="important-label">IMPORTANT</span>
                    )}
                    {entry.text}
                  </p>
                </div>
              ))
            ) : (
              <div className="transcript-entry">
                <p>No transcript available for this lecture yet.</p>
              </div>
            )}
          </div>
          <div className={`interim ${isSpeaking && (!speech.interimTranscript || role !== "faculty") ? "" : "paused"}`}>
            <span className="sound-bars">
              <i />
              <i />
              <i />
            </span>
            <span>
              {role === "faculty" && speech.interimTranscript ? speech.interimTranscript : isSpeaking ? "Faculty is speaking..." : "Live capture paused"}
            </span>
            <button type="button" onClick={() => setIsSpeaking(!isSpeaking)}>
              {isSpeaking ? "Pause preview" : "Resume preview"}
            </button>
          </div>
        </div>
        <aside className="session-side">
          <div className="panel session-info">
            <p className="eyebrow">SESSION DETAILS</p>
            <div className="detail">
              <span>Language</span>
              <strong>English (US)</strong>
            </div>
          </div>
          <div className="tip-card">
            <span className="tip-icon">✦</span>
            <div>
              <strong>LectureLink tip</strong>
              <p>
                Important phrases are highlighted automatically for easier
                review.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function NotesPage({
  lecture,
  onBack,
}: {
  lecture: Lecture;
  onBack: () => void;
}) {
  return (
    <section className="notes-page">
      <button className="back-button" type="button" onClick={onBack}>
        ← <span>Back to live session</span>
      </button>
      <div className="notes-title-row">
        <div>
          <p className="eyebrow">
            GENERATED NOTES · {lecture.subject.toUpperCase()}
          </p>
          <h1>{lecture.title}</h1>
          <p className="page-description">
            A study guide from your live lecture.
          </p>
        </div>
        <div className="export-actions">
          <button className="secondary-button" type="button">
            ↓ Export TXT
          </button>
          <button className="primary-button" type="button">
            ↓ Export PDF
          </button>
        </div>
      </div>
      <div className="notes-grid">
        <article className="notes-main">
          <NoteSection title="Lecture summary">
            <p>No transcript available for this lecture yet.</p>
          </NoteSection>
          <NoteSection title="Structured notes">
            <p>Generated notes will appear here once a live session transcript is saved and processed.</p>
          </NoteSection>
          <NoteSection title="Important points">
            <p>Important lecture points will appear here after transcript processing.</p>
          </NoteSection>
        </article>
        <aside className="notes-sidebar">
          <div className="notes-side-section">
            <p className="eyebrow">KEY CONCEPTS</p>
            <p>No concepts available yet.</p>
          </div>
          <div className="notes-side-section">
            <p className="eyebrow">TEACHER HIGHLIGHTS</p>
            <p>No highlights available yet.</p>
          </div>
        </aside>
      </div>
      <div className="comparison-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LECTURE + READING</p>
            <h2>PDF comparison</h2>
          </div>
        </div>
        <p>PDF comparison will be available when lecture material is uploaded.</p>
      </div>
    </section>
  );
}
function NoteSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="note-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
export default App;
