'use client';

import { useEffect, useState } from 'react';

const PLANS = [
  {
    id: 'basic',
    name: '무료',
    price: '₩0',
    period: '',
    color: 'gray',
    features: ['안내방송 5개', '스케줄 3개', 'BGM 재생'],
    disabled: ['원격 방송', '무제한 안내방송', '무제한 스케줄', 'AI 음성 10종', '차임벨 8종'],
  },
  {
    id: 'standard',
    name: '스탠다드',
    price: '₩9,900',
    period: '/월',
    yearlyPrice: '₩99,000/년 (2개월 무료)',
    color: 'orange',
    features: ['무제한 안내방송', '무제한 스케줄', 'BGM 재생', 'AI 음성 10종', '차임벨 8종'],
    disabled: ['원격 방송 (모바일)'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₩19,900',
    period: '/월',
    yearlyPrice: '₩199,000/년 (2개월 무료)',
    color: 'green',
    features: ['스탠다드 전체 기능', '원격 방송 (모바일)', '우선 고객 지원'],
    disabled: [],
    recommended: true,
  },
];

function NetworkInfo() {
  const [ip, setIp] = useState('');
  useEffect(() => {
    fetch('/api/server-info').then(r => r.json()).then(d => setIp(d.ip ?? '')).catch(() => {});
  }, []);

  const remoteUrl = ip ? `http://${ip}:3001/remote` : 'http://[서버IP]:3001/remote';

  return (
    <section className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex flex-col gap-3">
      <h2 className="font-semibold text-gray-800 flex items-center gap-2">📱 원격 방송 접속</h2>
      <p className="text-sm text-gray-600">
        같은 WiFi에 연결된 휴대폰에서 아래 URL로 접속하세요.
      </p>
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
        <span className="text-sm font-mono text-orange-600 flex-1 break-all">{remoteUrl}</span>
        <button
          onClick={() => navigator.clipboard?.writeText(remoteUrl)}
          className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
        >
          복사
        </button>
      </div>
      <p className="text-xs text-gray-400">
        기본 PIN: <strong>0000</strong> — 설정 탭에서 변경 가능합니다.
      </p>
    </section>
  );
}

export function MyPageTab() {
  const currentPlan = 'basic'; // TODO: 실제 구독 상태 연동

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pb-4">
      {/* 현재 플랜 */}
      <section className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">현재 플랜</p>
            <h2 className="text-2xl font-bold text-gray-800">기본 (무료)</h2>
            <p className="text-sm text-gray-500 mt-1">원격 방송 등 Pro 기능을 사용하려면 업그레이드하세요.</p>
          </div>
          <span className="shrink-0 bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full">
            무료
          </span>
        </div>
      </section>

      {/* 원격 방송 URL */}
      <NetworkInfo />

      {/* 요금제 비교 */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-700 px-0.5">요금제 비교</h3>
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white border rounded-xl p-5 flex flex-col gap-3 ${
              plan.recommended ? 'border-orange-400 shadow-md' : 'border-gray-200 shadow-sm'
            }`}
          >
            {plan.recommended && (
              <span className="self-start bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                추천
              </span>
            )}
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-gray-800">{plan.name}</span>
              <div className="text-right">
                <span className="text-xl font-bold text-gray-800">
                  {plan.price}<span className="text-sm font-normal text-gray-500">{plan.period}</span>
                </span>
                {'yearlyPrice' in plan && (
                  <p className="text-xs text-orange-500 font-medium mt-0.5">{plan.yearlyPrice}</p>
                )}
              </div>
            </div>
            <ul className="flex flex-col gap-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500 shrink-0">✓</span>{f}
                </li>
              ))}
              {plan.disabled.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="shrink-0">✕</span>{f}
                </li>
              ))}
            </ul>
            {plan.id !== 'basic' && (
              <button
                onClick={() => alert('결제 시스템 준비 중입니다. 문의: 카카오톡 @ITNFitness')}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
                  plan.recommended
                    ? 'bg-green-500 hover:bg-green-400 text-white'
                    : 'bg-orange-500 hover:bg-orange-400 text-white'
                }`}
              >
                {plan.name} 시작하기
              </button>
            )}
          </div>
        ))}
      </section>

      {/* 문의 */}
      <section className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
        <p className="text-sm text-gray-600">
          결제 문의 또는 기업 도입 상담: <strong className="text-gray-800">카카오톡 채널 @ITNFitness</strong>
        </p>
      </section>
    </div>
  );
}
