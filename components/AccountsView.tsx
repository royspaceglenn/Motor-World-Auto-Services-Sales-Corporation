import React, { useEffect, useState } from 'react';
import { personsApi, vehiclesApi } from '../lib/api/adminData';
import type { Person, Vehicle } from '../types';
import { PersonModal } from './PersonModal';
import { PersonBusinessHistoryModal } from './PersonBusinessHistoryModal';
import { VehicleModal } from './VehicleModal';
import { UserPlus, Car, Pencil, Trash2, User, ChevronDown, Search } from 'lucide-react';
import { Button } from './ui/Button';
import { InlineAlert } from './ui/InlineAlert';

interface AccountsViewProps {
  canEdit: boolean;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ canEdit }) => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehiclesExpandedPersonId, setVehiclesExpandedPersonId] = useState<string | null>(null);
  const [personSearch, setPersonSearch] = useState('');
  const [historyPerson, setHistoryPerson] = useState<Person | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([personsApi.list(), vehiclesApi.list()])
      .then(([personsRes, vehiclesRes]) => {
        setPersons(personsRes.persons ?? []);
        setVehicles(vehiclesRes.vehicles ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load accounts.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddPerson = () => {
    setEditPerson(null);
    setError(null);
    setPersonModalOpen(true);
  };

  const openEditPerson = (p: Person) => {
    setEditPerson(p);
    setError(null);
    setPersonModalOpen(true);
  };

  const handleSavePerson = (data: { fullName: string; contactNumber: string; address?: string; email?: string }) => {
    setSaving(true);
    setError(null);
    const promise = editPerson
      ? personsApi.update(editPerson.id, data)
      : personsApi.create(data);
    promise
      .then((saved) => {
        if (editPerson) {
          setPersons((prev) => prev.map((p) => (p.id === editPerson.id ? { ...saved } : p)));
        } else {
          setPersons((prev) => [{ ...saved }, ...prev]);
        }
        setPersonModalOpen(false);
        setEditPerson(null);
      })
      .catch((err) => setError(err?.message ?? 'Failed to save'))
      .finally(() => setSaving(false));
  };

  const handleDeletePerson = (p: Person) => {
    if (!window.confirm(`Delete "${p.fullName}"? This will fail if they have active receivable records.`)) return;
    personsApi
      .delete(p.id)
      .then(() => {
        setPersons((prev) => prev.filter((x) => x.id !== p.id));
        setVehicles((prev) => prev.filter((v) => v.personId !== p.id));
      })
      .catch((err) => alert(err?.message ?? 'Could not delete. They may have active receivable records.'));
  };

  const openAddVehicle = () => {
    setEditVehicle(null);
    setError(null);
    setVehicleModalOpen(true);
  };

  const openEditVehicle = (v: Vehicle) => {
    setEditVehicle(v);
    setError(null);
    setVehicleModalOpen(true);
  };

  const handleSaveVehicle = (data: { personId: string; plateNumber: string; brand?: string; model?: string; year?: number | null; color?: string }) => {
    setSaving(true);
    setError(null);
    const promise = editVehicle
      ? vehiclesApi.update(editVehicle.id, data)
      : vehiclesApi.create(data);
    promise
      .then((saved) => {
        if (editVehicle) {
          setVehicles((prev) => prev.map((v) => (v.id === editVehicle.id ? { ...saved } : v)));
        } else {
          setVehicles((prev) => [{ ...saved }, ...prev]);
        }
        setVehicleModalOpen(false);
        setEditVehicle(null);
      })
      .catch((err) => setError(err?.message ?? 'Failed to save'))
      .finally(() => setSaving(false));
  };

  const handleDeleteVehicle = (v: Vehicle) => {
    if (!window.confirm(`Delete vehicle "${v.plateNumber}"? This will fail if it is linked to any transaction.`)) return;
    vehiclesApi
      .delete(v.id)
      .then(() => setVehicles((prev) => prev.filter((x) => x.id !== v.id)))
      .catch((err) => alert(err?.message ?? 'Could not delete. Vehicle may be linked to a transaction.'));
  };

  const vehiclesByPerson = (personId: string) => vehicles.filter((v) => v.personId === personId);

  const personSearchLower = personSearch.trim().toLowerCase();
  const filteredPersons = personSearchLower
    ? persons.filter(
        (p) =>
          (p.fullName && p.fullName.toLowerCase().includes(personSearchLower)) ||
          (p.contactNumber && p.contactNumber.toLowerCase().includes(personSearchLower)) ||
          (p.address && p.address.toLowerCase().includes(personSearchLower)) ||
          (p.email && p.email.toLowerCase().includes(personSearchLower))
      )
    : persons;

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-12">
        <p className="text-slate-500">Loading accounts...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {error && <InlineAlert message={error} />}
      {/* Persons */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Person (Customer) Records</h3>
              <p className="text-sm text-slate-500">Each person has a unique ID. Required for Sales/Credit.</p>
            </div>
          </div>
          {canEdit && (
            <Button
              onClick={openAddPerson}
            >
              <UserPlus className="w-4 h-4" />
              Add Person
            </Button>
          )}
        </div>
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search by name, contact, address, or email..."
              value={personSearch}
              onChange={(e) => setPersonSearch(e.target.value)}
            />
          </div>
          {personSearch.trim() && (
            <p className="text-xs text-slate-500 mt-1">
              Showing {filteredPersons.length} of {persons.length} customer(s)
            </p>
          )}
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 font-semibold text-slate-600">ID</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Full Name</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Contact</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Address</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Email</th>
                {canEdit && <th className="py-3 px-4 font-semibold text-slate-600 w-24">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredPersons.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="py-8 text-center text-slate-400">
                    {persons.length === 0
                      ? 'No persons yet. Add a person to use in Sales/Credit.'
                      : 'No customers match your search. Try a different name or contact.'}
                  </td>
                </tr>
              )}
              {filteredPersons.map((p) => (
                <React.Fragment key={p.id}>
                  <tr className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{p.id.slice(0, 8)}</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setHistoryPerson(p)}
                        className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline text-left"
                      >
                        {p.fullName}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{p.contactNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{p.address || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{p.email || '—'}</td>
                    {canEdit && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditPerson(p)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePerson(p)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                  {canEdit && vehiclesByPerson(p.id).length > 0 && (
                    <tr className="border-t border-slate-100 bg-slate-50/50">
                    <td colSpan={6} className="py-2 px-4">
                      <button
                        type="button"
                        onClick={() => setVehiclesExpandedPersonId(vehiclesExpandedPersonId === p.id ? null : p.id)}
                        className="flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${vehiclesExpandedPersonId === p.id ? 'rotate-180' : ''}`} />
                        {vehiclesByPerson(p.id).length} vehicle(s)
                      </button>
                      {vehiclesExpandedPersonId === p.id && (
                        <div className="mt-2 pl-4 space-y-1">
                          {vehiclesByPerson(p.id).map((v) => (
                            <div key={v.id} className="flex items-center justify-between text-sm py-1">
                              <span className="font-medium">{v.plateNumber}</span>
                              <span className="text-slate-500">{[v.brand, v.model, v.year].filter(Boolean).join(' ') || '—'}</span>
                              <div className="flex gap-1">
                                <button type="button" onClick={() => openEditVehicle(v)} className="text-indigo-600 hover:underline">Edit</button>
                                <button type="button" onClick={() => handleDeleteVehicle(v)} className="text-red-600 hover:underline">Delete</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicles */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Car className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Vehicle Records</h3>
              <p className="text-sm text-slate-500">Each vehicle is linked to a Person. Plate number must be unique.</p>
            </div>
          </div>
          {canEdit && (
            <Button
              onClick={openAddVehicle}
              disabled={persons.length === 0}
              className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
            >
              <Car className="w-4 h-4" />
              Add Vehicle
            </Button>
          )}
        </div>
        <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 font-semibold text-slate-600">Plate Number</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Owner (Person)</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Brand / Model</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Year</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Color</th>
                {canEdit && <th className="py-3 px-4 font-semibold text-slate-600 w-24">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="py-8 text-center text-slate-400">
                    No vehicles yet. Add a person first, then add vehicles.
                  </td>
                </tr>
              )}
              {vehicles.map((v) => {
                const owner = persons.find((p) => p.id === v.personId);
                return (
                  <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-800">{v.plateNumber}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {owner ? (
                        <span>
                          <button
                            type="button"
                            onClick={() => setHistoryPerson(owner)}
                            className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            {owner.fullName}
                          </button>
                          {owner.contactNumber ? ` (${owner.contactNumber})` : ''}
                        </span>
                      ) : (
                        v.personId
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{[v.brand, v.model].filter(Boolean).join(' ') || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{v.year ?? '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{v.color || '—'}</td>
                    {canEdit && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditVehicle(v)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVehicle(v)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <PersonModal
        isOpen={personModalOpen}
        onClose={() => { setPersonModalOpen(false); setEditPerson(null); setError(null); }}
        onSave={handleSavePerson}
        editPerson={editPerson}
        isSaving={saving}
        error={error}
      />

      <VehicleModal
        isOpen={vehicleModalOpen}
        onClose={() => { setVehicleModalOpen(false); setEditVehicle(null); setError(null); }}
        onSave={handleSaveVehicle}
        editVehicle={editVehicle}
        persons={persons}
        isSaving={saving}
        error={error}
      />

      <PersonBusinessHistoryModal
        isOpen={!!historyPerson}
        person={historyPerson}
        vehicles={vehicles}
        onClose={() => setHistoryPerson(null)}
      />
    </div>
  );
};
