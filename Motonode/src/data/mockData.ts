export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  category: string;
  image: string;
  description: string;
  inStock: boolean;
  tags: string[];
  dealerName?: string;
  dealerId?: string;
  distance?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  price: number;
  type: "car" | "bike";
  year: number;
  fuel: string;
  transmission: string;
  mileage: string;
  image: string;
  description: string;
  specs: { label: string; value: string }[];
  dealerName: string;
  dealerId: string;
}

export interface Service {
  id: string;
  name: string;
  dealerName: string;
  dealerId: string;
  dealerType: string;
  price: number;
  duration: string;
  rating: number;
  reviews: number;
  category: string;
  image: string;
  description: string;
  distance: string;
  isOpen: boolean;
}

export interface Order {
  id: string;
  date: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  items: { name: string; qty: number; price: number }[];
  total: number;
  estimatedDelivery: string;
}

export interface CommunityPost {
  id: string;
  user: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  vehicle?: string;
}

export interface GarageVehicle {
  id: string;
  name: string;
  brand: string;
  year: number;
  regNumber: string;
  fuel: string;
  image: string;
  nextService: string;
  insurance: string;
  kmsDriven: number;
}

export interface Dealer {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviews: number;
  distance: string;
  isOpen: boolean;
  closingTime: string;
  address: string;
  categories: ("products" | "vehicles" | "services" | "drive")[];
}

export const CATEGORIES = [
  { id: "spare-parts", label: "Spare Parts", icon: "settings" },
  { id: "accessories", label: "Accessories", icon: "tool" },
  { id: "riding-gear", label: "Riding Gear", icon: "shield" },
  { id: "tyres", label: "Tyres", icon: "circle" },
  { id: "batteries", label: "Batteries", icon: "battery-charging" },
  { id: "lubricants", label: "Lubricants", icon: "droplet" },
  { id: "electronics", label: "Electronics", icon: "cpu" },
  { id: "tools", label: "Tools", icon: "tool" },
];

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Castrol EDGE 5W30 Engine Oil 4L",
    brand: "Castrol",
    price: 2999,
    originalPrice: 3600,
    discount: 18,
    rating: 4.5,
    reviews: 1240,
    category: "lubricants",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
    description: "Castrol EDGE with Fluid TITANIUM Technology is our strongest oil yet, formulated with Fluid TITANIUM Technology to strengthen the oil film and reduce metal-to-metal contact.",
    inStock: true,
    tags: ["engine-oil", "castrol", "5w30"],
    dealerName: "Speed Auto Parts",
    distance: "1.2 km",
  },
  {
    id: "p2",
    name: "Michelin Pilot Street 2 Tyre 110/70",
    brand: "Michelin",
    price: 4299,
    originalPrice: 5300,
    discount: 19,
    rating: 4.7,
    reviews: 856,
    category: "tyres",
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80",
    description: "The Michelin Pilot Street 2 is designed for sport and sport-touring motorcycles requiring high performance and durability.",
    inStock: true,
    tags: ["tyre", "michelin", "rear"],
    dealerName: "Balaji Tyre Care",
    distance: "2.4 km",
  },
  {
    id: "p3",
    name: "Steelbird SBA-2 Full Face Helmet",
    brand: "Steelbird",
    price: 1999,
    originalPrice: 3500,
    discount: 43,
    rating: 4.3,
    reviews: 2180,
    category: "riding-gear",
    image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&q=80",
    description: "Full face helmet with ABS shell, EPS liner for energy absorption, and quick-release visor mechanism.",
    inStock: true,
    tags: ["helmet", "full-face", "steelbird"],
    dealerName: "Riderz Zone",
    distance: "3.1 km",
  },
  {
    id: "p4",
    name: "Exide 12V 35Ah Bike Battery",
    brand: "Exide",
    price: 3499,
    originalPrice: 4200,
    discount: 17,
    rating: 4.6,
    reviews: 620,
    category: "batteries",
    image: "https://images.unsplash.com/photo-1609429019995-8c40f49535a5?w=400&q=80",
    description: "Maintenance-free battery with superior starting power and long life. Suitable for all 150-250cc motorcycles.",
    inStock: true,
    tags: ["battery", "exide", "12v"],
    dealerName: "Power House Batteries",
    distance: "1.8 km",
  },
  {
    id: "p5",
    name: "Brembo Brake Pad Set Front",
    brand: "Brembo",
    price: 1850,
    originalPrice: 2200,
    discount: 16,
    rating: 4.8,
    reviews: 445,
    category: "spare-parts",
    image: "https://images.unsplash.com/photo-1558618048-fbd0dcece0f3?w=400&q=80",
    description: "OEM-quality Brembo brake pads for superior stopping power and fade resistance. Compatible with major bike models.",
    inStock: false,
    tags: ["brake-pads", "brembo", "front"],
    dealerName: "Krishna Bike Workshop",
    distance: "1.1 km",
  },
  {
    id: "p6",
    name: "Royal Enfield Tank Bag Waterproof",
    brand: "Royal Enfield",
    price: 2499,
    originalPrice: 3200,
    discount: 22,
    rating: 4.4,
    reviews: 320,
    category: "accessories",
    image: "https://images.unsplash.com/photo-1543071220-6ee5bf71a54e?w=400&q=80",
    description: "Waterproof magnetic tank bag with 20L capacity, transparent map pocket, and quick-release system.",
    inStock: true,
    tags: ["tank-bag", "royal-enfield", "accessories"],
    dealerName: "RE Indiranagar",
    distance: "4.0 km",
  },
  {
    id: "p7",
    name: "Bosch O2 Lambda Sensor Universal",
    brand: "Bosch",
    price: 1299,
    originalPrice: 1800,
    discount: 28,
    rating: 4.2,
    reviews: 190,
    category: "spare-parts",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
    description: "Universal lambda sensor with 4-wire wideband design. Reduces emissions and improves fuel economy.",
    inStock: true,
    tags: ["sensor", "bosch", "lambda"],
    dealerName: "Speed Auto Parts",
    distance: "1.2 km",
  },
  {
    id: "p8",
    name: "Alpinestars GP Plus R V3 Gloves",
    brand: "Alpinestars",
    price: 5999,
    originalPrice: 7500,
    discount: 20,
    rating: 4.9,
    reviews: 280,
    category: "riding-gear",
    image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&q=80",
    description: "Race-replica leather gloves with carbon fiber knuckle protection and Superfabric palm reinforcement.",
    inStock: true,
    tags: ["gloves", "alpinestars", "leather"],
    dealerName: "Riderz Zone",
    distance: "3.1 km",
  },
];

