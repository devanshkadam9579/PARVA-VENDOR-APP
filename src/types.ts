export interface VendorServiceItem {
  id?: string;
  name: string;
  price: number;
  description?: string;
  unit?: string;
  pricingModel?: string;
  duration?: string;
  minimumGuests?: number;
  maximumGuests?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  images?: string[];
}

export interface VendorPackage {
  id: string;
  name: string;
  price: number;
  description: string;
  includedItems: string[];
}

export interface VendorAddon {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface VendorKycData {
  aadhaarNumber?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  panNumber?: string;
  panUrl?: string;
  gstNumber?: string;
  licenseNumber?: string;
  licenseUrl?: string;
  registeredAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  profilePicUrl?: string;
  status: 'NOT_SUBMITTED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  submittedAt?: string;
  verifiedAt?: string;
}

export interface VendorProfile {
  id: string;
  ownerUid: string;
  name: string;
  founderName: string;
  category: string;
  categories: string[];
  description: string;
  experience: string;
  location: string;
  serviceArea: string;
  phone: string;
  whatsapp: string;
  email: string;
  basePrice: number;
  rating: number;
  reviewCount: number;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'SUSPENDED';
  isVerified?: boolean;
  kyc?: VendorKycData;
  images: string[];
  coverImage?: string;
  services: VendorServiceItem[];
  packages?: VendorPackage[];
  addons?: VendorAddon[];
  busyDates: string[];
  busySlots?: Record<string, string[]>;
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorBooking {
  id: string;
  bookingIdString?: string;
  userId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  vendorId: string;
  serviceName: string;
  eventDate: string;
  eventTimeSlot: string;
  guestCount?: number;
  totalPrice: number;
  platformFee?: number;
  netPayout?: number;
  status: 'DRAFT' | 'PRICE_CONFIRMED' | 'SLOT_HELD' | 'PAYMENT_PENDING' | 'PAYMENT_SUCCESS' | 'VENDOR_PENDING' | 'VENDOR_ACCEPTED' | 'CONFIRMED' | 'EVENT_STARTED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'REFUND_PENDING' | 'REFUNDED';
  createdAt?: string;
}
