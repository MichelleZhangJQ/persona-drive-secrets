'use client'

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { checkUserStaffStatus } from '@/utils/auth-logic';
import { AuthHeader } from '@/components/AuthHeader';

// --- COMPONENT IMPORTS ---
import AdminStatusPanel from './_components/AdminStatusPanel';
import AdminUserPanel from './_components/AdminUserPanel';
import AdminPromoPanel from './_components/AdminPromoPanel';
import UserProfilePanel from './_components/UserProfilePanel';

import {
  Loader2,
  ShieldCheck,
  User,
  LayoutDashboard,
  Lock,
  TicketPercent,
  LogOut,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

type TabType = 'profile' | 'password' | 'users' | 'promos' | 'status';
type Locale = 'en' | 'zh';
type LocalizedText = { en: string; zh: string };

const I18N = {
  sidebar: {
    title: { en: 'Account', zh: '账户' },
    console: { en: 'Console v3.0', zh: '控制台 v3.0' },
    personal: { en: 'Personal', zh: '个人' },
    admin: { en: 'Administration', zh: '管理' },

    myIdentity: { en: 'My Identity', zh: '我的身份' },
    password: { en: 'Password', zh: '密码' },
    userDatabase: { en: 'User Database', zh: '用户数据库' },
    promotions: { en: 'Promotions', zh: '优惠活动' },
    staffRegistry: { en: 'Staff Registry', zh: '员工注册表' },

    returnDashboard: { en: 'Return to Dashboard', zh: '返回仪表盘' },
    logout: { en: 'Logout', zh: '退出登录' },
  },

  header: {
    section: { en: 'Section', zh: '模块' },
    mode: { en: 'Mode', zh: '模式' },
  },

  passwordPanel: {
    title: { en: 'Update Password', zh: '更新密码' },
    subtitle: { en: 'You must verify your identity to change keys.', zh: '你需要验证身份才能修改密钥。' },

    currentPassword: { en: 'Current Password', zh: '当前密码' },
    newPassword: { en: 'New Password', zh: '新密码' },
    confirmPassword: { en: 'Confirm Password', zh: '确认密码' },
    minChars: { en: 'Min 6 characters', zh: '至少 6 个字符' },

    cta: { en: 'Update Security Keys', zh: '更新安全密钥' },
    success: { en: 'Password Synchronized', zh: '密码已同步' },

    errMismatch: { en: 'New passwords do not match.', zh: '两次输入的新密码不一致。' },
    errOldIncorrect: { en: 'The old password you entered is incorrect.', zh: '你输入的旧密码不正确。' },
    errUnexpected: { en: 'An unexpected error occurred.', zh: '发生了意外错误。' },
  },

  restricted: {
    title: { en: 'Admin Privileges Required', zh: '需要管理员权限' },
    subtitle: { en: 'This section is restricted to higher-level administrators.', zh: '此区域仅对更高权限管理员开放。' },
  },
} as const;

export default function ProfilePage() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const params = useParams();
  const locale: Locale = (typeof (params as any)?.locale === 'string' ? (params as any).locale : 'en') as Locale;

  const t = useMemo(() => {
    return (x: LocalizedText) => (locale === 'zh' ? x.zh : x.en);
  }, [locale]);

  const withLocale = useCallback(
    (href: string) => {
      if (!href) return `/${locale}`;
      if (href.startsWith('http') || href.startsWith('mailto:')) return href;
      const normalized = href.startsWith('/') ? href : `/${href}`;
      return `/${locale}${normalized}`;
    },
    [locale]
  );

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [staffRole, setStaffRole] = useState<string | null>(null);

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Password Reset States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUser(authUser);
          const role = await checkUserStaffStatus(supabase);
          setStaffRole(role);
        }
      } catch (err) {
        console.error("Initialization Error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [supabase]);

  const isStaff = staffRole === 'admin' || staffRole === 'assistant';
  const isAdmin = staffRole === 'admin';

  const tabLabel = (tab: TabType) => {
    switch (tab) {
      case 'profile': return t(I18N.sidebar.myIdentity);
      case 'password': return t(I18N.sidebar.password);
      case 'users': return t(I18N.sidebar.userDatabase);
      case 'promos': return t(I18N.sidebar.promotions);
      case 'status': return t(I18N.sidebar.staffRegistry);
      default: return tab;
    }
  };

  // Handle Logout and Redirect
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(withLocale('/'));
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetSuccess(false);
    setErrorMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg(t(I18N.passwordPanel.errMismatch));
      setResetLoading(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (authError) {
        setErrorMsg(t(I18N.passwordPanel.errOldIncorrect));
        setResetLoading(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setResetSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || t(I18N.passwordPanel.errUnexpected));
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-slate-300" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AuthHeader />
      <div className="flex">
        {/* LEFT SIDEBAR */}
        <aside className="w-64 border-r border-slate-200 bg-white flex flex-col sticky top-[64px] h-[calc(100vh-64px)]">
        <div className="p-8">
          <h1 className="text-2xl font-black tracking-tighter text-slate-900">{t(I18N.sidebar.title)}</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t(I18N.sidebar.console)}</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <div className="pb-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {t(I18N.sidebar.personal)}
          </div>

          <SidebarItem
            icon={<User size={18} />}
            label={t(I18N.sidebar.myIdentity)}
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          />
          <SidebarItem
            icon={<KeyRound size={18} />}
            label={t(I18N.sidebar.password)}
            active={activeTab === 'password'}
            onClick={() => setActiveTab('password')}
          />

          {isStaff && (
            <>
              <div className="pt-8 pb-2 px-4 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                {t(I18N.sidebar.admin)}
              </div>

              <SidebarItem
                icon={<LayoutDashboard size={18} />}
                label={t(I18N.sidebar.userDatabase)}
                active={activeTab === 'users'}
                onClick={() => setActiveTab('users')}
              />

              {isAdmin && (
                <>
                  <SidebarItem
                    icon={<TicketPercent size={18} />}
                    label={t(I18N.sidebar.promotions)}
                    active={activeTab === 'promos'}
                    onClick={() => setActiveTab('promos')}
                  />
                  <SidebarItem
                    icon={<ShieldCheck size={18} />}
                    label={t(I18N.sidebar.staffRegistry)}
                    active={activeTab === 'status'}
                    onClick={() => setActiveTab('status')}
                  />
                </>
              )}
            </>
          )}
        </nav>

        {/* BOTTOM MENU SECTION */}
        <div className="px-4 py-4 border-t border-slate-100 space-y-1">
          <Link
            href={withLocale('/')}
            className="flex items-center gap-3 text-indigo-600 hover:bg-indigo-50 transition-colors px-4 py-3 rounded-2xl text-sm font-bold"
          >
            <LayoutDashboard size={18} /> {t(I18N.sidebar.returnDashboard)}
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-slate-400 hover:text-red-500 transition-colors px-4 py-3 rounded-2xl w-full text-sm font-bold"
          >
            <LogOut size={18} /> {t(I18N.sidebar.logout)}
          </button>
        </div>
      </aside>

        <main className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">

          <header className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">{t(I18N.header.section)}</h2>
              <p className="text-2xl font-bold text-slate-900 capitalize">
                {tabLabel(activeTab)}
              </p>
            </div>

            {isStaff && (
              <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-2xl flex items-center gap-2">
                <ShieldCheck size={16} className="text-indigo-600" />
                <span className="text-[10px] font-black uppercase text-indigo-700">
                  {staffRole} {t(I18N.header.mode)}
                </span>
              </div>
            )}
          </header>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeTab === 'profile' && <UserProfilePanel />}

            {activeTab === 'password' && (
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 max-w-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-slate-900 rounded-2xl text-white">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{t(I18N.passwordPanel.title)}</h3>
                    <p className="text-xs text-slate-500">{t(I18N.passwordPanel.subtitle)}</p>
                  </div>
                </div>

                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                      {t(I18N.passwordPanel.currentPassword)}
                    </label>
                    <input
                      type="password"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-slate-900/5 outline-none transition-all"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                        {t(I18N.passwordPanel.newPassword)}
                      </label>
                      <input
                        type="password"
                        required
                        placeholder={t(I18N.passwordPanel.minChars)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-slate-900/5 outline-none transition-all"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                        {t(I18N.passwordPanel.confirmPassword)}
                      </label>
                      <input
                        type="password"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-slate-900/5 outline-none transition-all"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold uppercase tracking-wider">
                      <AlertCircle size={16} />
                      {errorMsg}
                    </div>
                  )}

                  <button
                    disabled={resetLoading || newPassword.length < 6}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {resetLoading ? <Loader2 className="animate-spin" size={16} /> : t(I18N.passwordPanel.cta)}
                  </button>
                </form>

                {resetSuccess && (
                  <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 animate-in zoom-in-95 duration-300">
                    <CheckCircle2 size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">{t(I18N.passwordPanel.success)}</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && isStaff && <AdminUserPanel />}

            {activeTab === 'promos' && (
              isAdmin ? <AdminPromoPanel /> : <AccessRestrictedView t={t} />
            )}

            {activeTab === 'status' && (
              isAdmin ? <AdminStatusPanel /> : <AccessRestrictedView t={t} />
            )}
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}

function AccessRestrictedView({ t }: { t: (x: LocalizedText) => string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 text-center max-w-2xl animate-in fade-in zoom-in-95">
      <Lock className="mx-auto text-slate-300 mb-4" size={32} />
      <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">{t(I18N.restricted.title)}</p>
      <p className="text-xs text-slate-500 mt-2">{t(I18N.restricted.subtitle)}</p>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all
        ${active
          ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}
      `}
    >
      {icon}
      {label}
    </button>
  );
}
