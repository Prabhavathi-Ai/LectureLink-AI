import { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RoleSelector, { type Role } from '../components/auth/RoleSelector';

export default function LoginPage() {
  const [domainId, setDomainId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('faculty');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = () => {
    setError('');

    if (!domainId.trim() || !password.trim()) {
      setError('Please enter both your domain ID and password.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      if (domainId.toLowerCase() === 'faculty' && password.length >= 6) {
        console.log('Faculty login successful');
        return;
      }

      if (domainId.toLowerCase() === 'student' && password.length >= 6) {
        console.log('Student login successful');
        return;
      }

      setError('Invalid credentials. Please try again.');
    }, 700);
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand-header">
          <div className="brand-mark large">LL</div>
          <div>
            <p className="eyebrow">AI Lecture Intelligence</p>
            <h1>LectureLink AI</h1>
          </div>
        </div>

        <p className="welcome-text">Sign in to continue to your lecture workspace.</p>

        <LoginForm
          domainId={domainId}
          password={password}
          onDomainIdChange={setDomainId}
          onPasswordChange={setPassword}
          onSubmit={handleLogin}
          isSubmitting={isSubmitting}
          error={error}
        />

        <RoleSelector value={role} onChange={setRole} />
      </div>
    </div>
  );
}
