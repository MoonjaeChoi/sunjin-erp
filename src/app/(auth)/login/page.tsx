// Generated: 2026-01-25 01:00:00 KST

import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: '로그인 - Sunjin ERP',
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-2">Sunjin ERP</h1>
      <p className="text-sm text-center text-gray-400 mb-8">업무 관리 시스템</p>
      <LoginForm />
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center mb-2">테스트 계정</p>
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex justify-between"><span>관리자</span><span>admin / password</span></div>
          <div className="flex justify-between"><span>매니저</span><span>manager / password</span></div>
          <div className="flex justify-between"><span>사용자</span><span>user / password</span></div>
        </div>
      </div>
    </div>
  );
}
