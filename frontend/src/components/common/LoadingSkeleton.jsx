import React from 'react';

export default function LoadingSkeleton({ height = '120px', count = 1, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', ...style }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton" style={{ height, width: '100%' }}></div>
      ))}
    </div>
  );
}
