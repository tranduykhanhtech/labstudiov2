import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
          borderRadius: '8px',
          padding: '4px',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Router Node Circle */}
          <circle cx="12" cy="12" r="8" stroke="#38bdf8" strokeWidth="2" fill="#0f172a" />
          {/* Connected Network Nodes */}
          <circle cx="12" cy="12" r="2.5" fill="#38bdf8" />
          <path d="M12 4v3" stroke="#38bdf8" />
          <path d="M12 17v3" stroke="#38bdf8" />
          <path d="M4 12h3" stroke="#38bdf8" />
          <path d="M17 12h3" stroke="#38bdf8" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
