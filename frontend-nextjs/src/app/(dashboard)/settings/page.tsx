'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/lib/store'

// Icons
const IconUser = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconCrown = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M5 16v4h14v-4" />
  </svg>
)

const IconCreditCard = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)

const IconZap = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

export default function SettingsPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const [activeTab, setActiveTab] = useState<'profile' | 'membership' | 'payment'>('membership')
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly')

  const plans = {
    monthly: {
      price: 15,
      period: '月',
      discount: null,
    },
    yearly: {
      price: 150,
      period: '年',
      discount: '节省17%',
      monthlyEquivalent: 12.5,
    },
  }

  const handlePayment = (method: 'alipay' | 'wechat') => {
    // TODO: Integrate with payment gateway
    alert(`即将跳转到${method === 'alipay' ? '支付宝' : '微信'}支付...\n\n⚠️ 支付功能开发中，敬请期待！`)
  }

  return (
    <div className="unified-questions-page" style={{ fontFamily: "'JetBrains Mono', 'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <header className="unified-header">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 900, 
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            账户设置
          </h1>
          <p style={{ color: '#6B7280', fontSize: '1rem' }}>
            管理您的账户、会员订阅和支付方式
          </p>
        </div>
      </header>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        padding: '8px',
        backgroundColor: 'white',
        border: '3px solid black',
        borderRadius: '12px',
        boxShadow: '4px 4px 0 rgba(0,0,0,1)',
        width: 'fit-content',
      }}>
        {[
          { id: 'profile', label: '个人资料', icon: <IconUser size={18} /> },
          { id: 'membership', label: '会员订阅', icon: <IconCrown size={18} /> },
          { id: 'payment', label: '支付方式', icon: <IconCreditCard size={18} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === tab.id ? '#A3E635' : 'transparent',
              border: activeTab === tab.id ? '2px solid black' : '2px solid transparent',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: activeTab === tab.id ? '2px 2px 0 rgba(0,0,0,1)' : 'none',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div style={{
          backgroundColor: 'white',
          border: '3px solid black',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '6px 6px 0 rgba(0,0,0,1)',
          maxWidth: '600px',
        }}>
          <h2 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '24px' }}>
            个人资料
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', fontSize: '0.875rem' }}>
                邮箱
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '3px solid black',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: '#F3F4F6',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', fontSize: '0.875rem' }}>
                用户名
              </label>
              <input
                type="text"
                defaultValue={user?.name || ''}
                placeholder="设置您的用户名"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '3px solid black',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', fontSize: '0.875rem' }}>
                昵称
              </label>
              <input
                type="text"
                defaultValue=""
                placeholder="设置您的昵称"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '3px solid black',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', fontSize: '0.875rem' }}>
                手机号
              </label>
              <input
                type="tel"
                defaultValue=""
                placeholder="请输入手机号码"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '3px solid black',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', fontSize: '0.875rem' }}>
                学校/机构
              </label>
              <input
                type="text"
                defaultValue=""
                placeholder="请输入您的学校或机构名称"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '3px solid black',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', fontSize: '0.875rem' }}>
                年级
              </label>
              <select
                defaultValue=""
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '3px solid black',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                <option value="" disabled>请选择年级</option>
                <option value="primary_1">小学一年级</option>
                <option value="primary_2">小学二年级</option>
                <option value="primary_3">小学三年级</option>
                <option value="primary_4">小学四年级</option>
                <option value="primary_5">小学五年级</option>
                <option value="primary_6">小学六年级</option>
                <option value="junior_1">初中一年级</option>
                <option value="junior_2">初中二年级</option>
                <option value="junior_3">初中三年级</option>
                <option value="senior_1">高中一年级</option>
                <option value="senior_2">高中二年级</option>
                <option value="senior_3">高中三年级</option>
                <option value="college">大学</option>
                <option value="other">其他</option>
              </select>
            </div>

            <button
              style={{
                marginTop: '12px',
                padding: '14px 28px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: '3px solid black',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '4px 4px 0 rgba(0,0,0,1)',
                transition: 'all 0.2s',
                width: 'fit-content',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(2px, 2px)'
                e.currentTarget.style.boxShadow = '2px 2px 0 rgba(0,0,0,1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate(0, 0)'
                e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0,0,0,1)'
              }}
            >
              保存更改
            </button>
          </div>
        </div>
      )}

      {/* Membership Tab */}
      {activeTab === 'membership' && (
        <div>
          {/* Pricing Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '32px',
          }}>
            {/* Free Trial */}
            <div
              style={{
                backgroundColor: '#EFF6FF',
                border: '3px solid black',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: '4px 4px 0 rgba(0,0,0,1)',
                position: 'relative',
              }}
            >
              {/* Free Badge */}
              <div style={{
                position: 'absolute',
                top: '-12px',
                right: '16px',
                padding: '4px 12px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: '2px solid black',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.75rem',
              }}>
                🎁 新用户专享
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 900, fontSize: '1.25rem', marginBottom: '4px' }}>免费试用</h3>
                <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>新用户专属体验</p>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: 900, fontSize: '2.5rem' }}>¥0</span>
                <span style={{ color: '#6B7280', fontSize: '1rem' }}> / 10天</span>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <span style={{
                  padding: '4px 10px',
                  backgroundColor: '#BFDBFE',
                  border: '2px solid black',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                }}>
                  每天10次上传
                </span>
              </div>
              <div style={{
                padding: '8px 16px',
                backgroundColor: '#E5E7EB',
                border: '2px solid black',
                borderRadius: '8px',
                textAlign: 'center',
                fontWeight: 700,
                color: '#6B7280',
              }}>
                注册即享
              </div>
            </div>

            {/* Monthly Plan */}
            <div
              onClick={() => setSelectedPlan('monthly')}
              style={{
                backgroundColor: selectedPlan === 'monthly' ? '#FEF3C7' : 'white',
                border: selectedPlan === 'monthly' ? '4px solid black' : '3px solid black',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: selectedPlan === 'monthly' ? '8px 8px 0 rgba(0,0,0,1)' : '4px 4px 0 rgba(0,0,0,1)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                transform: selectedPlan === 'monthly' ? 'translate(-2px, -2px)' : 'none',
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 900, fontSize: '1.25rem', marginBottom: '4px' }}>月度会员</h3>
                <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>按月灵活订阅</p>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontWeight: 900, fontSize: '2.5rem' }}>¥{plans.monthly.price}</span>
                <span style={{ color: '#6B7280', fontSize: '1rem' }}> / {plans.monthly.period}</span>
              </div>
              <div style={{
                padding: '8px 16px',
                backgroundColor: selectedPlan === 'monthly' ? '#A3E635' : '#E5E7EB',
                border: '2px solid black',
                borderRadius: '8px',
                textAlign: 'center',
                fontWeight: 700,
              }}>
                {selectedPlan === 'monthly' ? '已选择' : '选择此方案'}
              </div>
            </div>

            {/* Yearly Plan */}
            <div
              onClick={() => setSelectedPlan('yearly')}
              style={{
                backgroundColor: selectedPlan === 'yearly' ? '#DCFCE7' : 'white',
                border: selectedPlan === 'yearly' ? '4px solid black' : '3px solid black',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: selectedPlan === 'yearly' ? '8px 8px 0 rgba(0,0,0,1)' : '4px 4px 0 rgba(0,0,0,1)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                transform: selectedPlan === 'yearly' ? 'translate(-2px, -2px)' : 'none',
                position: 'relative',
              }}
            >
              {/* Best Value Badge */}
              <div style={{
                position: 'absolute',
                top: '-12px',
                right: '16px',
                padding: '4px 12px',
                backgroundColor: '#EF4444',
                color: 'white',
                border: '2px solid black',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.75rem',
              }}>
                🔥 最划算
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 900, fontSize: '1.25rem', marginBottom: '4px' }}>年度会员</h3>
                <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>一次订阅，全年无忧</p>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: 900, fontSize: '2.5rem' }}>¥{plans.yearly.price}</span>
                <span style={{ color: '#6B7280', fontSize: '1rem' }}> / {plans.yearly.period}</span>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <span style={{
                  padding: '4px 10px',
                  backgroundColor: '#A3E635',
                  border: '2px solid black',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                }}>
                  {plans.yearly.discount}
                </span>
                <span style={{ color: '#6B7280', fontSize: '0.75rem', marginLeft: '8px' }}>
                  约 ¥{plans.yearly.monthlyEquivalent}/月
                </span>
              </div>
              <div style={{
                padding: '8px 16px',
                backgroundColor: selectedPlan === 'yearly' ? '#10B981' : '#E5E7EB',
                color: selectedPlan === 'yearly' ? 'white' : 'black',
                border: '2px solid black',
                borderRadius: '8px',
                textAlign: 'center',
                fontWeight: 700,
              }}>
                {selectedPlan === 'yearly' ? '已选择' : '选择此方案'}
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div style={{
            backgroundColor: '#F9FAFB',
            border: '3px solid black',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '4px 4px 0 rgba(0,0,0,1)',
          }}>
            <h3 style={{ fontWeight: 900, fontSize: '1.25rem', marginBottom: '8px' }}>
              选择支付方式
            </h3>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '24px' }}>
              支付 ¥{selectedPlan === 'monthly' ? plans.monthly.price : plans.yearly.price} 即可开通{selectedPlan === 'monthly' ? '月度' : '年度'}会员
            </p>
            
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {/* Alipay Button */}
              <button
                onClick={() => handlePayment('alipay')}
                style={{
                  flex: '1',
                  minWidth: '200px',
                  padding: '16px 24px',
                  backgroundColor: '#1677FF',
                  color: 'white',
                  border: '3px solid black',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0 rgba(0,0,0,1)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(2px, 2px)'
                  e.currentTarget.style.boxShadow = '2px 2px 0 rgba(0,0,0,1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate(0, 0)'
                  e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0,0,0,1)'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.422 15.358c-1.46-.456-2.882-.963-4.261-1.521a14.91 14.91 0 0 0 1.857-4.176H14.58V8.406h5.111V7.234H14.58V4.5h-2.063s-.02.102-.02.177v2.557H7.31v1.172h5.185v1.255H8.107v1.172h8.47a12.462 12.462 0 0 1-1.295 2.748 45.473 45.473 0 0 1-5.273-1.593A9.18 9.18 0 0 0 3.818 18.5H2v1.5h20v-1.5h-.058c-.176-.899-.534-2.237-2.52-3.142z"/>
                </svg>
                支付宝支付
              </button>

              {/* WeChat Pay Button */}
              <button
                onClick={() => handlePayment('wechat')}
                style={{
                  flex: '1',
                  minWidth: '200px',
                  padding: '16px 24px',
                  backgroundColor: '#07C160',
                  color: 'white',
                  border: '3px solid black',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0 rgba(0,0,0,1)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(2px, 2px)'
                  e.currentTarget.style.boxShadow = '2px 2px 0 rgba(0,0,0,1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate(0, 0)'
                  e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0,0,0,1)'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045c.134 0 .24-.111.24-.247 0-.06-.023-.12-.04-.177l-.327-1.233a.49.49 0 0 1 .177-.554C23.063 18.369 24 16.582 24 14.61c0-3.372-3.263-5.75-7.062-5.752zm-2.388 2.61c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                </svg>
                微信支付
              </button>
            </div>

            <p style={{ 
              marginTop: '20px', 
              fontSize: '0.75rem', 
              color: '#9CA3AF',
              textAlign: 'center',
            }}>
              💡 支付完成后，会员权益将立即生效。如有问题请联系客服。
            </p>
          </div>
        </div>
      )}

      {/* Payment Tab */}
      {activeTab === 'payment' && (
        <div style={{
          backgroundColor: 'white',
          border: '3px solid black',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '6px 6px 0 rgba(0,0,0,1)',
          maxWidth: '600px',
        }}>
          <h2 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '24px' }}>
            支付方式管理
          </h2>
          
          <div style={{
            padding: '32px',
            backgroundColor: '#F9FAFB',
            border: '2px dashed #D1D5DB',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💳</div>
            <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>
              暂无绑定的支付方式
            </p>
            <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
              在升级会员时，您可以选择支付宝或微信支付
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
