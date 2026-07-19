export type DealerType =
  | "Automobile Showroom"
  | "Bike Dealer"
  | "Spare Parts Dealer"
  | "Vehicle Wash Station"
  | "Mechanic Workshop"
  | "Detailing Center"
  | "Riding Gear Store";

export interface DealerCapabilities {
  hasProducts: boolean;
  hasVehicles: boolean;
  hasServices: boolean;
  hasDrive: boolean;
}

export const DEALER_TYPE_CAPABILITIES: Record<DealerType, DealerCapabilities> = {
  "Automobile Showroom":  { hasProducts: true,  hasVehicles: true,  hasServices: true,  hasDrive: true  },
  "Bike Dealer":          { hasProducts: true,  hasVehicles: true,  hasServices: true,  hasDrive: true  },
  "Spare Parts Dealer":   { hasProducts: true,  hasVehicles: false, hasServices: false, hasDrive: false },
  "Vehicle Wash Station": { hasProducts: false, hasVehicles: false, hasServices: true,  hasDrive: false },
  "Mechanic Workshop":    { hasProducts: false, hasVehicles: false, hasServices: true,  hasDrive: false },
  "Detailing Center":     { hasProducts: false, hasVehicles: false, hasServices: true,  hasDrive: false },
  "Riding Gear Store":    { hasProducts: true,  hasVehicles: false, hasServices: true,  hasDrive: false },
};

export const DEFAULT_DEALER_CAPABILITIES: DealerCapabilities = {
  hasProducts: true,
  hasVehicles: false,
  hasServices: false,
  hasDrive: false,
};

export function isKnownDealerType(value: string | null | undefined): value is DealerType {
  return Boolean(value && value in DEALER_TYPE_CAPABILITIES);
}

export function getCapabilitiesForDealerType(
  dealerType: string | null | undefined,
): DealerCapabilities {
  if (isKnownDealerType(dealerType)) {
    return DEALER_TYPE_CAPABILITIES[dealerType];
  }
  return DEFAULT_DEALER_CAPABILITIES;
}

export interface DealerTypeInfo {
  type: DealerType;
  icon: string;
  description: string;
  color: string;
}

export const DEALER_TYPE_LIST: DealerTypeInfo[] = [
  { type: "Automobile Showroom",  icon: "truck",       description: "Sell cars, bikes, and offer full servicing and test drives",  color: "#E60012" },
  { type: "Bike Dealer",          icon: "wind",        description: "Two-wheeler showroom with inventory, service and test rides", color: "#7C3AED" },
  { type: "Spare Parts Dealer",   icon: "tool",        description: "Sell spare parts and accessories across all vehicle brands",  color: "#DC2626" },
  { type: "Vehicle Wash Station", icon: "droplet",     description: "Offer car and bike wash, detailing and cleaning services",   color: "#0891B2" },
  { type: "Mechanic Workshop",    icon: "settings",    description: "Repairs, maintenance and general servicing for vehicles",    color: "#B45309" },
  { type: "Detailing Center",     icon: "star",        description: "Premium exterior and interior detailing and protection",     color: "#059669" },
  { type: "Riding Gear Store",    icon: "shield",      description: "Helmets, jackets, gloves, boots and riding accessories",    color: "#E11D48" },
];

/** Dashboard hero illustrations keyed by dealer business type */
export const DEALER_TYPE_ILLUSTRATIONS: Record<DealerType, string> = {
  "Automobile Showroom":
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&auto=format&fit=crop&q=80',
  "Bike Dealer":
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&auto=format&fit=crop&q=80',
  "Spare Parts Dealer":
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&auto=format&fit=crop&q=80',
  "Vehicle Wash Station":
    'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&auto=format&fit=crop&q=80',
  "Mechanic Workshop":
    'https://images.unsplash.com/photo-1487754180451-cd872bc30ad5?w=400&auto=format&fit=crop&q=80',
  "Detailing Center":
    'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400&auto=format&fit=crop&q=80',
  "Riding Gear Store":
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop&q=80',
};

