import Navbar from '../components/layout/Navbar';
import TranscriptView from '../components/session/TranscriptView';

const transcript = [
  { id: 1, speaker: 'Prof. Singh', time: '09:15 AM', text: 'Today we will examine how AI can enhance student learning outcomes.' },
  { id: 2, speaker: 'Student', time: '09:16 AM', text: 'Could you explain how the system handles real-time summaries?', highlight: true },
  { id: 3, speaker: 'Prof. Singh', time: '09:17 AM', text: 'The workflow collects speech, identifies key ideas, and converts them into structured notes.' },
];

export default function LiveSessionPage() {
  return (
    <div className="page-shell">
      <Navbar title="Live Session" />

      <main className="dashboard-page live-page">
        <section className="panel">
          <div className="panel-header session-header">
            <div>
              <p className="eyebrow">Live indicator</p>
              <h2>AI Ethics and Digital Learning</h2>
            </div>
            <span className="live-pill">● Live</span>
          </div>

          <div className="transcript-panel">
            <TranscriptView entries={transcript} />
          </div>
        </section>
      </main>
    </div>
  );
}
