export function Panel({ label, meta, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      {(label || meta) && (
        <div className="panel__bar">
          <span className="panel__label">
            <span className="status-square" aria-hidden="true" />
            {label}
          </span>
          {meta && <span className="panel__meta">{meta}</span>}
        </div>
      )}
      {children}
    </section>
  )
}

export function SectionTitle({ eyebrow, title, description }) {
  return (
    <header className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description && <p className="section-heading__description">{description}</p>}
    </header>
  )
}
