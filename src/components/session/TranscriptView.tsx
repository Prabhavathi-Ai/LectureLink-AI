type TranscriptEntry = {
  id: number;
  speaker: string;
  time: string;
  text: string;
  highlight?: boolean;
};

type TranscriptViewProps = {
  entries: TranscriptEntry[];
};

export default function TranscriptView({ entries }: TranscriptViewProps) {
  return (
    <div className="transcript-view">
      {entries.map((entry) => (
        <div key={entry.id} className={entry.highlight ? 'transcript-entry highlight' : 'transcript-entry'}>
          <div className="transcript-header">
            <strong>{entry.speaker}</strong>
            <span>{entry.time}</span>
          </div>
          <p>{entry.text}</p>
        </div>
      ))}
    </div>
  );
}
