import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownRight, ArrowUpRight, MessagesSquare, Send, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Metric = "conversations" | "leads" | "handoffs" | "followups";

const METRIC_LABEL: Record<Metric, string> = {
  conversations: "Conversations",
  leads: "Leads captured",
  handoffs: "Human handoffs",
  followups: "Follow-ups sent",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Row = { created_at: string | null; status?: string | null };

function bucketByYearMonth(rows: Row[], dateKey: keyof Row = "created_at") {
  const map = new Map<number, number[]>();
  for (const r of rows) {
    const d = r[dateKey];
    if (!d) continue;
    const dt = new Date(d as string);
    const y = dt.getFullYear();
    const m = dt.getMonth();
    if (!map.has(y)) map.set(y, new Array(12).fill(0));
    map.get(y)![m] += 1;
  }
  return map;
}

function toChartSeries(buckets: Map<number, number[]>) {
  const years = Array.from(buckets.keys()).sort();
  return MONTHS.map((label, i) => {
    const point: Record<string, number | string> = { month: label };
    for (const y of years) point[String(y)] = buckets.get(y)![i];
    return point;
  });
}

const YEAR_COLORS = ["hsl(var(--muted-foreground))", "hsl(var(--primary) / 0.55)", "hsl(var(--primary))"];

export default function Dashboard() {
  useEffect(() => {
    document.title = "Bella · Dashboard";
  }, []);

  const [metric, setMetric] = useState<Metric>("conversations");
  const [conversations, setConversations] = useState<Row[]>([]);
  const [customers, setCustomers] = useState<Row[]>([]);
  const [followups, setFollowups] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [c, cu, f] = await Promise.all([
        supabase.from("conversations").select("started_at, status").limit(5000),
        supabase.from("customers").select("created_at").limit(5000),
        supabase.from("followups").select("created_at, status").limit(5000),
      ]);
      if (!alive) return;
      setConversations(((c.data as { started_at: string | null; status: string | null }[]) ?? []).map((r) => ({ created_at: r.started_at, status: r.status })));
      setCustomers((cu.data as Row[]) ?? []);
      setFollowups((f.data as Row[]) ?? []);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handoffs = useMemo(
    () => conversations.filter((c) => c.status === "handoff"),
    [conversations],
  );

  const sourceRows: Row[] = useMemo(() => {
    switch (metric) {
      case "conversations":
        return conversations;
      case "leads":
        return customers;
      case "handoffs":
        return handoffs;
      case "followups":
        return followups;
    }
  }, [metric, conversations, customers, handoffs, followups]);

  const buckets = useMemo(() => bucketByYearMonth(sourceRows), [sourceRows]);
  const chartData = useMemo(() => toChartSeries(buckets), [buckets]);
  const years = useMemo(() => Array.from(buckets.keys()).sort(), [buckets]);

  const kpis = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const prev = y - 1;
    const calc = (rows: Row[]) => {
      const cur = rows.filter((r) => r.created_at && new Date(r.created_at).getFullYear() === y).length;
      const last = rows.filter((r) => r.created_at && new Date(r.created_at).getFullYear() === prev).length;
      const delta = last === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - last) / last) * 100);
      return { cur, last, delta };
    };
    return {
      conversations: calc(conversations),
      leads: calc(customers),
      handoffs: calc(handoffs),
      followups: calc(followups),
    };
  }, [conversations, customers, handoffs, followups]);

  const cards: { key: Metric; icon: React.ElementType; label: string }[] = [
    { key: "conversations", icon: MessagesSquare, label: "Conversations" },
    { key: "leads", icon: UserPlus, label: "New leads" },
    { key: "handoffs", icon: Users, label: "Human handoffs" },
    { key: "followups", icon: Send, label: "Follow-ups sent" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-8 py-8">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Year-over-year activity across Bella.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ key, icon: Icon, label }) => {
          const k = kpis[key];
          const positive = k.delta >= 0;
          return (
            <Card
              key={key}
              role="button"
              onClick={() => setMetric(key)}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                metric === key && "ring-2 ring-primary/40 border-primary/30",
              )}
            >
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-semibold tabular-nums text-foreground">{loading ? "—" : k.cur.toLocaleString()}</p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
                      positive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700",
                    )}
                  >
                    {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(k.delta)}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  vs {k.last.toLocaleString()} in {new Date().getFullYear() - 1}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-semibold">{METRIC_LABEL[metric]} · Year over year</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Monthly totals overlaid by year.</p>
          </div>
          <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
            <TabsList>
              <TabsTrigger value="conversations">Conv.</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger value="handoffs">Handoffs</TabsTrigger>
              <TabsTrigger value="followups">Follow-ups</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="h-[340px] w-full">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
            ) : years.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No data yet for {METRIC_LABEL[metric].toLowerCase()}.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--background))",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {years.map((y, i) => (
                    <Line
                      key={y}
                      type="monotone"
                      dataKey={String(y)}
                      stroke={YEAR_COLORS[(YEAR_COLORS.length - years.length + i + YEAR_COLORS.length) % YEAR_COLORS.length]}
                      strokeWidth={y === Math.max(...years) ? 2.5 : 1.75}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
