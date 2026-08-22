type NavbarProps = {
  title?: string;
};

export default function Navbar({ title = 'LectureLink AI' }: NavbarProps) {
  return (
    <header className="navbar">
      <div className="brand-block">
        <div className="brand-mark">LL</div>
        <div>
          <p className="eyebrow">Education Technology</p>
          <h2>{title}</h2>
        </div>
      </div>
      <nav className="nav-actions">
        <button type="button">Dashboard</button>
        <button type="button">Sessions</button>
        <button type="button" className="nav-logout">Logout</button>
      </nav>
    </header>
  );
}
