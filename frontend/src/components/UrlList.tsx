import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

interface Url {
  id: string;
  code: string;
  originalUrl: string;
  clickCount: number;
  createdAt: string;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UrlListProps {
  refreshKey: number;
}

export default function UrlList({ refreshKey }: UrlListProps) {
  const [urls, setUrls] = useState<Url[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchUrls = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/urls?page=${page}&limit=10`);
      setUrls(data.data);
      setMeta(data.meta);
    } catch {
      console.error('Failed to fetch URLs');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls, refreshKey]);

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir esta URL?')) return;
    try {
      await api.delete(`/urls/${id}`);
      fetchUrls();
    } catch {
      console.error('Failed to delete URL');
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  if (loading && urls.length === 0) {
    return <div className="text-center py-8 text-gray-500">Carregando...</div>;
  }

  if (urls.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhuma URL encurtada ainda. Crie a primeira acima!
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Suas URLs ({meta?.total || 0})</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {urls.map((url) => (
          <div key={url.id} className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <a
                  href={`${window.location.origin}/${url.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-medium hover:underline"
                >
                  /{url.code}
                </a>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {url.clickCount} {url.clickCount === 1 ? 'clique' : 'cliques'}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate">{url.originalUrl}</p>
              <p className="text-xs text-gray-400 mt-1">Criada em {formatDate(url.createdAt)}</p>
            </div>
            <button
              onClick={() => handleDelete(url.id)}
              className="text-sm text-red-500 hover:text-red-700 cursor-pointer"
            >
              Excluir
            </button>
          </div>
        ))}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {meta.page} de {meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
