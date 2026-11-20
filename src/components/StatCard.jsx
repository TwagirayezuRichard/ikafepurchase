import React from 'react';

export default function StatCard({ label, value, accent }) {
  return (
    <div className="stat-card" style={{ '--accent': accent }}>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
