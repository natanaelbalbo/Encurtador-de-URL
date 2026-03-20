import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
    async function fetchStats() {
      setLoading(true);
      try {
        const { data } = await api.get(`/urls/${urlId}/stats?days=7`);
        setStats(data);
      } catch {
        console.error('Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [urlId]);

  function formatDate(dateStr: string) {
    const [, month, day] = dateStr.split('-');
    return `${day}/${month}`;
  }

  if (loading) {
    return <div className="h-32 flex items-center justify-center text-xs text-gray-400">Carregando...</div>;
  }

  const hasClicks = stats.some((s) => s.clicks > 0);

  if (!hasClicks) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-gray-400">
        Nenhum acesso nos últimos 7 dias
      </div>
    );
  }

  return (
    <div className="h-36 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stats} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip
            labelFormatter={(label) => formatDate(String(label))}
            formatter={(value) => [value, 'Cliques']}
          />
          <Bar dataKey="clicks" fill="#6366f1" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
