'use client'

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { checkUserStaffStatus } from '@/utils/auth-logic';

import {
  Shield,
  Loader2,
  Save,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Settings,
  Mail,
  Calendar,
  Fingerprint,
  FileText,
  CheckCircle2,
  XCircle,
  LayoutDashboard,
  ChevronRight,
} from 'lucide-react';

const INPUT_STYLE =
  "w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm disabled:bg-slate-100/50 disabled:text-slate-400 disabled:cursor-not-allowed";
const SECTION_CARD =
  "bg-white/70 backdrop-blur-sm p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4";

type Locale = 'en' | 'zh';
type LocalizedText = { en: string; zh: string };

const I18N = {
  loading: { en: 'Loading...', zh: '加载中...' },

  systemRegistry: { en: 'System Registry', zh: '系统注册表' },
  anonymousUser: { en: 'Anonymous User', zh: '匿名用户' },

  storeCredits: { en: 'Store Credits', zh: '账户余额' },
  membershipExpiry: { en: 'Membership Expiry', zh: '会员到期日' },
  noActiveSub: { en: 'No Active Sub', zh: '暂无订阅' },

  userEntitlements: { en: 'User Entitlements', zh: '用户权限' },
  report1: { en: 'Report 1', zh: '报告 1' },
  report2: { en: 'Report 2', zh: '报告 2' },
  report3: { en: 'Report 3', zh: '报告 3' },
  active: { en: 'Active', zh: '已开通' },
  inactive: { en: 'Inactive', zh: '未开通' },

  editPersonalProfile: { en: 'Edit Personal Profile', zh: '编辑个人资料' },

  publicDisplayName: { en: 'Public Display Name', zh: '公开显示名称' },
  contactEmail: { en: 'Contact Email', zh: '联系邮箱' },
  contactEmailHint: { en: 'Can differ from login email.', zh: '可与登录邮箱不同。' },
  phoneNumber: { en: 'Phone Number', zh: '手机号' },

  professionalRole: { en: 'Professional Role', zh: '职业角色' },
  industry: { en: 'Industry', zh: '行业' },
  primaryArchetype: { en: 'Primary Archetype', zh: '主要原型' },

  birthYear: { en: 'Birth Year', zh: '出生年份' },
  gender: { en: 'Gender', zh: '性别' },
  countryOfResidence: { en: 'Country of Residence', zh: '居住国家' },
  preferredLanguage: { en: 'Preferred Language', zh: '偏好语言' },

  updating: { en: 'Updating...', zh: '更新中...' },
  commitChanges: { en: 'Commit Changes', zh: '提交更改' },

  updatedOk: { en: 'Profile updated successfully.', zh: '资料更新成功。' },
  updateFailed: { en: 'Update failed: ', zh: '更新失败：' },

  returnToDashboard: { en: 'Return to Dashboard', zh: '返回仪表盘' },
} as const;