export const VEHICLES: Vehicle[] = [
  {
    id: "v1",
    name: "KTM Duke 390 BS6",
    brand: "KTM",
    price: 299000,
    type: "bike",
    year: 2024,
    fuel: "Petrol",
    transmission: "Manual",
    mileage: "30 kmpl",
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80",
    description: "The KTM 390 Duke is the pinnacle of middleweight performance. With a powerful 399cc engine and advanced electronics.",
    specs: [
      { label: "Engine", value: "399cc Single-Cyl" },
      { label: "Power", value: "44 bhp" },
      { label: "Torque", value: "37 Nm" },
      { label: "Top Speed", value: "167 km/h" },
    ],
    dealerName: "KTM Bangalore North",
    dealerId: "d1",
  },
  {
    id: "v2",
    name: "Royal Enfield Classic 350",
    brand: "Royal Enfield",
    price: 195000,
    type: "bike",
    year: 2024,
    fuel: "Petrol",
    transmission: "Manual",
    mileage: "35 kmpl",
    image: "https://images.unsplash.com/photo-1543071220-6ee5bf71a54e?w=400&q=80",
    description: "The Royal Enfield Classic 350 is an iconic motorcycle with modern engineering and classic styling.",
    specs: [
      { label: "Engine", value: "349cc Single-Cyl" },
      { label: "Power", value: "20.2 bhp" },
      { label: "Torque", value: "27 Nm" },
      { label: "Top Speed", value: "130 km/h" },
    ],
    dealerName: "RE Indiranagar",
    dealerId: "d2",
  },
  {
    id: "v3",
    name: "Tata Nexon EV Max",
    brand: "Tata",
    price: 1895000,
    type: "car",
    year: 2024,
    fuel: "Electric",
    transmission: "Automatic",
    mileage: "437 km range",
    image: "https://images.unsplash.com/photo-1551830820-330a71b99659?w=400&q=80",
    description: "The Tata Nexon EV Max delivers exceptional range and performance with its 40.5 kWh battery pack.",
    specs: [
      { label: "Battery", value: "40.5 kWh" },
      { label: "Range", value: "437 km" },
      { label: "Power", value: "141 bhp" },
      { label: "0-100", value: "8.9 seconds" },
    ],
    dealerName: "Tata Motors Whitefield",
    dealerId: "d3",
  },
  {
    id: "v4",
    name: "Hyundai Creta 1.5 SX",
    brand: "Hyundai",
    price: 1650000,
    type: "car",
    year: 2024,
    fuel: "Petrol",
    transmission: "Automatic",
    mileage: "16.8 kmpl",
    image: "https://images.unsplash.com/photo-1609429019995-8c40f49535a5?w=400&q=80",
    description: "The all-new Creta comes with a bold design, panoramic sunroof, and Level 2 ADAS features.",
    specs: [
      { label: "Engine", value: "1.5L MPi" },
      { label: "Power", value: "113 bhp" },
      { label: "Torque", value: "143.8 Nm" },
      { label: "Boot Space", value: "433 L" },
    ],
    dealerName: "Hyundai HASS Koramangala",
    dealerId: "d4",
  },
];

