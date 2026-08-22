type SessionCardProps = {
  title: string;
  time: string;
  participants: number;
  status?: 'Live' | 'Upcoming';
  onAction?: () => void;
  actionLabel?: string;
};

export default function SessionCard({
  title,
  time,
  participants,
  status = 'Live',
  onAction,
  actionLabel = 'Join',
}: SessionCardProps) {
  return (
    <article className="session-card">
      <div>
        <span className={status === 'Live' ? 'badge live' : 'badge upcoming'}>{status}</span>
        <h3>{title}</h3>
      </div>

      <div className="session-meta">
        <span>{time}</span>
        <span>{participants} participants</span>
      </div>

      {onAction ? (
        <button type="button" className="secondary-button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}
