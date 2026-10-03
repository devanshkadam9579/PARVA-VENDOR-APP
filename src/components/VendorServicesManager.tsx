import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Power, Upload, X, Tag, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { VendorServiceItem, VendorAddon } from '../types';
import { compressImage } from '../lib/imageCompressor';

export interface VendorServicesManagerProps {
  services: VendorServiceItem[];
  addons?: VendorAddon[];
  features?: string[];
  inclusions?: string[];
  onSaveCatalog: (data: {
    services: VendorServiceItem[];
    addons: VendorAddon[];
    features: string[];
    inclusions: string[];
  }) => Promise<void>;
  category: string;
}

export function VendorServicesManager({
  services,
  addons = [],
  features = [],
  inclusions = [],
  onSaveCatalog,
  category
}: VendorServicesManagerProps) {
  // Active catalog subsection tab: 'services' | 'addons' | 'features'
  const [activeCatalogTab, setActiveCatalogTab] = useState<'services' | 'addons' | 'features'>('services');

  // Services State
  const [editingService, setEditingService] = useState<VendorServiceItem & { image?: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Addons State
  const [editingAddon, setEditingAddon] = useState<VendorAddon | null>(null);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);

  // Feature / Inclusion inline inputs
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [newInclusionInput, setNewInclusionInput] = useState('');

  // ---------------- SERVICES HANDLERS ----------------
  const handleToggleServiceStatus = async (serviceId: string) => {
    const updated = services.map(s => 
      s.id === serviceId ? { ...s, status: s.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE' } as VendorServiceItem : s
    );
    await onSaveCatalog({
      services: updated,
      addons,
      features,
      inclusions
    });
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to remove this service from your catalog?')) {
      const updated = services.filter(s => s.id !== serviceId);
      await onSaveCatalog({
        services: updated,
        addons,
        features,
        inclusions
      });
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingService) return;

    setIsUploading(true);
    try {
      const result = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.75 });
      const currentImages = editingService.images || [];
      setEditingService({
        ...editingService,
        images: [result.dataUrl, ...currentImages.filter(img => img !== result.dataUrl)]
      });
    } catch (err) {
      console.error('Image compression error:', err);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const currentImages = editingService.images || [];
        setEditingService({
          ...editingService,
          images: [result, ...currentImages.filter(img => img !== result)]
        });
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveServiceModal = async (e: React.FormEvent) => {
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
    await onSaveCatalog({
      services: updated,
      addons,
      features,
      inclusions
    });
    setIsModalOpen(false);
    setEditingService(null);
  };

  // ---------------- ADDONS HANDLERS ----------------
  const handleToggleAddonStatus = async (addonId: string) => {
    const updatedAddons = addons.map(a => 
      a.id === addonId ? { ...a, status: a.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE' } as VendorAddon : a
    );
    await onSaveCatalog({
      services,
      addons: updatedAddons,
      features,
      inclusions
    });
  };

  const handleDeleteAddon = async (addonId: string) => {
    if (window.confirm('Are you sure you want to delete this add-on?')) {
      const updatedAddons = addons.filter(a => a.id !== addonId);
      await onSaveCatalog({
        services,
        addons: updatedAddons,
        features,
        inclusions
      });
    }
  };

  const handleSaveAddonModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddon) return;

    let updatedAddons: VendorAddon[];
    if (editingAddon.id) {
      updatedAddons = addons.map(a => a.id === editingAddon.id ? editingAddon : a);
    } else {
      updatedAddons = [...addons, { ...editingAddon, id: `addon_${Date.now()}`, status: 'ACTIVE' }];
    }

    await onSaveCatalog({
      services,
      addons: updatedAddons,
      features,
      inclusions
    });
    setIsAddonModalOpen(false);
    setEditingAddon(null);
  };

  // ---------------- FEATURES & INCLUSIONS HANDLERS ----------------
  const handleAddFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = newFeatureInput.trim();
    if (!val || features.includes(val)) return;

    const updatedFeatures = [...features, val];
    setNewFeatureInput('');
    await onSaveCatalog({
      services,
      addons,
      features: updatedFeatures,
      inclusions
    });
  };

  const handleRemoveFeature = async (feat: string) => {
    const updatedFeatures = features.filter(f => f !== feat);
    await onSaveCatalog({
      services,
      addons,
      features: updatedFeatures,
      inclusions
    });
  };

  const handleAddInclusion = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = newInclusionInput.trim();
    if (!val || inclusions.includes(val)) return;

    const updatedInclusions = [...inclusions, val];
    setNewInclusionInput('');
    await onSaveCatalog({
      services,
      addons,
      features,
      inclusions: updatedInclusions
    });
  };

  const handleRemoveInclusion = async (inc: string) => {
    const updatedInclusions = inclusions.filter(i => i !== inc);
    await onSaveCatalog({
      services,
      addons,
      features,
      inclusions: updatedInclusions
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a0812] font-display">Services & Packages Catalog</h1>
          <p className="text-xs text-[#745b68] mt-0.5">
            Configure your celebration packages, add-ons, photos, and inclusions for {category}
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-[#faf5f8] p-1 rounded-2xl border border-[#f2e4ec]">
          <button
            type="button"
            onClick={() => setActiveCatalogTab('services')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeCatalogTab === 'services'
                ? 'bg-brand-primary text-white shadow-xs'
                : 'text-gray-600 hover:text-brand-primary'
            }`}
          >
            Services ({services.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCatalogTab('addons')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeCatalogTab === 'addons'
                ? 'bg-brand-primary text-white shadow-xs'
                : 'text-gray-600 hover:text-brand-primary'
            }`}
          >
            Add-ons ({addons.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCatalogTab('features')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeCatalogTab === 'features'
                ? 'bg-brand-primary text-white shadow-xs'
                : 'text-gray-600 hover:text-brand-primary'
            }`}
          >
            Features & Inclusions
          </button>
        </div>
      </div>

      {/* ----------------- TAB: SERVICES ----------------- */}
      {activeCatalogTab === 'services' && (
        <div className="space-y-4">
          <div className="flex justify-end">
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
              className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
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
                          onClick={() => handleToggleServiceStatus(svc.id!)}
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
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-sm text-[#1a0812] leading-tight line-clamp-1">{svc.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          svc.status === 'INACTIVE' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {svc.status || 'ACTIVE'}
                        </span>
                      </div>
                      <p className="text-xs text-[#745b68] line-clamp-2 leading-relaxed">
                        {svc.description || 'Standard service offering with professional equipment & dedicated support.'}
                      </p>
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
        </div>
      )}

      {/* ----------------- TAB: ADD-ONS ----------------- */}
      {activeCatalogTab === 'addons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#745b68]">
              Optional upsells and add-on services that customers can select during booking checkout.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingAddon({
                  id: '',
                  name: '',
                  price: 500,
                  description: '',
                  status: 'ACTIVE'
                });
                setIsAddonModalOpen(true);
              }}
              className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add New Add-on</span>
            </button>
          </div>

          {addons.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-[#f2e4ec] text-[#745b68] text-xs">
              No add-ons configured yet. Click &quot;Add New Add-on&quot; to provide optional services like drone shoot, live counters, or extra decor elements.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {addons.map((addon) => (
                <div
                  key={addon.id}
                  className={`p-4 bg-white rounded-2xl border transition shadow-xs flex flex-col justify-between ${
                    addon.status === 'INACTIVE' ? 'opacity-60 border-gray-200' : 'border-[#f2e4ec]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-[#1a0812]">{addon.name}</h4>
                      <button
                        type="button"
                        onClick={() => handleToggleAddonStatus(addon.id)}
                        className={`p-1.5 rounded-lg text-xs transition ${
                          addon.status === 'INACTIVE' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-500 text-white'
                        }`}
                        title="Toggle Active / Inactive"
                      >
                        <Power size={12} />
                      </button>
                    </div>
                    {addon.description && (
                      <p className="text-xs text-[#745b68] line-clamp-2">{addon.description}</p>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-[#1a0812]">
                      ₹{addon.price.toLocaleString('en-IN')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => { setEditingAddon(addon); setIsAddonModalOpen(true); }}
                        className="p-1.5 text-gray-500 hover:text-brand-primary rounded-lg transition"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddon(addon.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB: FEATURES & INCLUSIONS ----------------- */}
      {activeCatalogTab === 'features' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Highlights & Features */}
          <div className="bg-white p-5 rounded-3xl border border-[#f2e4ec] shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#1a0812] flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                Highlights & Key Features
              </h3>
              <p className="text-xs text-[#745b68] mt-0.5">
                Key selling points shown at the top of your vendor profile.
              </p>
            </div>

            <form onSubmit={handleAddFeature} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 100% Pure Veg, 4K HDR Drones, 10+ Yrs Exp"
                value={newFeatureInput}
                onChange={(e) => setNewFeatureInput(e.target.value)}
                className="flex-1 bg-[#faf5f8] border border-[#f2e4ec] rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-brand-primary-dark transition"
              >
                Add
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 min-h-[60px] p-2 bg-[#faf5f8] rounded-2xl border border-gray-100">
              {features.map((feat) => (
                <span
                  key={feat}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white text-emerald-800 border border-emerald-200 shadow-2xs"
                >
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  {feat}
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(feat)}
                    className="ml-1 text-gray-400 hover:text-red-500 transition"
                  >
                    ×
                  </button>
                </span>
              ))}
              {features.length === 0 && (
                <span className="text-xs text-gray-400 italic p-2">No custom features added yet.</span>
              )}
            </div>
          </div>

          {/* Standard Inclusions */}
          <div className="bg-white p-5 rounded-3xl border border-[#f2e4ec] shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#1a0812] flex items-center gap-2">
                <ShieldCheck size={16} className="text-brand-primary" />
                Standard Inclusions
              </h3>
              <p className="text-xs text-[#745b68] mt-0.5">
                Items or guarantees included in all your services by default.
              </p>
            </div>

            <form onSubmit={handleAddInclusion} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Dedicated event lead, Backup sound mixer, Clean cutlery"
                value={newInclusionInput}
                onChange={(e) => setNewInclusionInput(e.target.value)}
                className="flex-1 bg-[#faf5f8] border border-[#f2e4ec] rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-brand-primary-dark transition"
              >
                Add
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 min-h-[60px] p-2 bg-[#faf5f8] rounded-2xl border border-gray-100">
              {inclusions.map((inc) => (
                <span
                  key={inc}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white text-[#1a0812] border border-[#f2e4ec] shadow-2xs"
                >
                  <Tag size={12} className="text-brand-primary" />
                  {inc}
                  <button
                    type="button"
                    onClick={() => handleRemoveInclusion(inc)}
                    className="ml-1 text-gray-400 hover:text-red-500 transition"
                  >
                    ×
                  </button>
                </span>
              ))}
              {inclusions.length === 0 && (
                <span className="text-xs text-gray-400 italic p-2">No standard inclusions added yet.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Service Modal */}
      {isModalOpen && editingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveServiceModal} className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto border border-[#f2e4ec]">
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

      {/* Edit/Create Add-on Modal */}
      {isAddonModalOpen && editingAddon && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveAddonModal} className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 border border-[#f2e4ec]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-[#1a0812]">
                {editingAddon.id ? 'Edit Add-on' : 'Add New Add-on'}
              </h3>
              <button
                type="button"
                onClick={() => { setIsAddonModalOpen(false); setEditingAddon(null); }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Add-on Name *</label>
              <input
                type="text"
                required
                value={editingAddon.name}
                onChange={(e) => setEditingAddon({ ...editingAddon, name: e.target.value })}
                placeholder="e.g. Drone Photography / Live Chat Counter / Extra Halogen Light"
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Price (INR) *</label>
              <input
                type="number"
                min={0}
                required
                value={editingAddon.price}
                onChange={(e) => setEditingAddon({ ...editingAddon, price: Number(e.target.value) })}
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Description</label>
              <textarea
                rows={2}
                value={editingAddon.description || ''}
                onChange={(e) => setEditingAddon({ ...editingAddon, description: e.target.value })}
                placeholder="Details of what this add-on covers..."
                className="w-full bg-[#faf5f8] border border-[#f2e4ec] rounded-xl p-3 text-xs font-semibold outline-none focus:border-brand-primary focus:bg-white transition"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setIsAddonModalOpen(false); setEditingAddon(null); }}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs rounded-xl shadow-md transition"
              >
                Save Add-on
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
