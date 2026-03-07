// Generated: 2026-03-07 00:00:00 KST

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Sunjin Infotech ERP — IT 인프라 통합 업무 관리 시스템';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(145deg, #0b1f45 0%, #1a3a7a 60%, #0d2d6b 100%)',
          padding: '64px 80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* 격자 패턴 오버레이 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            display: 'flex',
          }}
        />

        {/* 우측 글로우 */}
        <div
          style={{
            position: 'absolute',
            right: '-80px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(26,86,196,0.3) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* 상단: 로고 + 배지 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          {/* 로고 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: '#c8202a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '28px',
                fontWeight: 900,
                fontStyle: 'italic',
              }}
            >
              S
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#ffffff', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>
                Sunjin Infotech
              </span>
              <span style={{ color: '#94b4f0', fontSize: '14px', fontWeight: 400, marginTop: '2px' }}>
                IT 인프라 통합 솔루션
              </span>
            </div>
          </div>

          {/* 운영 상태 배지 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(26,86,196,0.25)',
              border: '1px solid rgba(26,86,196,0.5)',
              borderRadius: '100px',
              padding: '8px 18px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#4ade80',
              }}
            />
            <span style={{ color: '#94b4f0', fontSize: '14px', fontWeight: 600 }}>
              시스템 정상 운영 중
            </span>
          </div>
        </div>

        {/* 중앙: 메인 카피 */}
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ display: 'flex', marginBottom: '20px' }}>
            <span
              style={{
                background: 'rgba(26,86,196,0.3)',
                border: '1px solid rgba(91,156,246,0.4)',
                borderRadius: '6px',
                color: '#5b9cf6',
                fontSize: '16px',
                fontWeight: 700,
                padding: '6px 16px',
                letterSpacing: '0.06em',
              }}
            >
              ERP SYSTEM
            </span>
          </div>

          <div
            style={{
              color: '#ffffff',
              fontSize: '62px',
              fontWeight: 900,
              letterSpacing: '-2px',
              lineHeight: 1.15,
              marginBottom: '20px',
            }}
          >
            업무의 모든 흐름을
            <br />
            <span style={{ color: '#5b9cf6' }}>하나의 플랫폼</span>으로
          </div>

          <div
            style={{
              color: 'rgba(148,180,240,0.85)',
              fontSize: '22px',
              lineHeight: 1.6,
              maxWidth: '680px',
            }}
          >
            직원·고객·프로젝트·재고·유지보수까지 — 선진인포텍의
            <br />모든 업무를 실시간으로 연결하고 관리합니다.
          </div>
        </div>

        {/* 하단: 제품 배지 + URL */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', position: 'relative' }}>
          {/* 제품 배지 */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['영상 관리', '영상 분석', '스토리지', 'KVM', '네트워크', '방송 시스템'].map((label) => (
              <div
                key={label}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '15px',
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* URL */}
          <div
            style={{
              color: 'rgba(148,180,240,0.6)',
              fontSize: '16px',
              fontWeight: 500,
              letterSpacing: '0.02em',
            }}
          >
            www.clayve.co.kr/sunjin
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
