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
  address: string;
  city: string;
  state: string;
  pincode: string;
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

export const DEALER_PRODUCTS: DealerProduct[] = [
  { id: "dp1", name: "Bosch Oil Filter",          brand: "Bosch",       category: "Filters",       price: 320,   mrp: 399,   sku: "BOF-001", stock: 48,  status: "in_stock",    description: "High-quality oil filter compatible with most Indian cars", image: "https://placehold.co/200x200/2563EB/white?text=Oil+Filter" },
  { id: "dp2", name: "Castrol GTX 20W-50 5L",     brand: "Castrol",     category: "Lubricants",    price: 1150,  mrp: 1350,  sku: "CAS-020", stock: 34,  status: "in_stock",    description: "Mineral engine oil for petrol and diesel engines", image: "https://placehold.co/200x200/DC2626/white?text=Engine+Oil" },
  { id: "dp3", name: "MRF Zapper-ES 90/90-17",    brand: "MRF",         category: "Tyres",         price: 1850,  mrp: 2100,  sku: "MRF-091", stock: 12,  status: "low_stock",   description: "Bias ply motorcycle tyre for city commuting", image: "https://placehold.co/200x200/374151/white?text=Tyre" },
  { id: "dp4", name: "Amaron PRO 35Ah Battery",   brand: "Amaron",      category: "Batteries",     price: 3200,  mrp: 3599,  sku: "AMR-035", stock: 8,   status: "low_stock",   description: "Maintenance-free car battery with 30-month warranty", image: "https://placehold.co/200x200/F59E0B/white?text=Battery" },
  { id: "dp5", name: "Bosch Aerotwin Wiper Pair",  brand: "Bosch",       category: "Wipers",        price: 650,   mrp: 799,   sku: "BOW-002", stock: 27,  status: "in_stock",    description: "Flat beam wiper blades for streak-free wiping", image: "https://placehold.co/200x200/0891B2/white?text=Wipers" },
  { id: "dp6", name: "NGK Spark Plug (Set of 4)",  brand: "NGK",         category: "Ignition",      price: 540,   mrp: 640,   sku: "NGK-004", stock: 0,   status: "out_of_stock","description": "Iridium spark plugs for better combustion efficiency", image: "https://placehold.co/200x200/7C3AED/white?text=Spark+Plugs" },
  { id: "dp7", name: "Bosch Disc Brake Pads F+R",  brand: "Bosch",       category: "Brakes",        price: 1100,  mrp: 1400,  sku: "BDP-007", stock: 19,  status: "in_stock",    description: "OE-quality disc brake pad set for front and rear", image: "https://placehold.co/200x200/059669/white?text=Brake+Pads" },
  { id: "dp8", name: "3M Car Polish 500g",          brand: "3M",          category: "Accessories",   price: 480,   mrp: 599,   sku: "3MP-500", stock: 55,  status: "in_stock",    description: "Swirl mark remover and polish compound for all paint types", image: "https://placehold.co/200x200/E11D48/white?text=Polish" },
  { id: "dp9", name: "Steering Cover (Universal)", brand: "AutoMax",     category: "Accessories",   price: 299,   mrp: 399,   sku: "AMX-SC1", stock: 4,   status: "low_stock",   description: "Anti-slip steering wheel cover for cars", image: "https://placehold.co/200x200/B45309/white?text=Steering" },
  { id: "dp10",name: "Air Filter Honda Activa",     brand: "Honda",       category: "Filters",       price: 180,   mrp: 220,   sku: "HAF-101", stock: 62,  status: "in_stock",    description: "Genuine air filter for Honda Activa 5G and 6G", image: "https://placehold.co/200x200/2563EB/white?text=Air+Filter"},
];

