import type { PropsWithChildren, ReactNode } from 'react';

export function Panel({ title, icon, actions, className = '', children }: PropsWithChildren<{ title: string; icon?: ReactNode; actions?: ReactNode; className?: string }>) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel__header">
        <div className="panel__title">{icon}{title}</div>
        {actions && <div className="panel__actions">{actions}</div>}
      </header>
      <div className="panel__body">{children}</div>
    </section>
  );
}

export function Metric({ label, value, unit, large = false }: { label: string; value: string | number; unit?: string; large?: boolean }) {
  return (
    <div className={`metric ${large ? 'metric--large' : ''}`}>
      <span className="metric__label">{label}</span>
      <span className="metric__value">{value}{unit && <small> {unit}</small>}</span>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-state__mark">A</div><h2>{title}</h2><p>{description}</p>{action}</div>;
}
