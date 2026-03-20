import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import { Link2, LogOut } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    showToast('Você saiu da sua conta', 'info');
    navigate('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="glass-card sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center shadow-md">
              <Link2 className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-gradient">URL Shortener</span>
          </Link>
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50/80 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          )}
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
