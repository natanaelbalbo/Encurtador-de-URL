import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, BarChart3, Trash2, MousePointerClick, ChevronLeft, ChevronRight, Link, ChevronUp, Calendar, Loader2 } from 'lucide-react';
import api from '../api/client';
import AccessChart from './AccessChart';

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
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

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
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-teal-500" />
        <span className="text-sm font-medium">Carregando suas URLs...</span>
      </div>
    );
  }

  if (urls.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
          <Link className="w-8 h-8 text-teal-400" />
        </div>
        <p className="text-gray-500 font-medium">Nenhuma URL encurtada ainda</p>
        <p className="text-sm text-gray-400 mt-1">Crie a primeira usando o formulário acima!</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100/80 flex items-center gap-2">
        <Link className="w-5 h-5 text-teal-600" />
        <h2 className="text-lg font-semibold text-gray-800">Suas URLs</h2>
        <span className="ml-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
          {meta?.total || 0}
        </span>
      </div>

      {/* URL Items */}
      <div className="divide-y divide-gray-100/60">
        {urls.map((url, index) => (
          <div
            key={url.id}
            className="px-6 py-4 card-hover hover:bg-white/40 transition-colors duration-200"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <a
                    href={`${window.location.origin}/${url.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 font-semibold hover:text-teal-700 transition-colors flex items-center gap-1 group"
                  >
                    /{url.code}
                    <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
                    <MousePointerClick className="w-3 h-3" />
                    {url.clickCount} {url.clickCount === 1 ? 'clique' : 'cliques'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{url.originalUrl}</p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Criada em {formatDate(url.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExpandedChart(expandedChart === url.id ? null : url.id)}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    expandedChart === url.id
                      ? 'bg-teal-100 text-teal-700'
                      : 'text-gray-400 hover:text-teal-600 hover:bg-teal-50'
                  }`}
                  title="Ver gráfico de acessos"
                >
                  {expandedChart === url.id ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span className="text-xs font-medium hidden sm:inline">Fechar</span>
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-xs font-medium hidden sm:inline">Stats</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(url.id)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 cursor-pointer"
                  title="Excluir URL"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {expandedChart === url.id && (
              <div className="animate-slide-down">
                <AccessChart urlId={url.id} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100/80 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-white hover:border-teal-400 hover:text-teal-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-gray-200 disabled:hover:text-gray-500 transition-all duration-200 cursor-pointer text-gray-600"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-sm text-gray-500 font-medium">
            Página <span className="text-teal-600 font-semibold">{meta.page}</span> de{' '}
            <span className="font-semibold">{meta.totalPages}</span>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-white hover:border-teal-400 hover:text-teal-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-gray-200 disabled:hover:text-gray-500 transition-all duration-200 cursor-pointer text-gray-600"
          >
            Próxima
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