export const SERVICES: Service[] = [
  {
    id: "s1",
    name: "Full Car Spa & Detailing",
    dealerName: "Speed Auto Detailing",
    dealerId: "d5",
    dealerType: "Detailing Center",
    price: 2999,
    duration: "4-5 hours",
    rating: 4.6,
    reviews: 256,
    category: "detailing",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
    description: "Complete exterior and interior detailing with ceramic coat, machine polish, and odor treatment.",
    distance: "2.3 km",
    isOpen: true,
  },
  {
    id: "s2",
    name: "Bike Periodic Service 3000km",
    dealerName: "Krishna Bike Workshop",
    dealerId: "d6",
    dealerType: "Mechanic Workshop",
    price: 799,
    duration: "2-3 hours",
    rating: 4.4,
    reviews: 890,
    category: "servicing",
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80",
    description: "Engine oil change, filter replacement, chain lubrication, brake inspection, and general checkup.",
    distance: "1.1 km",
    isOpen: true,
  },
  {
    id: "s3",
    name: "AC Gas Refill & Service",
    dealerName: "AutoFix Service Center",
    dealerId: "d7",
    dealerType: "Mechanic Workshop",
    price: 1499,
    duration: "1-2 hours",
    rating: 4.3,
    reviews: 420,
    category: "servicing",
    image: "https://images.unsplash.com/photo-1609429019995-8c40f49535a5?w=400&q=80",
    description: "Complete AC gas refill with leak detection, condenser cleaning, and cabin air filter replacement.",
    distance: "3.7 km",
    isOpen: false,
  },
  {
    id: "s4",
    name: "Waterless Car Wash Premium",
    dealerName: "AquaShield Auto Spa",
    dealerId: "d8",
    dealerType: "Vehicle Wash Station",
    price: 399,
    duration: "45 min",
    rating: 4.5,
    reviews: 640,
    category: "wash",
    image: "https://images.unsplash.com/photo-1551830820-330a71b99659?w=400&q=80",
    description: "Eco-friendly waterless wash with UV protection spray, interior vacuum, and dashboard shine.",
    distance: "0.8 km",
    isOpen: true,
  },
];

export const ORDERS: Order[] = [
  {
    id: "ORD12345",
    date: "Jun 25, 2026",
    status: "shipped",
    items: [{ name: "Steelbird SBA-2 Helmet", qty: 1, price: 1999 }],
    total: 1999,
    estimatedDelivery: "Jun 29, 2026",
  },
  {
    id: "ORD12280",
    date: "Jun 18, 2026",
    status: "delivered",
    items: [
      { name: "Castrol EDGE 5W30 4L", qty: 2, price: 5998 },
      { name: "Exide Bike Battery", qty: 1, price: 3499 },
    ],
    total: 9497,
    estimatedDelivery: "Jun 22, 2026",
  },
  {
    id: "ORD12190",
    date: "Jun 10, 2026",
    status: "delivered",
    items: [{ name: "Michelin Pilot Street 2 Tyre", qty: 2, price: 8598 }],
    total: 8598,
    estimatedDelivery: "Jun 14, 2026",
  },
];

