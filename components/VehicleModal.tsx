import React, { useState, useEffect } from 'react';
import { X, Car } from 'lucide-react';
import type { Person, Vehicle } from '../types';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { personId: string; plateNumber: string; brand?: string; model?: string; year?: number | null; color?: string }) => void;
  editVehicle: Vehicle | null;
  persons: Person[];
  isSaving?: boolean;
  error?: string | null;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editVehicle,
  persons,
  isSaving,
  error,
}) => {
  const [personId, setPersonId] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<string>('');
  const [color, setColor] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editVehicle) {
        setPersonId(editVehicle.personId ?? '');
        setPlateNumber(editVehicle.plateNumber ?? '');
        setBrand(editVehicle.brand ?? '');
        setModel(editVehicle.model ?? '');
        setYear(editVehicle.year != null ? String(editVehicle.year) : '');
        setColor(editVehicle.color ?? '');
      } else {
        setPersonId(persons.length > 0 ? persons[0].id : '');
        setPlateNumber('');
        setBrand('');
        setModel('');
        setYear('');
        setColor('');
      }
    }
  }, [isOpen, editVehicle, persons]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPlate = plateNumber.trim();
    if (!personId || !trimmedPlate) return;
    onSave({
      personId,
      plateNumber: trimmedPlate,
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      year: year.trim() ? parseInt(year, 10) : null,
      color: color.trim() || undefined,
    });
  };

  const canSubmit = personId.length > 0 && plateNumber.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up my-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-amber-50">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Car className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{editVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
              <p className="text-xs text-slate-500">Link vehicle to a person</p>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Person (Owner) <span className="text-red-500">*</span></label>
            <select
              required
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              disabled={!!editVehicle}
            >
              <option value="">Select person...</option>
              {persons.map((p) => (
                <option key={p.id} value={p.id}>{p.fullName} – {p.contactNumber}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Plate Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-400 uppercase"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="ABC 1234"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Brand (Optional)</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-400"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Toyota"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Model (Optional)</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-400"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Hilux"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Year (Optional)</label>
              <input
                type="number"
                min={1900}
                max={2100}
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-400"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Color (Optional)</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-400"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="White"
              />
            </div>
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
              className="flex-1 px-4 py-2 text-white bg-amber-600 rounded-lg hover:bg-amber-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : editVehicle ? 'Update' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
