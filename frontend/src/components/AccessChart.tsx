import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';
import api from '../api/client';

interface StatsData {
  date: string;
  clicks: number;
}

interface AccessChartProps {
  urlId: string;
}

export default function AccessChart({ urlId }: AccessChartProps) {
  const [stats, setStats] = useState<StatsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats(showLoader = true) {
      if (showLoader) setLoading(true);
      try {
        const { data } = await api.get(`/urls/${urlId}/stats?days=7`);
        setStats(data);
      } catch {
        console.error('Failed to fetch stats');
      } finally {
        if (showLoader) setLoading(false);
      }
    }

    fetchStats();

    const interval = setInterval(() => fetchStats(false), 3000);
    return () => clearInterval(interval);
  }, [urlId]);

  function formatDate(dateStr: string) {
    const [, month, day] = dateStr.split('-');
    return `${day}/${month}`;
  }

  if (loading) {
    return (
      <div className="h-36 flex items-center justify-center text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
          Carregando estatísticas...
        </div>
      </div>
    );
  }

  const hasClicks = stats.some((s) => s.clicks > 0);

  if (!hasClicks) {
    return (
      <div className="h-32 flex flex-col items-center justify-center text-gray-400 mt-2 bg-gray-50/50 rounded-xl">
        <TrendingUp className="w-6 h-6 mb-2 text-gray-300" />
        <span className="text-xs font-medium">Nenhum acesso nos últimos 7 dias</span>
      </div>
    );
  }

  return (
    <div className="h-40 mt-3 p-3 bg-gray-50/50 rounded-xl">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stats} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id={`barGradient-${urlId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            labelFormatter={(label) => formatDate(String(label))}
            formatter={(value) => [value, 'Cliques']}
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '10px',
              color: '#f3f4f6',
              fontSize: '12px',
              padding: '8px 12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
            itemStyle={{ color: '#2dd4bf' }}
            labelStyle={{ color: '#d1d5db', marginBottom: '4px' }}
            cursor={{ fill: 'rgba(13, 148, 136, 0.06)' }}
          />
          <Bar dataKey="clicks" radius={[6, 6, 0, 0]}>
            {stats.map((_, index) => (
              <Cell key={`cell-${index}`} fill={`url(#barGradient-${urlId})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
