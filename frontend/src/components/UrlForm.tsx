import { useState, FormEvent } from 'react';
import { Scissors, Globe, Copy, Check, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import api from '../api/client';

interface UrlFormProps {
  onCreated: () => void;
}

export default function UrlForm({ onCreated }: UrlFormProps) {
  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setShortUrl('');
    setCopied(false);
    setLoading(true);

    try {
      const { data } = await api.post('/urls', { url });
      const base = window.location.origin;
      setShortUrl(`${base}/${data.code}`);
      setUrl('');
      showToast('URL encurtada com sucesso!', 'success');
      onCreated();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
        showToast(axiosErr.response?.data?.error?.message || 'Erro ao encurtar URL', 'error');
      } else {
        showToast('Erro ao encurtar URL', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    showToast('Link copiado para a área de transferência!', 'success');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="glass-card rounded-2xl p-6 mb-6 animate-fade-in">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Scissors className="w-5 h-5 text-teal-600" />
        Encurtar URL
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://exemplo.com/url-muito-longa"
            required
            className="input-modern !pl-11"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-gradient px-6 py-3 text-white rounded-xl font-medium flex items-center gap-2 cursor-pointer whitespace-nowrap"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Encurtando...
            </>
          ) : (
            <>
              <Scissors className="w-4 h-4" />
              Encurtar
            </>
          )}
        </button>
      </form>

      {shortUrl && (
        <div className="mt-4 p-4 bg-emerald-50/80 border border-emerald-200/50 rounded-xl flex items-center justify-between animate-slide-down">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 font-medium hover:underline truncate"
            >
              {shortUrl}
            </a>
          </div>
          <button
            onClick={handleCopy}
            className={`ml-3 px-4 py-2 text-sm rounded-lg font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-600'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copiar
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
