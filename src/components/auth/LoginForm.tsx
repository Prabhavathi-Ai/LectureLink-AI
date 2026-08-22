type LoginFormProps = {
  domainId: string;
  password: string;
  onDomainIdChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string;
};

export default function LoginForm({
  domainId,
  password,
  onDomainIdChange,
  onPasswordChange,
  onSubmit,
  isSubmitting = false,
  error,
}: LoginFormProps) {
  return (
    <div className="login-form">
      <label className="field">
        <span>Domain ID</span>
        <input
          type="text"
          value={domainId}
          onChange={(event) => onDomainIdChange(event.target.value)}
          placeholder="Enter your domain ID"
          autoComplete="username"
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button type="button" className="primary-button" onClick={onSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </button>
    </div>
  );
}