export const DEALER_VEHICLES: DealerVehicle[] = [
  { id: "dv1", name: "KTM Duke 390",         brand: "KTM",          type: "bike", year: 2024, price: 310000,  fuel: "Petrol",  transmission: "Manual",    color: "Orange",    mileage: "30 kmpl", stock: 3, status: "available", testDriveEnabled: true,  description: "Aggressive naked sports bike with liquid-cooled 373cc engine",           image: "https://placehold.co/400x250/FF6600/white?text=KTM+Duke+390" },
  { id: "dv2", name: "Royal Enfield Classic 350", brand: "Royal Enfield", type: "bike", year: 2024, price: 195000, fuel: "Petrol", transmission: "Manual", color: "Halcyon Black", mileage: "35 kmpl", stock: 5, status: "available", testDriveEnabled: true,  description: "Iconic retro cruiser with modern J-platform and 349cc engine",           image: "https://placehold.co/400x250/1a1a1a/white?text=RE+Classic+350" },
  { id: "dv3", name: "Tata Nexon EV Max",    brand: "Tata",         type: "car",  year: 2024, price: 1695000, fuel: "Electric", transmission: "Automatic", color: "Pristine White", mileage: "437 km range", stock: 2, status: "available", testDriveEnabled: true, description: "Feature-rich electric SUV with 40.5 kWh battery",                        image: "https://placehold.co/400x250/2563EB/white?text=Nexon+EV" },
  { id: "dv4", name: "Hyundai Creta 1.5 SX", brand: "Hyundai",    type: "car",  year: 2024, price: 1850000, fuel: "Petrol",  transmission: "Automatic", color: "Starry Night", mileage: "16.8 kmpl", stock: 1, status: "reserved",   testDriveEnabled: false, description: "Premium SUV with panoramic sunroof and ADAS suite",                    image: "https://placehold.co/400x250/374151/white?text=Hyundai+Creta" },
  { id: "dv5", name: "Honda Activa 6G",      brand: "Honda",       type: "bike", year: 2024, price: 82000,   fuel: "Petrol",  transmission: "CVT",       color: "Pearl Siren Blue", mileage: "50 kmpl", stock: 8, status: "available", testDriveEnabled: true, description: "India's best-selling scooter with OBD2 and silent start",               image: "https://placehold.co/400x250/0891B2/white?text=Activa+6G" },
  { id: "dv6", name: "Maruti Swift ZXi+",    brand: "Maruti",      type: "car",  year: 2024, price: 990000,  fuel: "Petrol",  transmission: "Manual",    color: "Midnight Blue",  mileage: "23.2 kmpl", stock: 4, status: "available", testDriveEnabled: true, description: "New-gen Swift with 1.2L Z-Series engine and 6-speed MT",               image: "https://placehold.co/400x250/1D4ED8/white?text=Swift+ZXi" },
];

export const DEALER_SERVICES: DealerService[] = [
  { id: "ds1", name: "Full Car Detailing",        category: "Detailing",   price: 2500, duration: "4 hrs",   description: "Complete interior + exterior detailing, machine polish and wax", available: true,  slotsPerDay: 4, image: "https://placehold.co/400x200/059669/white?text=Detailing"     },
  { id: "ds2", name: "Periodic Service (Petrol)", category: "Service",     price: 1800, duration: "3 hrs",   description: "Oil change, filter replacement, brake check and 25-point inspection", available: true, slotsPerDay: 6, image: "https://placehold.co/400x200/2563EB/white?text=Service"       },
  { id: "ds3", name: "AC Gas Refill & Check",     category: "AC Service",  price: 1200, duration: "1.5 hrs", description: "AC gas top-up, leak check and cooling system inspection",      available: true,  slotsPerDay: 8, image: "https://placehold.co/400x200/0891B2/white?text=AC+Service"    },
  { id: "ds4", name: "Waterless Wash",            category: "Wash",        price: 350,  duration: "45 min",  description: "Eco-friendly no-water exterior wash and interior vacuum",     available: true,  slotsPerDay: 12,image: "https://placehold.co/400x200/374151/white?text=Waterless+Wash" },
  { id: "ds5", name: "Ceramic Coating (Car)",     category: "Protection",  price: 18000,duration: "1 day",   description: "9H nano ceramic coating with 2-year protection warranty",    available: false, slotsPerDay: 2, image: "https://placehold.co/400x200/7C3AED/white?text=Ceramic"       },
  { id: "ds6", name: "Denting & Painting",        category: "Body Work",   price: 4500, duration: "2 days",  description: "Panel dent removal, primer, paint matching and clear coat",   available: true,  slotsPerDay: 3, image: "https://placehold.co/400x200/DC2626/white?text=Denting"       },
  { id: "ds7", name: "Tyre Rotation & Balancing", category: "Tyres",       price: 600,  duration: "1 hr",    description: "All 4 tyres rotated, balanced and pressure adjusted",         available: true,  slotsPerDay: 10,image: "https://placehold.co/400x200/F59E0B/white?text=Tyre+Rotation"  },
  { id: "ds8", name: "Battery Check & Jump Start",category: "Electrical",  price: 250,  duration: "30 min",  description: "Battery health test, terminal cleaning and jump start if needed", available: true, slotsPerDay: 15,image: "https://placehold.co/400x200/E11D48/white?text=Battery"       },
];

