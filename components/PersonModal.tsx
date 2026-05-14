import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import type { Person } from '../types';

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { fullName: string; contactNumber: string; address?: string; email?: string }) => void;
  editPerson: Person | null;
  isSaving?: boolean;
  error?: string | null;
}

export const PersonModal: React.FC<PersonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editPerson,
  isSaving,
  error,
}) => {
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editPerson) {
        setFullName(editPerson.fullName ?? '');
        setContactNumber(editPerson.contactNumber ?? '');
        setAddress(editPerson.address ?? '');
        setEmail(editPerson.email ?? '');
      } else {
        setFullName('');
        setContactNumber('');
        setAddress('');
        setEmail('');
      }
    }
  }, [isOpen, editPerson]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    const trimmedContact = contactNumber.trim();
    if (!trimmedName || !trimmedContact) return;
    onSave({
      fullName: trimmedName,
      contactNumber: trimmedContact,
      address: address.trim() || undefined,
      email: email.trim() || undefined,
    });
  };

  const canSubmit = fullName.trim().length > 0 && contactNumber.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up my-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{editPerson ? 'Edit Person' : 'Add Person'}</h2>
              <p className="text-xs text-slate-500">Customer / contact record</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan Dela Cruz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="09XX XXX XXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address (Optional)</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="City, Province"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email (Optional)</label>
            <input
              type="email"
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isSaving}
              className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : editPerson ? 'Update' : 'Add Person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
