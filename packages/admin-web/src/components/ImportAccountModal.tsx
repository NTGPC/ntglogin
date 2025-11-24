import React, { useState } from 'react';

interface ImportAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ImportAccountModal: React.FC<ImportAccountModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [rawData, setRawData] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!rawData.trim()) {
      alert('Vui lòng nhập dữ liệu!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/profiles/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawData }),
      });

      const result = await response.json();

      if (response.ok) {
        const message = result.errors && result.errors.length > 0
          ? `${result.message}\n\nLỗi:\n${result.errors.join('\n')}`
          : result.message;
        alert(message);
        setRawData('');
        onSuccess();
        onClose();
      } else {
        alert('Error: ' + (result.error || result.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error(error);
      alert('Failed to connect to server: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Import Accounts</h2>
        
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          <p className="font-semibold mb-2">Format per line (6 trường):</p>
          <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded block mt-1 font-mono text-xs">
            UID|Password|2FA|Email|EmailPassword|RecoveryEmail
          </code>
          <p className="mt-3 text-xs">
            <strong>Lưu ý:</strong> Chỉ UID và Password là bắt buộc, các trường còn lại là tùy chọn. Ví dụ:<br />
            <code className="bg-gray-100 dark:bg-gray-900 px-1 rounded text-xs">user123|pass456</code> (tối thiểu)<br />
            <code className="bg-gray-100 dark:bg-gray-900 px-1 rounded text-xs">user123|pass456|2FAKEY</code> (có 2FA)<br />
            <code className="bg-gray-100 dark:bg-gray-900 px-1 rounded text-xs">user123|pass456|2FAKEY|email@example.com|emailpass|recovery@example.com</code> (đầy đủ)
          </p>
        </div>

        <textarea
          className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          placeholder="user123|pass456|2FAKEY|email@example.com|emailpass|recovery@example.com&#10;user789|pass012&#10;user345|pass678|2FAKEY2|email2@example.com"
          value={rawData}
          onChange={(e) => setRawData(e.target.value)}
        />

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isLoading || !rawData.trim()}
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Start Import
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportAccountModal;

