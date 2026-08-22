export type Role = 'faculty' | 'student';

type RoleSelectorProps = {
  value: Role;
  onChange: (role: Role) => void;
};

const roles: { label: string; value: Role }[] = [
  { label: 'Faculty', value: 'faculty' },
  { label: 'Student', value: 'student' },
];

export default function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="role-selector">
      <span className="label-title">Role</span>
      <div className="role-options">
        {roles.map((role) => (
          <button
            key={role.value}
            type="button"
            className={value === role.value ? 'role-option active' : 'role-option'}
            onClick={() => onChange(role.value)}
          >
            {role.label}
          </button>
        ))}
      </div>
    </div>
  );
}
