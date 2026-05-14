import React from 'react';
import { LogIn } from 'lucide-react';

interface SessionExpiredModalProps {
  open: boolean;
  onDismiss: () => void;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({ open, onDismiss }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Session expired</h2>
        <p className="text-sm text-slate-600 mb-6">
          Your session has expired for security. Please sign in again to continue.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="w-full px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Sign in again
        </button>
      </div>
    </div>
  );
};
