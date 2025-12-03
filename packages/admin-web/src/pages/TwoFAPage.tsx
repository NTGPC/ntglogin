import React, { useState, useEffect } from 'react';
import * as OTPAuth from 'otpauth';
import { Copy, ShieldCheck, RefreshCw, Eraser, CheckCircle2 } from 'lucide-react';

const TwoFAPage = () => {
  const [secret, setSecret] = useState('');
  const [result, setResult] = useState(''); 
  const [onlyCode, setOnlyCode] = useState('------'); 
  const [timeLeft, setTimeLeft] = useState(30);
  const [copyStatus, setCopyStatus] = useState(false);

  const generateCode = (inputKey: string) => {
    setCopyStatus(false);
    if (!inputKey) {
      setResult('');
      setOnlyCode('------');
      return;
    }
    try {
      const cleanKey = inputKey.replace(/\s/g, '').toUpperCase();
      const totp = new OTPAuth.TOTP({
        issuer: 'ACME',
        label: 'AzureDiamond',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(cleanKey)
      });
      const token = totp.generate();
      setResult(`${cleanKey}|${token}`);
      setOnlyCode(token);
    } catch (e) {
      setResult('');
      setOnlyCode('ERROR KEY'); 
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const seconds = new Date().getSeconds();
      const remaining = 30 - (seconds % 30);
      setTimeLeft(remaining);
      if (secret) generateCode(secret);
    }, 1000);
    return () => clearInterval(timer);
  }, [secret]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setSecret(val);
    generateCode(val);
  };

  const handleCopyFull = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (onlyCode !== '------' && onlyCode !== 'ERROR KEY') {
      navigator.clipboard.writeText(onlyCode);
      alert('Đã copy mã 6 số!');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSecret(text);
      generateCode(text);
    } catch (e) {}
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
            <ShieldCheck size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Giải mã 2FA Pro</h1>
            <p className="text-gray-500 mt-1">Công cụ lấy mã xác thực chuẩn MMO (Powered by OTPAuth)</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
              1. Nhập mã bí mật (Secret Key)
            </label>
            <div className="relative">
                <textarea
                className="w-full p-5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none h-40 font-mono text-sm text-gray-600 resize-none transition-all"
                placeholder="Dán mã 2FA vào đây (Ví dụ: QMXT...)"
                value={secret}
                onChange={handleInputChange}
                />
                {secret && (
                    <button 
                        onClick={() => { setSecret(''); setOnlyCode('------'); setResult(''); }}
                        className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Xóa hết"
                    >
                        <Eraser size={18} />
                    </button>
                )}
            </div>
            
            <button 
                onClick={handlePaste}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl flex items-center justify-center gap-2 transition"
            >
                📋 Dán từ Clipboard
            </button>
          </div>
          <div className="flex flex-col space-y-4">
             <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
              2. Kết quả & Copy
            </label>
            <div className="bg-slate-900 rounded-xl p-6 text-white relative overflow-hidden min-h-[160px] flex flex-col justify-between shadow-inner">
                <div className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-1000 ease-linear" 
                     style={{ width: `${(timeLeft / 30) * 100}%` }}>
                </div>
                <div className="flex justify-between items-start">
                    <span className="text-slate-400 text-xs font-bold uppercase">2FA Code</span>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <RefreshCw size={12} className={timeLeft < 5 ? "animate-spin text-red-400" : ""} />
                        {timeLeft}s
                    </div>
                </div>
                <div className="text-center py-2">
                    {onlyCode === 'ERROR KEY' ? (
                        <span className="text-red-400 text-3xl font-bold tracking-widest animate-pulse">SAI MÃ KEY</span>
                    ) : (
                        <div className="font-mono text-5xl font-bold tracking-[0.3em] text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                            {onlyCode === '------' ? '--- ---' : `${onlyCode.slice(0, 3)} ${onlyCode.slice(3)}`}
                        </div>
                    )}
                </div>
                <div className="text-center">
                     <span className="text-slate-500 text-xs truncate block px-4 font-mono">
                        {result || "Waiting for input..."}
                     </span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={handleCopyCode}
                    disabled={onlyCode === '------' || onlyCode === 'ERROR KEY'}
                    className={`py-3 px-4 rounded-xl font-bold text-white shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 ${
                        onlyCode === '------' || onlyCode === 'ERROR KEY'
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-cyan-600 hover:bg-cyan-700'
                    }`}
                >
                    <Copy size={18} />
                    Copy 6 số
                </button>
                <button
                    onClick={handleCopyFull}
                    disabled={!result}
                    className={`py-3 px-4 rounded-xl font-bold text-white shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 ${
                        !result
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : copyStatus ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    {copyStatus ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    {copyStatus ? 'Đã Copy!' : 'Copy Key|Code'}
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFAPage;
