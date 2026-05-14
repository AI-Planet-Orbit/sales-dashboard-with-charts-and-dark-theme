import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from 'recharts';

type Entry = {
  id: string;
  month: string;
  collectionEntry: number;
  date: string;
  createdAt: string;
};

type FormState = {
  month: string;
  collectionEntry: string;
  date: string;
};

const STORAGE_KEY = 'sales-dashboard-entries-v1';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const COLORS = ['#9E7FFF', '#38bdf8', '#f472b6', '#10b981', '#f59e0b', '#fb7185'];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateLabel(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function safeParseEntries(raw: string | null): Entry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is Entry => {
      return (
        item &&
        typeof item.id === 'string' &&
        typeof item.month === 'string' &&
        typeof item.collectionEntry === 'number' &&
        typeof item.date === 'string' &&
        typeof item.createdAt === 'string'
      );
    });
  } catch {
    return [];
  }
}

function loadInitialEntries(): Entry[] {
  if (typeof window === 'undefined') return [];
  return safeParseEntries(window.localStorage.getItem(STORAGE_KEY));
}

function App() {
  const [entries, setEntries] = useState<Entry[]>(loadInitialEntries);
  const [form, setForm] = useState<FormState>({
    month: '',
    collectionEntry: '',
    date: '',
  });
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const stats = useMemo(() => {
    const total = entries.reduce((sum, item) => sum + item.collectionEntry, 0);
    const avg = entries.length ? total / entries.length : 0;
    const topMonth = entries.reduce<Record<string, number>>((acc, item) => {
      acc[item.month] = (acc[item.month] ?? 0) + item.collectionEntry;
      return acc;
    }, {});
    const leadingMonth =
      Object.entries(topMonth).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

    return {
      total,
      avg,
      leadingMonth,
      count: entries.length,
    };
  }, [entries]);

  const monthlyChartData = useMemo(() => {
    const grouped = entries.reduce<Record<string, number>>((acc, item) => {
      acc[item.month] = (acc[item.month] ?? 0) + item.collectionEntry;
      return acc;
    }, {});

    return MONTHS.map((month) => ({
      month,
      collection: grouped[month] ?? 0,
    }));
  }, [entries]);

  const timelineData = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((item) => ({
        label: formatDateLabel(item.date),
        collection: item.collectionEntry,
        month: item.month,
      }));
  }, [entries]);

  const pieData = useMemo(() => {
    const grouped = entries.reduce<Record<string, number>>((acc, item) => {
      acc[item.month] = (acc[item.month] ?? 0) + item.collectionEntry;
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [entries]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.month || !form.collectionEntry || !form.date) {
      setMessage('Please fill all fields before saving.');
      return;
    }

    const value = Number(form.collectionEntry);
    if (Number.isNaN(value) || value <= 0) {
      setMessage('Collection entry must be a valid positive number.');
      return;
    }

    const newEntry: Entry = {
      id: crypto.randomUUID(),
      month: form.month,
      collectionEntry: value,
      date: form.date,
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) => [newEntry, ...prev]);
    setForm({ month: '', collectionEntry: '', date: '' });
    setMessage('Entry saved successfully.');
  }

  function clearAll() {
    setEntries([]);
    setMessage('All stored entries cleared.');
  }

  return (
    <div className="min-h-screen bg-[#171717] text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#262626] to-[#1f1f1f] p-6 shadow-2xl shadow-black/40 md:p-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#38bdf8]">
                Sales Intelligence
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
                Structured dashboard driven by your input
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 md:text-lg">
                Add monthly collection data using the form below. The dashboard updates instantly
                and the data is stored locally in your browser.
              </p>
            </div>

            <div className="grid min-w-56 grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Stat label="Entries" value={stats.count.toString()} />
              <Stat label="Total" value={formatCurrency(stats.total)} />
              <Stat label="Average" value={formatCurrency(stats.avg)} />
              <Stat label="Top Month" value={stats.leadingMonth} />
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <section className="rounded-3xl border border-white/10 bg-[#262626] p-6 shadow-2xl shadow-black/30">
            <h2 className="text-2xl font-semibold">Add collection entry</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Enter a month, collection value, and date. The system will timestamp the record
              automatically.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Field label="Month">
                <select
                  value={form.month}
                  onChange={(e) => setForm((prev) => ({ ...prev, month: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-[#171717] px-4 py-3 text-white outline-none transition focus:border-[#9E7FFF] focus:ring-2 focus:ring-[#9E7FFF]/30"
                >
                  <option value="">Select month</option>
                  {MONTHS.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Collection entry">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.collectionEntry}
                  onChange={(e) => setForm((prev) => ({ ...prev, collectionEntry: e.target.value }))}
                  placeholder="e.g. 12500"
                  className="w-full rounded-2xl border border-white/10 bg-[#171717] px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-[#9E7FFF] focus:ring-2 focus:ring-[#9E7FFF]/30"
                />
              </Field>

              <Field label="Date">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-[#171717] px-4 py-3 text-white outline-none transition focus:border-[#9E7FFF] focus:ring-2 focus:ring-[#9E7FFF]/30"
                />
              </Field>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-gradient-to-r from-[#9E7FFF] to-[#38bdf8] px-4 py-3 font-medium text-white transition hover:scale-[1.01] hover:shadow-lg hover:shadow-[#9E7FFF]/20 active:scale-[0.99]"
                >
                  Save entry
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-zinc-200 transition hover:bg-white/10"
                >
                  Clear
                </button>
              </div>

              {message ? (
                <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                  {message}
                </p>
              ) : null}
            </form>
          </section>

          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard title="Total Collection" value={formatCurrency(stats.total)} accent="from-[#9E7FFF] to-[#38bdf8]" />
              <KpiCard title="Entries Logged" value={stats.count.toString()} accent="from-[#38bdf8] to-[#10b981]" />
              <KpiCard title="Average Entry" value={formatCurrency(stats.avg)} accent="from-[#f472b6] to-[#9E7FFF]" />
              <KpiCard title="Leading Month" value={stats.leadingMonth} accent="from-[#f59e0b] to-[#f472b6]" />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <ChartCard title="Monthly Collection" subtitle="Grouped by month">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="month" tick={{ fill: '#A3A3A3', fontSize: 12 }} interval={1} />
                    <YAxis tick={{ fill: '#A3A3A3', fontSize: 12 }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      contentStyle={{
                        background: '#171717',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 16,
                        color: '#fff',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="collection" radius={[14, 14, 0, 0]}>
                      {monthlyChartData.map((entry, index) => (
                        <Cell key={entry.month} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Timeline View" subtitle="Ordered by saved timestamp">
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9E7FFF" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#9E7FFF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="label" tick={{ fill: '#A3A3A3', fontSize: 12 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#A3A3A3', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: '#171717',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 16,
                        color: '#fff',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="collection"
                      stroke="#9E7FFF"
                      strokeWidth={3}
                      fill="url(#timelineFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Collection Trend" subtitle="Line chart for movement over time">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="label" tick={{ fill: '#A3A3A3', fontSize: 12 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#A3A3A3', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: '#171717',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 16,
                        color: '#fff',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Line
                      type="monotone"
                      dataKey="collection"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Month Share" subtitle="Distribution across saved months">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={78}
                      outerRadius={120}
                      paddingAngle={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#171717',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 16,
                        color: '#fff',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#262626] p-6 shadow-2xl shadow-black/30">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Saved entries</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    The latest records stored in local storage.
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                  {entries.length} records
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5 text-left text-sm text-zinc-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Month</th>
                      <th className="px-4 py-3 font-medium">Collection</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-sm">
                    {entries.length ? (
                      entries.map((entry) => (
                        <tr key={entry.id} className="bg-[#171717]">
                          <td className="px-4 py-3">{entry.month}</td>
                          <td className="px-4 py-3">{formatCurrency(entry.collectionEntry)}</td>
                          <td className="px-4 py-3">{formatDateLabel(entry.date)}</td>
                          <td className="px-4 py-3 text-zinc-400">
                            {formatDateLabel(entry.createdAt)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-6 text-center text-zinc-500" colSpan={4}>
                          No entries yet. Add your first record using the form.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/20 p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

function KpiCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#262626] p-5 shadow-xl shadow-black/20">
      <div className={`mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r ${accent}`} />
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#262626] p-6 shadow-2xl shadow-black/30">
      <div className="mb-5">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

export default App;