export const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "cp1",
    user: "Arjun Sharma",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    time: "2h ago",
    content: "Just crossed 10,000 kms on my Duke 390! Best bike I've ever owned. The ABS brakes saved me once on NH-48. Absolute beast! 🔥",
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80",
    likes: 248,
    comments: 34,
    isLiked: false,
    vehicle: "KTM Duke 390",
  },
  {
    id: "cp2",
    user: "Priya Nair",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612e3eb?w=100&q=80",
    time: "5h ago",
    content: "Completed the Bangalore-Mysore highway ride with the Motonode community! 140km of pure joy. Thanks to everyone who joined!",
    image: "https://images.unsplash.com/photo-1543071220-6ee5bf71a54e?w=600&q=80",
    likes: 186,
    comments: 22,
    isLiked: true,
    vehicle: "Royal Enfield Classic 350",
  },
  {
    id: "cp3",
    user: "Rahul Menon",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    time: "1d ago",
    content: "Asked the Motonode AI about strange engine sounds at startup. It diagnosed it as a valve clearance issue. Saved me ₹8000 by fixing it early. This AI is insane!",
    likes: 312,
    comments: 45,
    isLiked: false,
  },
  {
    id: "cp4",
    user: "Sneha Reddy",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    time: "2d ago",
    content: "Just got the new Tata Nexon EV Max! Charged it to full in 56 minutes at a DC fast charger. Range is insane for city driving.",
    image: "https://images.unsplash.com/photo-1551830820-330a71b99659?w=600&q=80",
    likes: 421,
    comments: 58,
    isLiked: true,
    vehicle: "Tata Nexon EV Max",
  },
];

export const GARAGE_VEHICLES: GarageVehicle[] = [
  {
    id: "gv1",
    name: "Nexon EV",
    brand: "Tata",
    year: 2024,
    regNumber: "KA 05 EV 2210",
    fuel: "Electric",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&auto=format&fit=crop&q=80",
    nextService: "Sep 10, 2026",
    insurance: "Expires: Mar 2027",
    kmsDriven: 8230,
  },
  {
    id: "gv2",
    name: "Nexon EV",
    brand: "Tata",
    year: 2023,
    regNumber: "KA 01 AB 1234",
    fuel: "Electric",
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500&auto=format&fit=crop&q=80",
    nextService: "Jul 15, 2026",
    insurance: "Expires: Dec 2026",
    kmsDriven: 12480,
  },
];

export const DEALERS: Dealer[] = [
  {
    id: "d1",
    name: "KTM Bangalore North",
    type: "Bike Dealer",
    rating: 4.6,
    reviews: 420,
    distance: "3.2 km",
    isOpen: true,
    closingTime: "8 PM",
    address: "100 Feet Road, Indiranagar, Bangalore",
    categories: ["products", "vehicles", "services", "drive"],
  },
  {
    id: "d5",
    name: "Speed Auto Detailing",
    type: "Detailing Center",
    rating: 4.6,
    reviews: 256,
    distance: "2.3 km",
    isOpen: true,
    closingTime: "9 PM",
    address: "MG Road, Bangalore",
    categories: ["services"],
  },
];

export const DEALER_STATS = {
  revenue: 284500,
  revenueTrend: 12.4,
  orders: 48,
  ordersTrend: 8.2,
  bookings: 12,
  bookingsTrend: -3.1,
  customers: 230,
  customersTrend: 15.6,
};

