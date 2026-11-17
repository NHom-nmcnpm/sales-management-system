export function StatCard({ label, value, icon: Icon, tone = 'blue', detail }) {
  return <section className="stat-card panel"><div className="stat-card-label"><span>{label}</span><span className={`stat-icon ${tone}`}><Icon size={18} aria-hidden="true" /></span></div><strong>{value}</strong>{detail && <p>{detail}</p>}</section>;
}
