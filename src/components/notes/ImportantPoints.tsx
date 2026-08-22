type ImportantPointsProps = {
  points: string[];
};

export default function ImportantPoints({ points }: ImportantPointsProps) {
  return (
    <section className="points-card">
      <h3>Important Points</h3>
      <ul>
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </section>
  );
}