export interface BusinessProfile {
  businessName: string;
  ownerName: string;
  mobile: string;
  email: string;
  gst: string;
  registrationNumber: string;
  establishedYear: string;
  website: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  workingDays: string;
  workingHoursOpen: string;
  workingHoursClose: string;
  facebook: string;
  instagram: string;
  youtube: string;
  upiId: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  storeLogo: string | null;
  storeBanner: string | null;
}

export interface DealerProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  mrp: number;
  sku: string;
  stock: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  description: string;
  image: string;
}

export interface DealerVehicle {
  id: string;
  name: string;
  brand: string;
  type: "car" | "bike";
  year: number;
  price: number;
  fuel: string;
  transmission: string;
  color: string;
  mileage: string;
  stock: number;
  status: "available" | "sold" | "reserved";
  testDriveEnabled: boolean;
  description: string;
  image: string;
}

export interface DealerService {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: string;
  description: string;
  available: boolean;
  slotsPerDay: number;
  image: string;
}

export interface DealerOrder {
  id: string;
  customer: string;
  customerId: string;
  phone: string;
  item: string;
  itemType: "product" | "vehicle" | "service";
  qty: number;
  total: number;
  status: "pending" | "accepted" | "packed" | "ready" | "delivered" | "cancelled";
  time: string;
  date: string;
  address: string;
}

export interface DriveBooking {
  id: string;
  customer: string;
  customerId: string;
  phone: string;
  vehicle: string;
  vehicleId: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "rejected";
  notes: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  totalOrders: number;
  totalSpend: number;
  lastOrder: string;
}

export const CUSTOMERS: Customer[] = [
  { id: "c1",  name: "Arjun Sharma",   phone: "+91 98765 43210", email: "arjun@example.com",   city: "Bengaluru", totalOrders: 4,  totalSpend: 9800,   lastOrder: "28 Jun 2026" },
  { id: "c2",  name: "Priya Nair",     phone: "+91 99001 12233", email: "priya@example.com",   city: "Bengaluru", totalOrders: 2,  totalSpend: 3000,   lastOrder: "28 Jun 2026" },
  { id: "c3",  name: "Rahul Gupta",    phone: "+91 87654 32100", email: "rahul@example.com",   city: "Bengaluru", totalOrders: 7,  totalSpend: 21400,  lastOrder: "27 Jun 2026" },
  { id: "c4",  name: "Sneha Patel",    phone: "+91 91234 56789", email: "sneha@example.com",   city: "Bengaluru", totalOrders: 1,  totalSpend: 82000,  lastOrder: "27 Jun 2026" },
  { id: "c5",  name: "Vikram Singh",   phone: "+91 80001 23456", email: "vikram@example.com",  city: "Bengaluru", totalOrders: 3,  totalSpend: 7200,   lastOrder: "26 Jun 2026" },
  { id: "c6",  name: "Aisha Khan",     phone: "+91 88776 55443", email: "aisha@example.com",   city: "Bengaluru", totalOrders: 5,  totalSpend: 12500,  lastOrder: "25 Jun 2026" },
  { id: "c7",  name: "Karthik Rajan",  phone: "+91 77889 90011", email: "karthik@example.com", city: "Bengaluru", totalOrders: 2,  totalSpend: 5100,   lastOrder: "24 Jun 2026" },
  { id: "c8",  name: "Meera Iyer",     phone: "+91 99887 76655", email: "meera@example.com",   city: "Bengaluru", totalOrders: 6,  totalSpend: 8800,   lastOrder: "28 Jun 2026" },
  { id: "c9",  name: "Rohit Verma",    phone: "+91 98001 22334", email: "rohit@example.com",   city: "Bengaluru", totalOrders: 2,  totalSpend: 991800, lastOrder: "28 Jun 2026" },
  { id: "c10", name: "Divya Krishnan", phone: "+91 81234 00987", email: "divya@example.com",   city: "Bengaluru", totalOrders: 3,  totalSpend: 4580,   lastOrder: "23 Jun 2026" },
];
