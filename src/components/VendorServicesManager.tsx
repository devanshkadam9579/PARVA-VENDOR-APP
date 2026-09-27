import React, { useState } from 'react';
import { Plus, Edit2, CheckCircle, Trash2, Power, Upload, Image as ImageIcon, Sparkles, X } from 'lucide-react';
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
  const [editingService, setEditingService] = useState<VendorServiceItem & { image?: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleToggleStatus = async (serviceId: string) => {
    const updated = services.map(s => 
      s.id === serviceId ? { ...s, status: s.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE' } as VendorServiceItem : s
    );
    await onSaveServices(updated);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to remove this service from your catalog?')) {
      const updated = services.filter(s => s.id !== serviceId);
      await onSaveServices(updated);
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingService) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const currentImages = editingService.images || [];
      setEditingService({
        ...editingService,
        images: [result, ...currentImages.filter(img => img !== result)]
      });
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    let updated: VendorServiceItem[];
    const itemToSave = {
      ...editingService,
      images: editingService.images && editingService.images.length > 0 ? editingService.images : [
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600'
      ]
    };

    if (editingService.id) {
      updated = services.map(s => s.id === editingService.id ? itemToSave : s);
    } else {
      updated = [...services, { ...itemToSave, id: `svc_${Date.now()}`, status: 'ACTIVE' }];
    }
    await onSaveServices(updated);
    setIsModalOpen(false);
    setEditingService(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a0812] font-display">Services & Packages Catalog</h1>
          <p className="text-xs text-[#745b68] mt-0.5">Configure your celebration packages, add-ons, photos, and pricing rules</p>
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
              status: 'ACTIVE',
              images: []
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Add New Service</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((svc) => {
          const serviceImage = svc.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600';

          return (
            <div
              key={svc.id || svc.name}
              className={`bg-white rounded-3xl border overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between ${
                svc.status === 'INACTIVE' ? 'opacity-60 border-gray-200' : 'border-[#f2e4ec]'
              }`}
            >
              <div>
                {/* Service Image Banner */}
                <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={serviceImage}
                    alt={svc.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white border border-white/20">
                      {svc.pricingModel || 'PACKAGE'}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(svc.id!)}
                      className={`p-1.5 rounded-xl shadow-xs transition ${
                        svc.status === 'INACTIVE' ? 'bg-white/80 text-gray-500' : 'bg-emerald-500 text-white'
                      }`}
                      title="Toggle Active / Inactive"
                    >
                      <Power size={13} />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-1.5">
                  <h3 className="font-extrabold text-sm text-[#1a0812] leading-tight line-clamp-1">{svc.name}</h3>
                  <p className="text-xs text-[#745b68] line-clamp-2 leading-relaxed">{svc.description || 'Standard service offering with professional equipment & dedicated support.'}</p>
                </div>
              </div>

              <div className="p-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-base font-black text-[#1a0812]">
                  ₹{svc.price.toLocaleString('en-IN')}{' '}
                  <span className="text-[10px] text-gray-400 font-normal">
                    {category.toLowerCase() === 'catering' ? '/ plate' : 'package'}
                  </span>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { setEditingService(svc); setIsModalOpen(true); }}
                    className="p-2 text-gray-600 hover:text-brand-primary hover:bg-[#faf5f8] rounded-xl transition"
                    title="Edit Service"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteService(svc.id!)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    title="Delete Service"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && editingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveModal} className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto border border-[#f2e4ec]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-[#1a0812]">
                {editingService.id ? 'Edit Service / Package' : 'Add New Service / Package'}
              </h3>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); setEditingService(null); }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Service Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Service Name *</label>
              <input
                type="text"
                required
                value={editingService.name}
                onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                placeholder="e.g. Royal Rajasthani Catering Thali / 4K Drone Cinematic Wedding Film"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white transition"
              />
            </div>

            {/* Service Photo Upload & URL Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Service Photo / Package Image</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                {/* File Upload Button */}
                <label className="flex items-center justify-center gap-2 p-3 bg-[#faf5f8] hover:bg-[#f2e4ec] border border-dashed border-brand-primary/40 rounded-2xl cursor-pointer transition text-xs font-bold text-brand-primary">
                  <Upload size={15} />
                  <span>{isUploading ? 'Uploading...' : 'Upload from Device'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Direct Image URL input */}
                <input
                  type="url"
                  placeholder="Or paste image URL (https://...)"
                  value={editingService.images?.[0] || ''}
                  onChange={(e) => {
                    const url = e.target.value.trim();
                    setEditingService({
                      ...editingService,
                      images: url ? [url] : []
                    });
                  }}
                  className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-2xl p-3 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white transition"
                />
              </div>

              {/* Live Image Preview */}
              {editingService.images?.[0] && (
                <div className="relative h-28 w-full rounded-2xl overflow-hidden border border-[#f2e4ec] mt-2 group">
                  <img
                    src={editingService.images[0]}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingService({ ...editingService, images: [] })}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-red-600 transition"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Description & Inclusions */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Description & Inclusions</label>
              <textarea
                rows={3}
                value={editingService.description || ''}
                onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                placeholder="Detail what is included: live counter items, photography hours, sound setup, lighting, staff count..."
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white transition"
              />
            </div>

            {/* Pricing Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Price (INR) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={editingService.price}
                  onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                  className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Pricing Model</label>
                <select
                  value={editingService.pricingModel || 'PACKAGE'}
                  onChange={(e) => setEditingService({ ...editingService, pricingModel: e.target.value })}
                  className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white transition"
                >
                  <option value="PACKAGE">Full Package / Event</option>
                  <option value="PER_GUEST">Per Guest / Plate</option>
                  <option value="PER_HOUR">Per Hour Rate</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); setEditingService(null); }}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs rounded-xl shadow-md transition"
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