export default function UserProfilePanel() {
  const supabase = createBrowserSupabaseClient();
  const params = useParams();
  const locale: Locale = (typeof (params as any)?.locale === 'string' ? (params as any).locale : 'en') as Locale;

  const t = useMemo(() => {
    return (x: LocalizedText) => (locale === 'zh' ? x.zh : x.en);
  }, [locale]);

  const withLocale = useMemo(() => {
    return (href: string) => {
      if (!href) return `/${locale}`;
      if (href.startsWith('http') || href.startsWith('mailto:')) return href;
      const normalized = href.startsWith('/') ? href : `/${href}`;
      return `/${locale}${normalized}`;
    };
  }, [locale]);

  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        const role = await checkUserStaffStatus(supabase);
        setViewerRole(role || 'user');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await fetchProfile(user.email!);
      } catch (err) {
        console.error("Initialization Error:", err);
      } finally {
        setLoading(false);
      }
    }
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const fetchProfile = async (email: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', email.trim().toLowerCase())
        .maybeSingle();

      if (error) throw error;
      if (data) setTargetUser(data);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!targetUser) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: targetUser.display_name,
          phone_number: targetUser.phone_number,
          contact_email: targetUser.contact_email,
          professional_role: targetUser.professional_role,
          industry: targetUser.industry,
          primary_archetype: targetUser.primary_archetype,
          birth_year: parseInt(targetUser.birth_year) || null,
          gender: targetUser.gender,
          ethnicity: targetUser.ethnicity,
          location_country: targetUser.location_country,
          preferred_language: targetUser.preferred_language,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetUser.id);

      if (error) throw error;
      alert(t(I18N.updatedOk));
    } catch (err: any) {
      alert(t(I18N.updateFailed) + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !targetUser) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">{t(I18N.loading)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6 animate-in fade-in duration-500">
        {/* ✅ Move Return-to-Dashboard higher: put it right under header */}
        <div className="flex justify-end">
          <Link
            href={withLocale('/')}
            className="group inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-5 py-2.5 text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow"
          >
            <LayoutDashboard size={16} />
            {t(I18N.returnToDashboard)}
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* --- SECTION 1: READ ONLY / SYSTEM FIELDS --- */}
        <div className={SECTION_CARD}>
          <div className="flex flex-col md:flex-row gap-8 items-stretch">

            {/* Identity Section */}
            <div className="flex flex-col gap-1 min-w-[240px] md:border-r border-slate-100 pr-8">
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <Shield size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t(I18N.systemRegistry)}</span>
              </div>

              <h3 className="text-xl font-bold text-slate-800">
                {targetUser?.display_name || t(I18N.anonymousUser)}
              </h3>

              <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                <Mail size={12} className="text-slate-400" /> {targetUser?.email}
              </p>

              <p className="text-[10px] font-mono text-slate-400 mt-2 flex items-center gap-1.5">
                <Fingerprint size={10} /> {targetUser?.id?.slice(0, 18)}...
              </p>
            </div>

            {/* Stats & Entitlements Container */}
            <div className="flex-1 flex flex-col justify-between">
              {/* Row 1: Key Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 mb-6">
                <ReadOnlyStat
                  label={t(I18N.storeCredits)}
                  value={`$${targetUser?.store_credits || '0.00'}`}
                  icon={<CreditCard size={14} />}
                />
                <ReadOnlyStat
                  label={t(I18N.membershipExpiry)}
                  value={
                    targetUser?.sub_expires_at
                      ? new Date(targetUser.sub_expires_at).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')
                      : t(I18N.noActiveSub)
                  }
                  icon={<Calendar size={14} />}
                />
              </div>

              {/* Row 2: Modified User Entitlements */}
              <div className="pt-4 border-t border-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                  <FileText size={12} /> {t(I18N.userEntitlements)}
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <EntitlementItem label={t(I18N.report1)} active={!!targetUser?.has_access_report_1} t={t} />
                  <EntitlementItem label={t(I18N.report2)} active={!!targetUser?.has_access_report_2} t={t} />
                  <EntitlementItem label={t(I18N.report3)} active={!!targetUser?.has_access_report_3} t={t} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: EDITABLE / COLLAPSIBLE FIELDS --- */}
        <div className={`${SECTION_CARD} overflow-hidden transition-all duration-300`}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between group py-2"
          >
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-slate-400 group-hover:rotate-90 transition-transform duration-500" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                {t(I18N.editPersonalProfile)}
              </h2>
            </div>
            {isExpanded
              ? <ChevronUp size={20} className="text-slate-300" />
              : <ChevronDown size={20} className="text-slate-300" />
            }
          </button>

          {isExpanded && (
            <div className="pt-6 space-y-8 animate-in slide-in-from-top-2 duration-300">
              {/* Row 1: Basic Identity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label={t(I18N.publicDisplayName)}>
                  <input
                    className={INPUT_STYLE}
                    value={targetUser.display_name || ''}
                    onChange={e => setTargetUser({ ...targetUser, display_name: e.target.value })}
                  />
                </Field>

                <Field label={t(I18N.contactEmail)} hint={t(I18N.contactEmailHint)}>
                  <input
                    className={INPUT_STYLE}
                    value={targetUser.contact_email || ''}
                    onChange={e => setTargetUser({ ...targetUser, contact_email: e.target.value })}
                  />
                </Field>

                <Field label={t(I18N.phoneNumber)}>
                  <input
                    className={INPUT_STYLE}
                    value={targetUser.phone_number || ''}
                    onChange={e => setTargetUser({ ...targetUser, phone_number: e.target.value })}
                  />
                </Field>
              </div>

              {/* Row 2: Professional Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label={t(I18N.professionalRole)}>
                  <input
                    className={INPUT_STYLE}
                    value={targetUser.professional_role || ''}
                    onChange={e => setTargetUser({ ...targetUser, professional_role: e.target.value })}
                  />
                </Field>

                <Field label={t(I18N.industry)}>
                  <input
                    className={INPUT_STYLE}
                    value={targetUser.industry || ''}
                    onChange={e => setTargetUser({ ...targetUser, industry: e.target.value })}
                  />
                </Field>

                <Field label={t(I18N.primaryArchetype)}>
                  <input
                    className={INPUT_STYLE}
                    value={targetUser.primary_archetype || ''}
                    onChange={e => setTargetUser({ ...targetUser, primary_archetype: e.target.value })}
                  />
                </Field>
              </div>

              {/* Row 3: Demographics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Field label={t(I18N.birthYear)}>
                  <input
                    type="number"
                    className={INPUT_STYLE}
                    value={targetUser.birth_year || ''}
                    onChange={e => setTargetUser({ ...targetUser, birth_year: e.target.value })}
                  />
                </Field>

                <Field label={t(I18N.gender)}>
                  <input
                    className={INPUT_STYLE}
                    value={targetUser.gender || ''}
                    onChange={e => setTargetUser({ ...targetUser, gender: e.target.value })}
                  />
                </Field>

                <Field label={t(I18N.countryOfResidence)}>
                  <input
                    className={INPUT_STYLE}
                    value={targetUser.location_country || ''}
                    onChange={e => setTargetUser({ ...targetUser, location_country: e.target.value })}
                  />
                </Field>

                <Field label={t(I18N.preferredLanguage)}>
                  <input
                    className={INPUT_STYLE}
                    value={targetUser.preferred_language || ''}
                    onChange={e => setTargetUser({ ...targetUser, preferred_language: e.target.value })}
                  />
                </Field>
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-3 bg-slate-900 hover:bg-indigo-600 text-white px-10 py-3.5 rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all active:scale-[0.95] disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  {saving ? t(I18N.updating) : t(I18N.commitChanges)}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Helper UI Components ---

function EntitlementItem({
  label,
  active,
  t,
}: {
  label: string;
  active: boolean;
  t: (x: LocalizedText) => string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold text-slate-500">{label}</span>
      <div
        className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${
          active ? 'text-emerald-600' : 'text-slate-300'
        }`}
      >
        {active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
        {active ? t(I18N.active) : t(I18N.inactive)}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-slate-400 italic px-1">{hint}</p>}
    </div>
  );
}

function ReadOnlyStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        {icon} {label}
      </p>
      <p className="text-base font-bold text-slate-700">{value || '—'}</p>
    </div>
  );
}
