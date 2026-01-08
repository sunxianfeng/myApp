'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Landing2Page() {
  const router = useRouter()

  // Scroll reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-reveal')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section - 视觉冲击首屏 */}
      <section className="relative min-h-[60vh] bg-[#FDE047] overflow-hidden flex items-center justify-center">
        {/* 噪点纹理 - SVG 基础噪点 */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        {/* 波点纹理叠加 */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, #000000 2px, transparent 2px)`,
            backgroundSize: '20px 20px',
            opacity: '0.08'
          }}
        />

        {/* 主要内容容器 */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          {/* 主标题 H1 - 倾斜的巨大黑色文字 */}
          <h1 
            className="text-7xl md:text-9xl font-black text-black mb-8 transform -rotate-2"
            style={{ 
              lineHeight: '1.1',
              letterSpacing: '0.02em'
            }}
          >
            题宝：
            <br />
            <span className="text-6xl md:text-8xl">拒绝无效刷题</span>
          </h1>
          
          {/* 副标题 P - 大号粗体 */}
          <p className="text-2xl md:text-4xl font-bold text-black mb-12 transform rotate-1">
            智能错题管理 · AI 思路启发 · 可视化进步
          </p>

          {/* 核心 CTA 按钮 - 绿色背景，粗黑边框，硬投影，按压交互 */}
          <button
            onClick={() => router.push('/register')}
            className="bg-[#A3E635] text-black text-2xl md:text-3xl font-black px-12 py-6 border-[3px] border-black rounded-2xl shadow-[5px_5px_0px_0px_#000000] hover:bg-[#bef047] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all duration-150"
          >
            🚀 立即开启，搞定错题
          </button>
        </div>
      </section>

      {/* Core Features Section - 核心功能展示 */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          {/* 区域标题 H2 - 居中粗体 */}
          <h2 className="text-5xl md:text-6xl font-black text-center mb-12">
            不仅是整理，更是提分武器
          </h2>

          {/* 功能卡片网格 - 3列布局 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 卡片 1 - 拍照录入 - 浅蓝色背景 + 轻微旋转 */}
            <div className="scroll-reveal bg-[#E0F2FE] border-[3px] border-black shadow-[5px_5px_0px_0px_#000000] p-8 rounded-xl transform -rotate-1 hover:-rotate-0.5 transition-transform duration-300">
              {/* 相机图标 + 扫描框示意 */}
              <div className="mb-6 relative">
                <svg className="w-24 h-24 stroke-black stroke-[3px] fill-none mx-auto" viewBox="0 0 100 100">
                  <rect x="15" y="25" width="70" height="55" rx="5" fill="white" />
                  <circle cx="50" cy="52.5" r="15" fill="white" />
                  <path d="M35 25 L38 15 L62 15 L65 25" />
                  {/* 对焦框角标 */}
                  <path d="M20 35 L30 35 L30 45" strokeWidth="3" />
                  <path d="M80 35 L70 35 L70 45" strokeWidth="3" />
                  <path d="M20 70 L30 70 L30 60" strokeWidth="3" />
                  <path d="M80 70 L70 70 L70 60" strokeWidth="3" />
                  {/* 镜头中心点 */}
                  <circle cx="50" cy="52.5" r="3" fill="black" />
                </svg>
                {/* 扫描线动画 */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-16 h-1 bg-red-500 animate-pulse" />
              </div>
              <h3 className="text-3xl font-black mb-4 text-center">一键拍照收录</h3>
              <p className="text-lg font-bold text-center text-gray-800 leading-relaxed">
                告别手抄，秒变可编辑文本。
              </p>
            </div>

            {/* 卡片 2 - 思路启发（重点强调）- 浅紫色标题栏 + 加粗文字 */}
            <div className="scroll-reveal bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000000] p-8 rounded-xl transform rotate-1.5 hover:rotate-0.5 transition-transform duration-300">
              {/* 浅紫色标题栏背景 */}
              <div className="bg-[#E9D5FF] border-b-[3px] border-black -mx-8 -mt-8 px-8 pt-6 pb-4 mb-6 rounded-t-xl">
                {/* 灯泡图标 + 光芒 + 问号 */}
                <svg className="w-24 h-24 stroke-black stroke-[3px] fill-none mx-auto" viewBox="0 0 100 100">
                  <circle cx="50" cy="40" r="20" fill="white" />
                  {/* 问号 */}
                  <text x="50" y="48" fontSize="28" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" textAnchor="middle" fill="black">?</text>
                  <path d="M35 50 L35 70 L65 70 L65 50" />
                  <rect x="42" y="70" width="16" height="10" />
                  <line x1="50" y1="20" x2="50" y2="5" strokeWidth="3" />
                  <line x1="30" y1="25" x2="20" y2="15" strokeWidth="3" />
                  <line x1="70" y1="25" x2="80" y2="15" strokeWidth="3" />
                  <line x1="20" y1="40" x2="5" y2="40" strokeWidth="3" />
                  <line x1="80" y1="40" x2="95" y2="40" strokeWidth="3" />
                </svg>
              </div>
              <h3 className="text-3xl font-black mb-6 text-center">AI 思路引导（独家）</h3>
              <p className="text-lg font-bold text-center text-gray-800 leading-relaxed mb-6">
                不直接给答案，引导你一步步思考解题关键。
              </p>
            </div>

            {/* 卡片 3 - 可视化报告 - 浅粉色背景 + 轻微旋转 */}
            <div className="scroll-reveal bg-[#FFE4E6] border-[3px] border-black shadow-[5px_5px_0px_0px_#000000] p-8 rounded-xl transform rotate-1 hover:rotate-0.5 transition-transform duration-300">
              {/* 柱状图图标 + 进度条 */}
              <div className="mb-6">
                <svg className="w-24 h-24 stroke-black stroke-[3px] fill-none mx-auto" viewBox="0 0 100 100">
                  <line x1="10" y1="85" x2="90" y2="85" strokeWidth="3" />
                  <line x1="10" y1="15" x2="10" y2="85" strokeWidth="3" />
                  <rect x="20" y="45" width="15" height="40" fill="#A3E635" />
                  <rect x="42" y="35" width="15" height="50" fill="#A3E635" />
                  <rect x="64" y="25" width="15" height="60" fill="#A3E635" />
                  {/* 进度条 */}
                  <rect x="20" y="90" width="70" height="6" rx="3" fill="white" strokeWidth="2" />
                  <rect x="20" y="90" width="50" height="6" rx="3" fill="#A3E635" />
                </svg>
              </div>
              <h3 className="text-3xl font-black mb-4 text-center">掌握度可视化</h3>
              <p className="text-lg font-bold text-center text-gray-800 leading-relaxed">
                看着进度条涨满，成就感爆棚。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - 底部行动召唤 */}
      <section className="relative">
        {/* 上半部白色，下半部黑色 */}
        <div className="bg-white h-16" />
        <div className="bg-black py-24">
          {/* 横跨黑白交界的巨大黄色容器 */}
          <div className="max-w-4xl mx-auto px-6 -mt-32 relative z-10">
            <div className="bg-[#FDE047] border-[3px] border-black shadow-[5px_5px_0px_0px_#000000] p-12 md:p-16 rounded-3xl text-center">
              {/* 文案 */}
              <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                还在这里看？
                <br />
                <span className="text-5xl md:text-6xl">错题又增加了。</span>
              </h2>

              {/* 最终按钮 - 链接到登录页 - 更大的按钮，更长的箭头 */}
              <button
                onClick={() => router.push('/login')}
                className="bg-[#A3E635] text-black text-3xl md:text-4xl font-black px-16 py-8 border-[3px] border-black rounded-2xl shadow-[6px_6px_0px_0px_#000000] hover:bg-[#bef047] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all duration-150 inline-flex items-center gap-4 mt-8"
              >
                去登录，消灭它们
                <span className="text-4xl">→→→</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
