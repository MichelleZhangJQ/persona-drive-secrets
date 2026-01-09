"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AuthHeader } from "@/components/AuthHeader";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { makeTr } from "@/lib/i18n/simple-tr";
import ordersEn from "@/messages/orders/en.json";
import ordersZh from "@/messages/orders/zh.json";
import { ArrowLeft, Loader2 } from "lucide-react";

type Locale = "en" | "zh";
type OrderStatus = "paid" | "pending" | "canceled" | "failed" | "refunded";

type OrderItem = {
  id: string;
  item_type: "report" | "membership";
  item_id: string;
  title: string | null;
  quantity: number | null;
  unit_price: number | null;
  months: number | null;
  report_index: number | null;
  granted_expires_at: string | null;
  created_at: string | null;
};

type OrderRow = {
  id: string;
  status: OrderStatus;
  currency: string | null;
  subtotal: number | null;
  credits_applied: number | null;
  amount_due: number | null;
  payment_provider: string | null;
  provider_order_id: string | null;
  created_at: string | null;
  paid_at: string | null;
  order_items?: OrderItem[];
};

const STATUS_TABS: Array<{ key: "all" | OrderStatus }> = [
  { key: "all" },
  { key: "paid" },
  { key: "pending" },
  { key: "canceled" },
  { key: "failed" },
];

function formatProviderLabel(provider: string | null) {
  if (!provider) return "—";
  const p = String(provider);
  const isLemon =
    p.toLowerCase() === "lemon_squeezy" ||
    p.toLowerCase() === "lemonsqueezy" ||
    p.toLowerCase() === "lemon squeezy";
  return isLemon ? `${p} (Demo Mode)` : p;
}

export default function OrdersPage() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const params = useParams();

  const locale: Locale =
    (typeof (params as any)?.locale === "string" ? (params as any).locale : "en") as Locale;
  const tr = useMemo(() => makeTr({ en: ordersEn, zh: ordersZh, locale }), [locale]);

  const withLocale = useCallback(
    (href: string) => {
      if (!href) return `/${locale}`;
      if (href.startsWith("http") || href.startsWith("mailto:")) return href;
      if (href.startsWith(`/${locale}`)) return href;
      if (href.startsWith("/")) return `/${locale}${href}`;
      return `/${locale}/${href}`;
    },
    [locale]
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | OrderStatus>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("auth");
        setLoading(false);
        return;
      }

      const sinceIso = new Date(Date.now() - 1000 * 60 * 60 * 24 * 183).toISOString();
      const { data, error: queryError } = await supabase
        .from("orders")
        .select(
          `
          id, status, currency, subtotal, credits_applied, amount_due, payment_provider,
          provider_order_id, created_at, paid_at,
          order_items (
            id, item_type, item_id, title, quantity, unit_price, months, report_index, granted_expires_at, created_at
          )
        `
        )
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;
      setOrders((data as OrderRow[]) ?? []);
    } catch {
      setError("loadFailed");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  const cancelOrder = useCallback(
    async (orderId: string) => {
      setCancelingId(orderId);
      try {
        const { error: updateError } = await supabase
          .from("orders")
          .update({ status: "canceled" })
          .eq("id", orderId);
        if (updateError) throw updateError;
        await fetchOrders();
      } catch {
        setError("cancelFailed");
      } finally {
        setCancelingId(null);
      }
    },
    [supabase, fetchOrders]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-slate-400" />
        <p className="ml-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
          {tr("orders.loading.title")}
        </p>
      </div>
    );
  }

  if (error === "auth") {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <AuthHeader />
        <main className="max-w-4xl mx-auto px-6 py-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            {tr("orders.auth.signIn")}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AuthHeader />
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
              {tr("orders.header.title")}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">
              {tr("orders.header.subtitle")}
            </p>
          </div>
          <Link
            href={withLocale("/")}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-xs font-black uppercase tracking-[0.2em]"
          >
            <ArrowLeft size={14} /> {tr("orders.header.back")}
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const labelKey = tab.key === "all" ? "orders.tabs.all" : `orders.tabs.${tab.key}`;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                }`}
              >
                {tr(labelKey)}
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 text-[11px] font-medium">
            {tr(`orders.errors.${error}`)}
          </div>
        ) : null}

        {filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600">
            <h2 className="text-lg font-black">{tr("orders.empty.title")}</h2>
            <p className="mt-2 text-[11px] font-medium">{tr("orders.empty.body")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const isExpanded = !!expanded[order.id];
              const statusKey = `orders.status.${order.status}`;
              const items = order.order_items ?? [];

              return (
                <div key={order.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {tr("orders.card.orderId")} • {order.id.slice(0, 8)}
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-sm font-bold text-slate-800">
                        <span className="uppercase">{tr(statusKey)}</span>
                        {order.payment_provider ? (
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {tr("orders.card.provider")}: {formatProviderLabel(order.payment_provider)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 font-medium">
                      <span>
                        {tr("orders.card.created")}:{" "}
                        <strong>{order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}</strong>
                      </span>
                      <span>
                        {tr("orders.card.paidAt")}:{" "}
                        <strong>{order.paid_at ? new Date(order.paid_at).toLocaleDateString() : "—"}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px] text-slate-600 font-medium">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {tr("orders.card.subtotal")}
                      </div>
                      <div className="mt-1 font-bold text-slate-900">
                        ${Number(order.subtotal || 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {tr("orders.card.credits")}
                      </div>
                      <div className="mt-1 font-bold text-slate-900">
                        ${Number(order.credits_applied || 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {tr("orders.card.due")}
                      </div>
                      <div className="mt-1 font-bold text-slate-900">
                        ${Number(order.amount_due || 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {tr("orders.card.provider")}
                      </div>
                      <div className="mt-1 font-bold text-slate-900">
                        {formatProviderLabel(order.payment_provider)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => setExpanded((prev) => ({ ...prev, [order.id]: !isExpanded }))}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700"
                    >
                      {isExpanded ? tr("orders.card.hideItems") : tr("orders.card.itemsTitle")}
                    </button>

                    {order.status === "pending" ? (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        disabled={cancelingId === order.id}
                        className="ml-auto text-[10px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-700"
                      >
                        {cancelingId === order.id ? tr("orders.card.canceling") : tr("orders.card.cancel")}
                      </button>
                    ) : (
                      <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {tr("orders.card.noRefunds")}
                      </span>
                    )}
                  </div>

                  {isExpanded ? (
                    <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
                      {items.length === 0 ? (
                        <div className="text-[11px] text-slate-500 font-medium">—</div>
                      ) : (
                        items.map((item) => (
                          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  {item.item_type === "membership"
                                    ? tr("orders.item.membership")
                                    : tr("orders.item.report")}
                                </div>
                                <div className="mt-1 text-sm font-bold text-slate-800">
                                  {item.title ?? item.item_id}
                                </div>
                              </div>
                              <div className="text-[11px] text-slate-600 font-medium flex gap-4">
                                <span>
                                  {tr("orders.item.quantity")}: <strong>{item.quantity ?? 1}</strong>
                                </span>
                                <span>
                                  {tr("orders.item.price")}:{" "}
                                  <strong>${Number(item.unit_price || 0).toFixed(2)}</strong>
                                </span>
                                {item.months ? (
                                  <span>
                                    {tr("orders.item.months")}: <strong>{item.months}</strong>
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="mt-2 text-[11px] text-slate-500">
                              {tr("orders.item.expiresAt")}:{" "}
                              <strong>
                                {item.granted_expires_at
                                  ? new Date(item.granted_expires_at).toLocaleDateString()
                                  : "—"}
                              </strong>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}