export const FULL_DEALER_ORDERS: DealerOrder[] = [
  { id: "ORD-1001", customer: "Arjun Sharma",   customerId: "c1", phone: "+91 98765 43210", item: "Castrol GTX 20W-50",        itemType: "product", qty: 2,  total: 2300,   status: "pending",   time: "10:32 AM", date: "28 Jun 2026", address: "14, MG Road, Bengaluru" },
  { id: "ORD-1002", customer: "Priya Nair",     customerId: "c2", phone: "+91 99001 12233", item: "Periodic Service (Petrol)", itemType: "service", qty: 1,  total: 1800,   status: "accepted",  time: "09:15 AM", date: "28 Jun 2026", address: "Koramangala, Bengaluru"  },
  { id: "ORD-1003", customer: "Rahul Gupta",    customerId: "c3", phone: "+91 87654 32100", item: "Amaron PRO 35Ah Battery",   itemType: "product", qty: 1,  total: 3200,   status: "packed",    time: "Yesterday",date: "27 Jun 2026", address: "HSR Layout, Bengaluru"   },
  { id: "ORD-1004", customer: "Sneha Patel",    customerId: "c4", phone: "+91 91234 56789", item: "Honda Activa 6G",           itemType: "vehicle", qty: 1,  total: 82000,  status: "ready",     time: "Yesterday",date: "27 Jun 2026", address: "Whitefield, Bengaluru"   },
  { id: "ORD-1005", customer: "Vikram Singh",   customerId: "c5", phone: "+91 80001 23456", item: "MRF Zapper-ES Tyre ×2",    itemType: "product", qty: 2,  total: 3700,   status: "delivered", time: "26 Jun",   date: "26 Jun 2026", address: "Jayanagar, Bengaluru"    },
  { id: "ORD-1006", customer: "Aisha Khan",     customerId: "c6", phone: "+91 88776 55443", item: "Full Car Detailing",        itemType: "service", qty: 1,  total: 2500,   status: "delivered", time: "25 Jun",   date: "25 Jun 2026", address: "Indiranagar, Bengaluru"  },
  { id: "ORD-1007", customer: "Karthik Rajan",  customerId: "c7", phone: "+91 77889 90011", item: "Bosch Disc Brake Pads",     itemType: "product", qty: 1,  total: 1100,   status: "cancelled", time: "24 Jun",   date: "24 Jun 2026", address: "Electronic City, Bengaluru"},
  { id: "ORD-1008", customer: "Meera Iyer",     customerId: "c8", phone: "+91 99887 76655", item: "AC Gas Refill & Check",     itemType: "service", qty: 1,  total: 1200,   status: "pending",   time: "11:40 AM", date: "28 Jun 2026", address: "BTM Layout, Bengaluru"   },
  { id: "ORD-1009", customer: "Rohit Verma",    customerId: "c9", phone: "+91 98001 22334", item: "Maruti Swift ZXi+",         itemType: "vehicle", qty: 1,  total: 990000, status: "accepted",  time: "08:55 AM", date: "28 Jun 2026", address: "Rajajinagar, Bengaluru"  },
  { id: "ORD-1010", customer: "Divya Krishnan", customerId: "c10",phone: "+91 81234 00987", item: "NGK Spark Plug Set",        itemType: "product", qty: 2,  total: 1080,   status: "packed",    time: "23 Jun",   date: "23 Jun 2026", address: "Yelahanka, Bengaluru"    },
  { id: "ORD-1011", customer: "Suresh Babu",    customerId: "c11",phone: "+91 95678 01234", item: "Tyre Rotation & Balancing", itemType: "service", qty: 1,  total: 600,    status: "delivered", time: "22 Jun",   date: "22 Jun 2026", address: "JP Nagar, Bengaluru"     },
  { id: "ORD-1012", customer: "Neha Sharma",    customerId: "c12",phone: "+91 79900 34512", item: "3M Car Polish 500g",        itemType: "product", qty: 3,  total: 1440,   status: "cancelled", time: "21 Jun",   date: "21 Jun 2026", address: "Marathahalli, Bengaluru" },
];

