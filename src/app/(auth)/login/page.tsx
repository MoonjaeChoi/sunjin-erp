// Generated: 2026-03-07 00:00:00 KST

import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Sunjin ERP — 선진 업무 관리 시스템',
};

const features = [
  {
    icon: '👥',
    title: '직원 & 부서 관리',
    desc: '조직도, 근태, 권한을 한 곳에서',
  },
  {
    icon: '🤝',
    title: '고객 & 영업 관리',
    desc: '고객 이력, 프로젝트, 계약을 통합 관리',
  },
  {
    icon: '🔧',
    title: '기술 지원 & 이슈',
    desc: '접수부터 처리까지 완전한 티켓 시스템',
  },
  {
    icon: '📦',
    title: '재고 & 유지보수',
    desc: '재고 현황과 유지보수 계약 일정 관리',
  },
];

const stats = [
  { num: '9', unit: '개', label: '업무 모듈' },
  { num: '24', unit: 'h', label: '실시간 모니터링' },
  { num: '100', unit: '%', label: '한국어 지원' },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">

      {/* ── LEFT: 랜딩 영역 ─────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between flex-1 px-16 py-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0b1f45 0%, #1a3a7a 60%, #0d2d6b 100%)' }}
      >
        {/* 회로 패턴 배경 */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* 글로우 */}
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #1a56c4 0%, transparent 70%)' }}
        />

        {/* 로고 */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg italic"
              style={{ background: '#c8202a' }}
            >
              S
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Sunjin ERP</span>
          </div>
          <p className="text-blue-300 text-sm font-medium ml-[52px]">선진인포텍 업무 관리 시스템</p>
        </div>

        {/* 메인 카피 */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-blue-300 mb-8 w-fit"
            style={{ background: 'rgba(26,86,196,.25)', border: '1px solid rgba(26,86,196,.5)' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-green-400"
              style={{ boxShadow: '0 0 0 3px rgba(74,222,128,.25)' }}
            />
            시스템 정상 운영 중
          </div>

          <h1 className="text-4xl font-black text-white leading-tight tracking-tight mb-5">
            업무의 모든 흐름을<br />
            <span style={{ color: '#5b9cf6' }}>하나의 플랫폼</span>으로
          </h1>
          <p className="text-blue-200 text-base leading-relaxed mb-12 max-w-md opacity-80">
            직원·고객·프로젝트·재고·유지보수까지.
            선진인포텍의 모든 업무를 실시간으로 연결하고 관리합니다.
          </p>

          {/* 기능 카드 */}
          <div className="grid grid-cols-2 gap-3 max-w-lg">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: 'rgba(255,255,255,.06)',
                  border: '1px solid rgba(255,255,255,.1)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div className="text-xl mb-2">{f.icon}</div>
                <div className="text-white text-sm font-bold mb-1">{f.title}</div>
                <div className="text-blue-300 text-xs leading-relaxed opacity-80">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 통계 */}
        <div className="relative z-10 flex items-center gap-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-white font-black text-2xl tracking-tight">
                {s.num}<span style={{ color: '#5b9cf6' }}>{s.unit}</span>
              </div>
              <div className="text-blue-300 text-xs font-medium opacity-70">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: 로그인 영역 ─────────────────────────── */}
      <div className="flex flex-col justify-center items-center w-full lg:w-[440px] lg:flex-none bg-white px-10 py-12">

        {/* 모바일 전용 로고 */}
        <div className="flex lg:hidden items-center gap-3 mb-10">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base italic"
            style={{ background: '#c8202a' }}
          >
            S
          </div>
          <span className="text-gray-900 font-bold text-lg tracking-tight">Sunjin ERP</span>
        </div>

        <div className="w-full max-w-sm">
          {/* 헤더 */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
              로그인
            </h2>
            <p className="text-gray-500 text-sm">
              계정 정보를 입력하여 시스템에 접속하세요.
            </p>
          </div>

          {/* 폼 */}
          <LoginForm />

          {/* 테스트 계정 안내 */}
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid #f0f0f0' }}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              테스트 계정 (비밀번호: password123)
            </p>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #f0f4ff' }}>
              {[
                { name: '김철수 (관리자)', id: 'kim' },
                { name: '이영희 (매니저)', id: 'lee' },
                { name: '박민준 (일반)', id: 'park' },
              ].map((acc, i) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between px-4 py-2.5 text-xs"
                  style={{
                    background: i % 2 === 0 ? '#f8faff' : '#fff',
                    borderBottom: i < 2 ? '1px solid #f0f4ff' : 'none',
                  }}
                >
                  <span className="text-gray-600 font-medium">{acc.name}</span>
                  <code
                    className="font-mono font-bold px-2 py-0.5 rounded"
                    style={{ background: '#e8edff', color: '#1a56c4' }}
                  >
                    {acc.id}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="mt-auto pt-12 text-center">
          <p className="text-xs text-gray-300">
            © 2026 Sunjin Infotech. All rights reserved.
          </p>
        </div>
      </div>

    </div>
  );
}
