import Navbar from '../components/layout/Navbar';
import SessionCard from '../components/session/SessionCard';

const sessions = [
  { title: 'Machine Learning Fundamentals', time: 'Today • 2:00 PM', participants: 32 },
  { title: 'Database Systems Seminar', time: 'Today • 3:30 PM', participants: 18 },
];

const notes = ['AI in modern teaching workflows', 'Evaluation strategy and rubrics'];

export default function StudentDashboard() {
  return (
    <div className="page-shell">
      <Navbar title="Student Dashboard" />

      <main className="dashboard-page two-column">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Active sessions</p>
              <h2>Join a live lecture</h2>
            </div>
          </div>

          <div className="stack-list">
            {sessions.map((session) => (
              <SessionCard
                key={session.title}
                title={session.title}
                time={session.time}
                participants={session.participants}
                status="Live"
                actionLabel="Join"
              />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Previous notes</p>
              <h2>Recent study items</h2>
            </div>
          </div>

          <ul className="note-list">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
