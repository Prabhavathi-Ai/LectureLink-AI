type ComparisonRow = {
  label: string;
  lecture: string;
  notes: string;
};

type ComparisonTableProps = {
  rows: ComparisonRow[];
};

export default function ComparisonTable({ rows }: ComparisonTableProps) {
  return (
    <section className="comparison-table">
      <h3>PDF Comparison</h3>
      <table>
        <thead>
          <tr>
            <th>Topic</th>
            <th>Lecture</th>
            <th>PDF</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{row.lecture}</td>
              <td>{row.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
