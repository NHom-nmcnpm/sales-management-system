import { useId } from 'react';

export function Field({ label, error, hint, required, children, ...props }) {
  const id = useId();
  return (
    <div className="field">
      <div className="field-label">
        <label htmlFor={id}>{label}</label>
        {required && (
          <span className="required" aria-hidden="true">
            *
          </span>
        )}
      </div>
      {children ? (
        <select
          id={id}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${id}-help` : undefined}
          required={required}
          {...props}
        >
          {children}
        </select>
      ) : (
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${id}-help` : undefined}
          required={required}
          {...props}
        />
      )}
      {(error || hint) && (
        <p id={`${id}-help`} className={error ? 'field-error' : 'field-hint'}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
