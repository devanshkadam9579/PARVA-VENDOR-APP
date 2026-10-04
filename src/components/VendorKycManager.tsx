import React, { useState } from 'react';
import { 
  ShieldCheck, Upload, CheckCircle2, AlertCircle, FileText, 
  User, Phone, MapPin, Building, CreditCard, Image as ImageIcon,
  Clock, AlertTriangle, Eye, Check
} from 'lucide-react';
import { VendorKycData, VendorProfile } from '../types';
import { compressImage } from '../lib/imageCompressor';

export interface VendorKycManagerProps {
  vendor: VendorProfile;
  onUpdateKyc: (kycData: VendorKycData) => Promise<void>;
}

export function VendorKycManager({ vendor, onUpdateKyc }: VendorKycManagerProps) {
  const initialKyc: VendorKycData = vendor.kyc || {
    aadhaarNumber: '',
    aadhaarFrontUrl: '',
    aadhaarBackUrl: '',
    panNumber: '',
    panUrl: '',
    gstNumber: '',
    licenseNumber: '',
    licenseUrl: '',
    registeredAddress: vendor.location || '',
    contactPerson: vendor.founderName || '',
    contactPhone: vendor.phone || '',
    profilePicUrl: vendor.coverImage || vendor.images?.[0] || '',
    status: 'NOT_SUBMITTED'
  };

  const [formData, setFormData] = useState<VendorKycData>(initialKyc);
  const [saving, setSaving] = useState(false);
  const [compressingField, setCompressingField] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFileUpload = async (field: keyof VendorKycData, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressingField(field);
    try {
      // Compress image from 5MB-10MB to ~40-60KB safely
      const result = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.72 });
      const origKb = Math.round(result.originalSizeBytes / 1024);
      const compKb = Math.round(result.compressedSizeBytes / 1024);
      
      setFormData(prev => ({
        ...prev,
        [field]: result.dataUrl
      }));
      setCompressionStats(prev => ({
        ...prev,
        [field]: `${origKb}KB → ${compKb}KB (-${result.reductionPercentage}%)`
      }));
    } catch (err) {
      console.error('Image compression error:', err);
      // Fallback
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          [field]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    } finally {
      setCompressingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const submission: VendorKycData = {
        ...formData,
        status: 'PENDING_VERIFICATION',
        submittedAt: new Date().toISOString()
      };
      await onUpdateKyc(submission);
      setFormData(submission);
      setSuccessMsg('KYC Documents submitted successfully! Parva Admin team will review and verify your profile.');
    } catch (err: any) {
      alert('Failed to submit KYC documents: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-primary to-[#79194a] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-7 h-7 text-amber-300" />
              <h1 className="text-2xl font-black font-display tracking-tight">Partner Verification & KYC</h1>
            </div>
            <p className="text-white/80 text-sm max-w-xl">
              Complete your identity and business verification to unlock the <strong className="text-white">Verified Partner Badge</strong>, build trust with clients, and receive higher booking volume.
            </p>
          </div>

          {/* Status Badge */}
          <div>
            {formData.status === 'VERIFIED' && (
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 px-4 py-2 rounded-2xl text-emerald-100 backdrop-blur-md">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">KYC Verified</div>
                  <div className="text-[10px] text-emerald-200">Verified Partner Active</div>
                </div>
              </div>
            )}
            {formData.status === 'PENDING_VERIFICATION' && (
              <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 px-4 py-2 rounded-2xl text-amber-100 backdrop-blur-md">
                <Clock className="w-5 h-5 text-amber-300 animate-pulse" />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">Under Review</div>
                  <div className="text-[10px] text-amber-200">Admin reviewing docs</div>
                </div>
              </div>
            )}
            {formData.status === 'REJECTED' && (
              <div className="inline-flex items-center gap-2 bg-rose-500/20 border border-rose-400/40 px-4 py-2 rounded-2xl text-rose-100 backdrop-blur-md">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">KYC Rejected</div>
                  <div className="text-[10px] text-rose-200">Please re-submit docs</div>
                </div>
              </div>
            )}
            {formData.status === 'NOT_SUBMITTED' && (
              <div className="inline-flex items-center gap-2 bg-rose-500/20 border border-rose-400/40 px-4 py-2 rounded-2xl text-rose-100 backdrop-blur-md">
                <AlertTriangle className="w-5 h-5 text-rose-300 animate-pulse" />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">KYC INCOMPLETE</div>
                  <div className="text-[10px] text-rose-200">Mandatory documents pending</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {formData.status === 'REJECTED' && formData.rejectionReason && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-rose-900">Admin Rejection Notice:</h4>
            <p className="text-xs text-rose-700 mt-0.5">{formData.rejectionReason}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-bold text-emerald-900">{successMsg}</p>
        </div>
      )}

      {/* KYC Upload Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#f2e4ec] p-6 sm:p-8 shadow-xs space-y-8">
        {/* Section 1: Personal & Business Contact Details */}
        <div>
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-6">
            <User className="w-5 h-5 text-brand-primary" />
            <h2 className="text-lg font-bold text-gray-900">1. Contact & Business Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Contact Person / Founder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.contactPerson || ''}
                onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. Ramesh Sharma"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Official Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.contactPhone || ''}
                onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Registered Complete Business Address <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={formData.registeredAddress || ''}
                onChange={e => setFormData({ ...formData, registeredAddress: e.target.value })}
                placeholder="Complete street, building, area, city, pincode, state"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none resize-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Owner / Partner Profile Picture
              </label>
              <div className="flex items-center gap-4">
                {formData.profilePicUrl ? (
                  <img
                    src={formData.profilePicUrl}
                    alt="Profile"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-primary/30"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                    <User className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition">
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleFileUpload('profilePicUrl', e)}
                    />
                  </label>
                  <p className="text-[11px] text-gray-400 mt-1">Clear passport-style or professional headshot</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Aadhaar Card Verification */}
        <div>
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-6">
            <CreditCard className="w-5 h-5 text-brand-primary" />
            <h2 className="text-lg font-bold text-gray-900">2. Aadhaar Card Verification</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Aadhaar Number (12 Digits) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={14}
                value={formData.aadhaarNumber || ''}
                onChange={e => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                placeholder="XXXX XXXX XXXX"
                className="w-full sm:w-80 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Aadhaar Front */}
              <div className="border border-dashed border-gray-300 rounded-2xl p-4 bg-gray-50/50 hover:bg-gray-50 transition">
                <span className="block text-xs font-bold text-gray-700 mb-2">Aadhaar Front Side <span className="text-red-500">*</span></span>
                {formData.aadhaarFrontUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-gray-200">
                    <img src={formData.aadhaarFrontUrl} alt="Aadhaar Front" className="w-full h-36 object-cover" />
                    <button
                      type="button"
                      onClick={() => setPreviewImage(formData.aadhaarFrontUrl || null)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition gap-1 text-xs font-bold"
                    >
                      <Eye className="w-4 h-4" /> View Full
                    </button>
                  </div>
                ) : (
                  <div className="h-36 rounded-xl border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 gap-2">
                    <FileText className="w-8 h-8 text-gray-300" />
                    <span className="text-xs">No Front Image Uploaded</span>
                  </div>
                )}
                <label className="mt-3 cursor-pointer w-full py-2 px-3 rounded-xl bg-white border border-gray-300 hover:border-brand-primary text-xs font-bold text-gray-700 text-center flex items-center justify-center gap-1.5 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{formData.aadhaarFrontUrl ? 'Change Front Photo' : 'Upload Aadhaar Front'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFileUpload('aadhaarFrontUrl', e)}
                  />
                </label>
              </div>

              {/* Aadhaar Back */}
              <div className="border border-dashed border-gray-300 rounded-2xl p-4 bg-gray-50/50 hover:bg-gray-50 transition">
                <span className="block text-xs font-bold text-gray-700 mb-2">Aadhaar Back Side <span className="text-red-500">*</span></span>
                {formData.aadhaarBackUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-gray-200">
                    <img src={formData.aadhaarBackUrl} alt="Aadhaar Back" className="w-full h-36 object-cover" />
                    <button
                      type="button"
                      onClick={() => setPreviewImage(formData.aadhaarBackUrl || null)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition gap-1 text-xs font-bold"
                    >
                      <Eye className="w-4 h-4" /> View Full
                    </button>
                  </div>
                ) : (
                  <div className="h-36 rounded-xl border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 gap-2">
                    <FileText className="w-8 h-8 text-gray-300" />
                    <span className="text-xs">No Back Image Uploaded</span>
                  </div>
                )}
                <label className="mt-3 cursor-pointer w-full py-2 px-3 rounded-xl bg-white border border-gray-300 hover:border-brand-primary text-xs font-bold text-gray-700 text-center flex items-center justify-center gap-1.5 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{formData.aadhaarBackUrl ? 'Change Back Photo' : 'Upload Aadhaar Back'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFileUpload('aadhaarBackUrl', e)}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: PAN Card Verification */}
        <div>
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-6">
            <Building className="w-5 h-5 text-brand-primary" />
            <h2 className="text-lg font-bold text-gray-900">3. PAN Card Verification</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                PAN Card Number (10 Alphanumeric) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={formData.panNumber || ''}
                onChange={e => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm uppercase focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                GST Number (Optional)
              </label>
              <input
                type="text"
                maxLength={15}
                value={formData.gstNumber || ''}
                onChange={e => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                placeholder="27AAAAA0000A1Z5"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm uppercase focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none"
              />
            </div>

            <div className="sm:col-span-2 border border-dashed border-gray-300 rounded-2xl p-4 bg-gray-50/50">
              <span className="block text-xs font-bold text-gray-700 mb-2">PAN Card Document Copy <span className="text-red-500">*</span></span>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {formData.panUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-gray-200 w-full sm:w-60 h-32">
                    <img src={formData.panUrl} alt="PAN Document" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPreviewImage(formData.panUrl || null)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition gap-1 text-xs font-bold"
                    >
                      <Eye className="w-4 h-4" /> View Full
                    </button>
                  </div>
                ) : (
                  <div className="w-full sm:w-60 h-32 rounded-xl border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 gap-2">
                    <FileText className="w-7 h-7 text-gray-300" />
                    <span className="text-xs">No PAN Uploaded</span>
                  </div>
                )}
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-300 hover:border-brand-primary text-xs font-bold text-gray-700 transition">
                    <Upload className="w-4 h-4" />
                    <span>{formData.panUrl ? 'Change PAN Photo' : 'Upload PAN Card Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleFileUpload('panUrl', e)}
                    />
                  </label>
                  <p className="text-[11px] text-gray-400 mt-1">Please ensure PAN number, name and DOB are clearly legible.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Business Licenses / FSSAI / Certificates (Optional) */}
        <div>
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-6">
            <FileText className="w-5 h-5 text-brand-primary" />
            <h2 className="text-lg font-bold text-gray-900">4. Business Licenses / FSSAI (If Applicable)</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                License / Registration Number (e.g. FSSAI, Shop Act, Trade License)
              </label>
              <input
                type="text"
                value={formData.licenseNumber || ''}
                onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="e.g. 10012345678901"
                className="w-full sm:w-80 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none"
              />
            </div>

            <div className="border border-dashed border-gray-300 rounded-2xl p-4 bg-gray-50/50">
              <span className="block text-xs font-bold text-gray-700 mb-2">License / Certificate Document</span>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {formData.licenseUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-gray-200 w-full sm:w-60 h-32">
                    <img src={formData.licenseUrl} alt="License" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPreviewImage(formData.licenseUrl || null)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition gap-1 text-xs font-bold"
                    >
                      <Eye className="w-4 h-4" /> View Full
                    </button>
                  </div>
                ) : (
                  <div className="w-full sm:w-60 h-32 rounded-xl border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 gap-2">
                    <FileText className="w-7 h-7 text-gray-300" />
                    <span className="text-xs">Optional Document</span>
                  </div>
                )}
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-300 hover:border-brand-primary text-xs font-bold text-gray-700 transition">
                    <Upload className="w-4 h-4" />
                    <span>{formData.licenseUrl ? 'Change License File' : 'Upload Business License'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleFileUpload('licenseUrl', e)}
                    />
                  </label>
                  <p className="text-[11px] text-gray-400 mt-1">Caterers, decorators, venue owners are advised to attach their trade license.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            🔒 All documents are encrypted & accessible only to Parva Trust & Safety Admins.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-brand-primary text-white font-bold text-sm shadow-md hover:bg-[#79194a] transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting for Verification...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>Submit KYC for Admin Approval</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl">
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold">Document Preview</span>
              <button 
                type="button" 
                onClick={() => setPreviewImage(null)}
                className="text-gray-400 hover:text-white text-xs font-bold px-2 py-1 rounded bg-white/10"
              >
                Close
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-100 max-h-[80vh] overflow-auto">
              <img src={previewImage} alt="Document" className="max-w-full h-auto rounded-lg shadow-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
