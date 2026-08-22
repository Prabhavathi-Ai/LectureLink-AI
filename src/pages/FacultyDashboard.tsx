import Navbar from '../components/layout/Navbar';

export default function FacultyDashboard() {
  return (
    <div className="page-shell">
      <Navbar title="Faculty Dashboard" />

      <main className="dashboard-page">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Create a lecture</p>
              <h2>Start a new session</h2>
            </div>
          </div>

          <div className="lecture-form">
            <label className="field">
              <span>Lecture Title</span>
              <input type="text" placeholder="Enter lecture title" />
            </label>

            <div className="cta-row">
              <button type="button" className="primary-button">Start Live Lecture</button>
              <button type="button" className="secondary-button danger">End Session</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
