import React, { useState } from 'react';
import { Plus, Edit2, CheckCircle, Trash2, Power } from 'lucide-react';
import { VendorServiceItem } from '../types';

export interface VendorServicesManagerProps {
  services: VendorServiceItem[];
  onSaveServices: (services: VendorServiceItem[]) => Promise<void>;
  category: string;
}

export function VendorServicesManager({
  services,
  onSaveServices,
  category
}: VendorServicesManagerProps) {
  const [editingService, setEditingService] = useState<VendorServiceItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleToggleStatus = async (serviceId: string) => {
    const updated = services.map(s => 
      s.id === serviceId ? { ...s, status: s.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE' } as VendorServiceItem : s
    );
    await onSaveServices(updated);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    let updated: VendorServiceItem[];
    if (editingService.id) {
      updated = services.map(s => s.id === editingService.id ? editingService : s);
    } else {
      updated = [...services, { ...editingService, id: `svc_${Date.now()}`, status: 'ACTIVE' }];
    }
    await onSaveServices(updated);
    setIsModalOpen(false);
    setEditingService(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a0812] font-display">Services & Packages Catalog</h1>
          <p className="text-xs text-[#745b68] mt-0.5">Configure your celebration packages, add-ons, and pricing rules</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingService({
              id: '',
              name: '',
              price: 1000,
              description: '',
              pricingModel: category.toLowerCase() === 'catering' ? 'PER_GUEST' : 'PACKAGE',
              status: 'ACTIVE'
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span>Add New Service</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((svc) => (
          <div
            key={svc.id || svc.name}
            className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col justify-between transition ${
              svc.status === 'INACTIVE' ? 'opacity-60 border-gray-200' : 'border-[#f2e4ec]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary">
                  {svc.pricingModel || 'PACKAGE'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(svc.id!)}
                  className={`p-1.5 rounded-lg border transition ${
                    svc.status === 'INACTIVE' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}
                  title="Toggle Active / Inactive"
                >
                  <Power size={13} />
                </button>
              </div>

              <h3 className="font-extrabold text-sm text-[#1a0812]">{svc.name}</h3>
              <p className="text-xs text-[#745b68] mt-1 line-clamp-2">{svc.description}</p>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-base font-black text-[#1a0812]">
                ₹{svc.price.toLocaleString('en-IN')}{' '}
                <span className="text-[10px] text-gray-400 font-normal">
                  {category.toLowerCase() === 'catering' ? '/ plate' : 'package'}
                </span>
              </span>

              <button
                type="button"
                onClick={() => { setEditingService(svc); setIsModalOpen(true); }}
                className="p-2 text-gray-600 hover:text-[#1a0812] hover:bg-gray-100 rounded-xl transition"
              >
                <Edit2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && editingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveModal} className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-[#1a0812]">
              {editingService.id ? 'Edit Service' : 'Add New Service'}
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Service Name</label>
              <input
                type="text"
                required
                value={editingService.name}
                onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                placeholder="e.g. Royal Rajasthani Catering Thali"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-brand-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Description & Inclusions</label>
              <textarea
                rows={3}
                value={editingService.description}
                onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                placeholder="Detail the package contents, items, duration..."
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-brand-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Price (INR)</label>
              <input
                type="number"
                min={1}
                required
                value={editingService.price}
                onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-brand-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); setEditingService(null); }}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs rounded-xl shadow-xs transition"
              >
                Save Service
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
