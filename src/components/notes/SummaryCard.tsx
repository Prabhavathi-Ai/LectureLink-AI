type SummaryCardProps = {
  title: string;
  content: string;
};

export default function SummaryCard({ title, content }: SummaryCardProps) {
  return (
    <section className="summary-card">
      <h3>{title}</h3>
      <p>{content}</p>
    </section>
  );
}
