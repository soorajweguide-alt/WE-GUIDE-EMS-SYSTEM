export default function Topbar({ title, subtitle, children }) {
  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
      </div>
      {children && <div className="topbar-actions">{children}</div>}
    </div>
  );
}
