import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './firebase';
import './index.css';
import QuyQuantriApp from '../quy-quantri.jsx';
import QuyCongKhaiApp from '../quy-congkhai.jsx';
import { ShieldCheck, Eye, Lock } from 'lucide-react';

function MainApp() {
  const [mode, setMode] = useState('congkhai'); // 'congkhai' | 'quantri'

  return (
    <div className="min-h-screen bg-[#EFEADC] flex flex-col items-center">
      {/* Top Switcher Bar */}
      <header className="w-full bg-[#0F231B] text-[#F6F3EC] border-b border-[#1B4332] px-4 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="FC 8X+ Logo" className="w-8 h-8 rounded-full object-cover border border-[#E3B23C]" />
          <span className="font-bold text-sm tracking-wide uppercase font-['Oswald'] text-[#F6F3EC]">
            FC 8X+ XUÂN ĐÌNH
          </span>
        </div>

        <div className="flex bg-[#163C2C] p-1 rounded-xl border border-[#2D6A4F]">
          <button
            onClick={() => setMode('quantri')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'quantri'
                ? 'bg-[#E3B23C] text-[#0F231B] shadow-sm font-bold'
                : 'text-[#B9D4C4] hover:text-white'
            }`}
          >
            <Lock size={13} />
            Quản trị
          </button>
          <button
            onClick={() => setMode('congkhai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'congkhai'
                ? 'bg-[#E3B23C] text-[#0F231B] shadow-sm font-bold'
                : 'text-[#B9D4C4] hover:text-white'
            }`}
          >
            <Eye size={13} />
            Công khai
          </button>
        </div>
      </header>

      {/* Main Container - App View */}
      <main className="w-full flex-1 flex justify-center">
        {mode === 'quantri' ? <QuyQuantriApp /> : <QuyCongKhaiApp />}
      </main>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#EFEADC] text-[#1F2A22]">
          <div className="bg-white p-6 rounded-2xl shadow-lg max-w-sm text-center">
            <h2 className="text-lg font-bold text-red-600 mb-2">Đã xảy ra lỗi ứng dụng</h2>
            <p className="text-xs text-gray-600 mb-4">{this.state.error?.toString()}</p>
            <button
              onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.reload(); }}
              className="px-4 py-2 bg-[#1B4332] text-white rounded-xl text-xs font-bold uppercase"
            >
              Xóa bộ nhớ đệm & Tải lại
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  </React.StrictMode>
);
