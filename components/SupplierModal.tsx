import React, { useState, useEffect } from 'react';
import { X, Truck } from 'lucide-react';
import type { Supplier } from '../types';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; contactNumber?: string; address?: string; email?: string; tin?: string }) => void;
  editSupplier: Supplier | null;
  isSaving?: boolean;
  error?: string | null;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editSupplier,
  isSaving,
  error,
}) => {
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [tin, setTin] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editSupplier) {
        setName(editSupplier.name ?? '');
        setContactNumber(editSupplier.contactNumber ?? '');
        setAddress(editSupplier.address ?? '');
        setEmail(editSupplier.email ?? '');
        setTin(editSupplier.tin ?? '');
      } else {
        setName('');
        setContactNumber('');
        setAddress('');
        setEmail('');
        setTin('');
      }
    }
  }, [isOpen, editSupplier]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      contactNumber: contactNumber.trim() || undefined,
      address: address.trim() || undefined,
      email: email.trim() || undefined,
      tin: tin.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Truck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{editSupplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <p className="text-xs text-slate-500">For receive-from-supplier and accounts payable</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier name <span className="text-red-500">*</span></label>
            <input type="text" required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ABC Parts Inc." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact number</label>
            <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">TIN (Tax Identification No.)</label>
            <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" value={tin} onChange={(e) => setTin(e.target.value)} placeholder="Business TIN" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-slate-700">Cancel</button>
            <button type="submit" disabled={isSaving || !name.trim()} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50">
              {isSaving ? 'Saving...' : editSupplier ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
