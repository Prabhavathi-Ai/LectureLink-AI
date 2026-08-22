import { useState, type FormEvent, type ReactNode } from "react";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import "./App.css";

type Page = "login" | "faculty" | "student" | "live" | "notes";
type Role = "faculty" | "student";

interface Lecture {
  title: string;
  subject: string;
  faculty: string;
  sessionId: string;
}
interface TranscriptEntry {
  time: string;
  text: string;
  important?: boolean;
}

const activeLecture: Lecture = {
  title: "Differential Calculus",
  subject: "Mathematics",
  faculty: "Dr. Priya Sharma",
  sessionId: "LL-2048",
};
const transcript: TranscriptEntry[] = [
  { time: "10:30 AM", text: "Today we will discuss derivatives." },
  { time: "10:31 AM", text: "A derivative represents the rate of change." },
  {
    time: "10:32 AM",
    text: "Note this carefully: the power rule is fundamental.",
    important: true,
  },
  {
    time: "10:33 AM",
    text: "Remember this formula for your examination.",
    important: true,
  },
];

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [role, setRole] = useState<Role | null>(null);
  const [lecture, setLecture] = useState<Lecture>(activeLecture);
  const logout = () => {
    setRole(null);
    setCurrentPage("login");
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
            onLogin={(selectedRole) => {
              setRole(selectedRole);
              setCurrentPage(selectedRole);
            }}
          />
        )}
        {currentPage === "faculty" && (
          <FacultyDashboard lecture={lecture} onStart={openLiveSession} />
        )}
        {currentPage === "student" && (
          <StudentDashboard onJoin={() => openLiveSession(activeLecture)} />
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

function LoginPage({ onLogin }: { onLogin: (role: Role) => void }) {
  const [domainId, setDomainId] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!domainId.trim() || !password.trim() || !selectedRole) {
      setError(
        "Enter your Domain ID, password, and select a role to continue.",
      );
      return;
    }
    setError("");
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      onLogin(selectedRole);
    }, 400);
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
  onStart,
}: {
  lecture: Lecture;
  onStart: (lecture: Lecture) => void;
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [error, setError] = useState("");
  const start = () => {
    if (!title.trim()) {
      setError("Add a lecture title before starting.");
      return;
    }
    onStart({
      ...lecture,
      title: title.trim(),
      subject: subject.trim() || "General Lecture",
      sessionId: `LL-${Math.floor(1000 + Math.random() * 9000)}`,
    });
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
              placeholder="e.g. Introduction to derivatives"
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
          <button className="primary-button" type="button" onClick={start}>
            Start live lecture <span>↗</span>
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

function StudentDashboard({ onJoin }: { onJoin: () => void }) {
  return (
    <section className="dashboard-page">
      <PageHeader
        eyebrow="STUDENT DASHBOARD"
        title="Good morning, Alex."
        description="Pick up where you left off or join a lecture in progress."
      />
      <div className="section-heading active-heading">
        <div>
          <p className="eyebrow coral-text">HAPPENING NOW</p>
          <h2>Active live lectures</h2>
        </div>
        <span className="live-count">
          <i /> 1 session live
        </span>
      </div>
      <div className="lecture-card">
        <div className="lecture-card-main">
          <div className="live-banner">
            <span className="status-dot live-dot">LIVE NOW</span>
            <span>Started 18 min ago</span>
          </div>
          <h2>{activeLecture.title}</h2>
          <p>
            {activeLecture.subject} <span>·</span> {activeLecture.faculty}
          </p>
          <div className="attendee-row">
            <div className="avatars">
              <span>J</span>
              <span>M</span>
              <span>R</span>
              <b>+24</b>
            </div>
            <span>25 students learning together</span>
          </div>
        </div>
        <button className="primary-button" type="button" onClick={onJoin}>
          Join session <span>→</span>
        </button>
      </div>
      <div className="section-heading notes-heading">
        <div>
          <p className="eyebrow">YOUR LIBRARY</p>
          <h2>Previous notes</h2>
        </div>
        <button className="text-button" type="button">
          View all →
        </button>
      </div>
      <div className="recent-list">
        <div className="recent-item">
          <span className="date-badge blue">
            12
            <br />
            <small>MAR</small>
          </span>
          <div>
            <strong>Limits and Continuity</strong>
            <p>Mathematics · 38 minutes</p>
          </div>
          <span className="muted">Viewed yesterday</span>
          <span className="arrow">→</span>
        </div>
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
  const speech = useSpeechRecognition();
  const spokenEntries = speech.transcript
    .split("\n")
    .filter(Boolean)
    .map((text: string, index: number) => ({
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      text,
      important: /note this|important|very important|remember this|exam point|key point/i.test(text),
      key: `spoken-${index}-${text}`,
    }));
  const displayedTranscript = role === "faculty"
    ? [...transcript, ...spokenEntries]
    : transcript;
  return (
    <section className="session-page">
      <button className="back-button" type="button" onClick={onBack}>
        ← <span>Back to dashboard</span>
      </button>
      <div className="session-heading">
        <div>
          <div className="session-kicker">
            <span className="status-dot live-dot">LIVE</span>
            <span>Session {lecture.sessionId}</span>
          </div>
          <h1>{lecture.title}</h1>
          <p>
            {lecture.subject} <span>·</span> Hosted by {lecture.faculty}
          </p>
        </div>
        <div className="session-actions">
          {role === "faculty" && (
            <button className="danger-button" type="button" onClick={onEnd}>
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
            <span className="sync-label">
              <i /> Syncing live
            </span>
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
          <div className="transcript-list">
            {displayedTranscript.map((entry) => (
              <div
                className={`transcript-entry ${entry.important ? "important-entry" : ""}`}
                key={"key" in entry ? String(entry.key) : entry.time}
              >
                <time>{entry.time}</time>
                <p>
                  {entry.important && (
                    <span className="important-label">IMPORTANT</span>
                  )}
                  {entry.text}
                </p>
              </div>
            ))}
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
              <span>Duration</span>
              <strong>00:18:42</strong>
            </div>
            <div className="detail">
              <span>Students</span>
              <strong>25 connected</strong>
            </div>
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
            A clear study guide from your live lecture · 18 min lecture
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
            <p>
              Today’s lecture introduced derivatives as a measure of
              instantaneous rate of change. We explored the power rule and
              practiced applying it to polynomial functions, with a focus on
              recognizing the patterns that make differentiation quick and
              reliable.
            </p>
          </NoteSection>
          <NoteSection title="Structured notes">
            <h3>Introduction</h3>
            <ul>
              <li>
                Derivatives describe how a quantity changes at a specific
                moment.
              </li>
              <li>
                They are used to model motion, growth, and changing
                relationships.
              </li>
            </ul>
            <h3>Power Rule</h3>
            <ul>
              <li>
                For <code>f(x) = xⁿ</code>, the derivative is{" "}
                <code>f′(x) = n · xⁿ⁻¹</code>.
              </li>
              <li>
                Multiply by the exponent, then reduce the exponent by one.
              </li>
            </ul>
          </NoteSection>
          <NoteSection title="Important points">
            <ul className="highlight-list">
              <li>Note this carefully: the power rule is fundamental.</li>
              <li>Remember this formula for your examination.</li>
            </ul>
          </NoteSection>
        </article>
        <aside className="notes-sidebar">
          <div className="notes-side-section">
            <p className="eyebrow">KEY CONCEPTS</p>
            <div className="concept">
              <strong>Derivative</strong>
              <span>The instantaneous rate of change.</span>
            </div>
            <div className="concept">
              <strong>Power rule</strong>
              <span>A shortcut for differentiating powers.</span>
            </div>
          </div>
          <div className="notes-side-section">
            <p className="eyebrow">TEACHER HIGHLIGHTS</p>
            <blockquote>
              “Note this carefully: the power rule is fundamental.”
            </blockquote>
            <blockquote>
              “Remember this formula for your examination.”
            </blockquote>
          </div>
        </aside>
      </div>
      <div className="comparison-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LECTURE + READING</p>
            <h2>PDF comparison</h2>
          </div>
          <span className="coverage-score">3 of 5 topics covered</span>
        </div>
        <div className="comparison-table">
          <div className="table-row table-head">
            <span>Topic</span>
            <span>PDF material</span>
            <span>Lecture coverage</span>
            <span>Status</span>
          </div>
          {[
            ["Derivatives", "Yes", "Fully covered", "Covered"],
            ["Power rule", "Yes", "Fully covered", "Covered"],
            ["Chain rule", "Yes", "Partially covered", "Partial"],
            ["Applications", "Yes", "Not covered", "Not covered"],
            ["Extra example", "No", "Explained", "Additional"],
          ].map(([topic, pdf, coverage, status]) => (
            <div className="table-row" key={topic}>
              <span>
                <strong>{topic}</strong>
              </span>
              <span>{pdf}</span>
              <span>{coverage}</span>
              <span
                className={`table-status ${status.toLowerCase().replace(" ", "-")}`}
              >
                {status}
              </span>
            </div>
          ))}
        </div>
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