export const FULL_DRIVE_BOOKINGS: DriveBooking[] = [
  { id: "TD-001", customer: "Arjun Sharma",   customerId: "c1",  phone: "+91 98765 43210", vehicle: "KTM Duke 390",            vehicleId: "dv1", date: "29 Jun 2026", time: "10:00 AM", status: "confirmed", notes: "Customer wants a city ride test, 20 mins" },
  { id: "TD-002", customer: "Priya Nair",     customerId: "c2",  phone: "+91 99001 12233", vehicle: "Hyundai Creta 1.5 SX",   vehicleId: "dv4", date: "29 Jun 2026", time: "12:30 PM", status: "pending",   notes: "Comparing with Seltos, needs 30 min slot"    },
  { id: "TD-003", customer: "Vikram Singh",   customerId: "c5",  phone: "+91 80001 23456", vehicle: "Royal Enfield Classic 350",vehicleId:"dv2", date: "30 Jun 2026", time: "09:00 AM", status: "confirmed", notes: "Long ride enthusiast, wants highway slot"     },
  { id: "TD-004", customer: "Sneha Patel",    customerId: "c4",  phone: "+91 91234 56789", vehicle: "Tata Nexon EV Max",      vehicleId: "dv3", date: "30 Jun 2026", time: "11:00 AM", status: "pending",   notes: "First EV consideration, needs range demo"    },
  { id: "TD-005", customer: "Rohit Verma",    customerId: "c9",  phone: "+91 98001 22334", vehicle: "Maruti Swift ZXi+",      vehicleId: "dv6", date: "28 Jun 2026", time: "02:00 PM", status: "completed", notes: "Bought the car after test drive"              },
  { id: "TD-006", customer: "Meera Iyer",     customerId: "c8",  phone: "+91 99887 76655", vehicle: "Honda Activa 6G",        vehicleId: "dv5", date: "28 Jun 2026", time: "04:30 PM", status: "rejected",  notes: "Rescheduled — customer unavailable"          },
  { id: "TD-007", customer: "Karthik Rajan",  customerId: "c7",  phone: "+91 77889 90011", vehicle: "KTM Duke 390",            vehicleId: "dv1", date: "01 Jul 2026", time: "10:00 AM", status: "pending",   notes: "Adventure rider, wants track feel"           },
  { id: "TD-008", customer: "Divya Krishnan", customerId: "c10", phone: "+91 81234 00987", vehicle: "Tata Nexon EV Max",      vehicleId: "dv3", date: "01 Jul 2026", time: "03:00 PM", status: "confirmed", notes: "Husband already shortlisted, final decision" },
];

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
