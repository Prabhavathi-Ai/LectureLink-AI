import Navbar from '../components/layout/Navbar';
import SummaryCard from '../components/notes/SummaryCard';
import ImportantPoints from '../components/notes/ImportantPoints';
import ComparisonTable from '../components/notes/ComparisonTable';

const notesPoints = [
  'The lecture focused on practical AI adoption in education.',
  'Students benefited from real-time comprehension support.',
  'Summaries should prioritize clarity, structure, and follow-up actions.',
];

const comparisonRows = [
  { label: 'Model Design', lecture: 'AI agents reduce manual workloads.', notes: 'Lecture highlights the value of human review.' },
  { label: 'Assessment', lecture: 'Rubrics and feedback loops are essential.', notes: 'PDF emphasizes scoring consistency and fairness.' },
];

export default function NotesPage() {
  return (
    <div className="page-shell">
      <Navbar title="Lecture Notes" />

      <main className="dashboard-page notes-page">
        <SummaryCard
          title="Summary"
          content="This lecture introduced a practical framework for designing AI-assisted learning experiences that support both teachers and students without compromising human oversight."
        />

        <div className="notes-grid">
          <SummaryCard
            title="Structured Notes"
            content="1. Understand classroom goals. 2. Use AI to generate support materials. 3. Review outputs with educators. 4. Improve the workflow through student feedback."
          />

          <ImportantPoints points={notesPoints} />
        </div>

        <ComparisonTable rows={comparisonRows} />

        <div className="export-row">
          <button type="button" className="primary-button">Export PDF</button>
          <button type="button" className="secondary-button">Export Notes</button>
        </div>
      </main>
    </div>
  );
}
