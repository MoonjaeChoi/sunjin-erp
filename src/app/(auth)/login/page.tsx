// Generated: 2026-01-24 19:10:00 KST

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인 - Sunjin ERP',
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-2">Sunjin ERP</h1>
      <p className="text-sm text-center text-gray-400 mb-8">업무 관리 시스템</p>

      <form>
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            아이디
          </label>
          <input
            id="username"
            name="username"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="아이디를 입력하세요"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="비밀번호를 입력하세요"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          로그인
        </button>
      </form>

      <p className="mt-6 text-xs text-center text-gray-400">
        Auth 모듈 구현 후 로그인 기능이 활성화됩니다.
      </p>
    </div>
  );
}
