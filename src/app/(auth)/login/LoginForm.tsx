// Generated: 2026-01-25 01:00:00 KST

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* 에러 메시지 */}
      {error && (
        <div
          className="flex items-center gap-3 p-3.5 rounded-xl text-sm"
          style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c' }}
        >
          <span className="text-base flex-shrink-0">⚠️</span>
          {error}
        </div>
      )}

      {/* 아이디 */}
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          아이디
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
          placeholder="아이디를 입력하세요"
          className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none disabled:opacity-50"
          style={{
            border: '1.5px solid #e5e7eb',
            background: '#fafafa',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#1a56c4';
            e.target.style.background = '#fff';
            e.target.style.boxShadow = '0 0 0 3px rgba(26,86,196,.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e5e7eb';
            e.target.style.background = '#fafafa';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* 비밀번호 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-gray-700"
          >
            비밀번호
          </label>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          placeholder="비밀번호를 입력하세요"
          className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 outline-none disabled:opacity-50"
          style={{
            border: '1.5px solid #e5e7eb',
            background: '#fafafa',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#1a56c4';
            e.target.style.background = '#fff';
            e.target.style.boxShadow = '0 0 0 3px rgba(26,86,196,.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e5e7eb';
            e.target.style.background = '#fafafa';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* 로그인 버튼 */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: loading
            ? '#6b7280'
            : 'linear-gradient(135deg, #1a56c4 0%, #0b1f45 100%)',
          boxShadow: loading ? 'none' : '0 4px 16px rgba(26,86,196,.35)',
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
            (e.target as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(26,86,196,.45)';
          }
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
          (e.target as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(26,86,196,.35)';
        }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            로그인 중...
          </span>
        ) : (
          '시스템 접속하기 →'
        )}
      </button>

    </form>
  );
}
