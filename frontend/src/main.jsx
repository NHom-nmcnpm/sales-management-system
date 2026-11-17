import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/700.css';
import './styles/index.css';
import { Button } from './components/ui/button.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><main className="min-h-dvh bg-slate-50 p-8"><h1 className="text-2xl font-semibold text-slate-900">Sổ Bán Hàng</h1><p className="my-4 text-slate-600">Đang thiết lập hệ thống quản lý cửa hàng.</p><Button disabled>Hệ thống đang được thiết lập</Button></main></React.StrictMode>
);