export const DEALER_ORDERS = [
  { id: "DO001", customer: "Amit Kumar", item: "Castrol Engine Oil 4L", qty: 2, total: 5998, status: "pending", time: "10 min ago" },
  { id: "DO002", customer: "Sunita Rao", item: "Michelin Pilot Street 2 Tyre", qty: 1, total: 4299, status: "confirmed", time: "1h ago" },
  { id: "DO003", customer: "Kiran Patel", item: "Steelbird Full Face Helmet", qty: 1, total: 1999, status: "shipped", time: "3h ago" },
  { id: "DO004", customer: "Deepa Iyer", item: "Exide 12V Battery", qty: 1, total: 3499, status: "delivered", time: "Yesterday" },
];

export const DRIVE_BOOKINGS = [
  { id: "TD001", customer: "Rajesh Kumar", vehicle: "KTM Duke 390", date: "Jun 30, 2026", time: "10:00 AM", status: "confirmed", phone: "+91 98765 43210" },
  { id: "TD002", customer: "Meera Singh", vehicle: "Royal Enfield Classic 350", date: "Jul 1, 2026", time: "2:30 PM", status: "pending", phone: "+91 87654 32109" },
  { id: "TD003", customer: "Vikram Nair", vehicle: "KTM Duke 390", date: "Jul 3, 2026", time: "11:00 AM", status: "confirmed", phone: "+91 76543 21098" },
];

export const DEALER_INVENTORY = [
  { id: "i1", name: "Castrol EDGE 5W30 4L", sku: "CA-ENG-5W30", price: 2999, stock: 45, category: "Lubricants", status: "in_stock" },
  { id: "i2", name: "Michelin Pilot Street 2 110/70", sku: "MI-TYR-110", price: 4299, stock: 12, category: "Tyres", status: "in_stock" },
  { id: "i3", name: "Steelbird SBA-2 Helmet M", sku: "SB-HLM-M", price: 1999, stock: 3, category: "Riding Gear", status: "low_stock" },
  { id: "i4", name: "Exide 12V 35Ah Battery", sku: "EX-BAT-35", price: 3499, stock: 0, category: "Batteries", status: "out_of_stock" },
  { id: "i5", name: "Brembo Front Brake Pads", sku: "BR-BRK-F", price: 1850, stock: 8, category: "Spare Parts", status: "in_stock" },
];

export interface ServiceAddon {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface ServiceWorkshop {
  id: string;
  name: string;
  address: string;
  rating: number;
  distance: string;
  dealerId: string;
}

export interface TimeSlotGroup {
  period: "Morning" | "Afternoon" | "Evening";
  slots: string[];
}

export const SERVICE_ADDONS: ServiceAddon[] = [
  { id: "a1", name: "Air Filter Cleaning", description: "Deep clean of engine air filter", price: 399 },
  { id: "a2", name: "Cabin Filter Replacement", description: "Fresh cabin air filter install", price: 699 },
  { id: "a3", name: "Engine Flush", description: "Flush old oil residues before refill", price: 499 },
  { id: "a4", name: "Brake Pad Inspection", description: "Full brake system safety check", price: 299 },
];

export const SERVICE_WORKSHOPS: ServiceWorkshop[] = [
  {
    id: "w1",
    name: "Speed Auto Detailing",
    address: "MG Road, Koramangala, Bengaluru",
    rating: 4.6,
    distance: "2.3 km",
    dealerId: "d5",
  },
  {
    id: "w2",
    name: "Krishna Bike Workshop",
    address: "HSR Layout, Sector 2, Bengaluru",
    rating: 4.4,
    distance: "1.1 km",
    dealerId: "d6",
  },
  {
    id: "w3",
    name: "AutoFix Service Center",
    address: "Whitefield Main Road, Bengaluru",
    rating: 4.3,
    distance: "4.8 km",
    dealerId: "d7",
  },
];

export const SERVICE_TIME_SLOTS: TimeSlotGroup[] = [
  { period: "Morning", slots: ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM"] },
  { period: "Afternoon", slots: ["1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"] },
  { period: "Evening", slots: ["5:00 PM", "6:00 PM", "7:00 PM"] },
];

export function getServiceBookingDates(count = 14): { label: string; value: string }[] {
  const dates: { label: string; value: string }[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const value = d.toISOString().slice(0, 10);
    dates.push({ label, value });
  }
  return dates;
}

export function generateBookingId(): string {
  return `SB${Date.now().toString().slice(-8)}`;
}
