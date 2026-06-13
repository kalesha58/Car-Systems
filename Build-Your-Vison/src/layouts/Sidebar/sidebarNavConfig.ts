import {
  BarChart3,
  Battery,
  Building2,
  CalendarCheck,
  CarFront,
  LayoutDashboard,
  Package,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Tags,
  Ticket,
  Users,
  Wrench,
  BadgeCheck,
  Car,
  CarTaxiFront,
  CircleDot,
  type LucideIcon,
} from 'lucide-react';

export interface INavLink {
  path: string;
  label: string;
  icon: LucideIcon;
  /** When true, NavLink uses `end` (exact match only). */
  end?: boolean;
}

export interface INavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: INavLink[];
}

export const dashboardNavItem: INavLink = {
  path: '/dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard,
};

export const navGroups: INavGroup[] = [
  {
    id: 'people',
    label: 'People',
    icon: Users,
    items: [
      { path: '/users', label: 'Users', icon: Users },
      { path: '/dealers', label: 'Dealers', icon: Building2 },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    items: [
      { path: '/products', label: 'Products', icon: Package },
      { path: '/services', label: 'Services', icon: Wrench },
      { path: '/vehicles', label: 'Vehicles', icon: CarFront },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: ShoppingCart,
    items: [
      { path: '/orders', label: 'Orders', icon: ShoppingCart },
      { path: '/service-bookings', label: 'Bookings', icon: CalendarCheck },
      { path: '/test-drives', label: 'Test Drives', icon: CarTaxiFront },
      { path: '/tyre-services', label: 'Tyre Service', icon: CircleDot },
      { path: '/coupons', label: 'Coupons', icon: Ticket },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: BarChart3,
    items: [
      { path: '/reports', label: 'Reports', icon: BarChart3 },
      { path: '/moderation/reports', label: 'Moderation', icon: ShieldAlert },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Sparkles,
    items: [
      { path: '/settings', label: 'Categories', icon: Tags, end: true },
      { path: '/settings/battery-types', label: 'Battery Types', icon: Battery },
      { path: '/settings/product-brands', label: 'Product Brands', icon: BadgeCheck },
      { path: '/settings/vehicle-brands', label: 'Vehicle Brands', icon: Car },
      { path: '/settings/app', label: 'App Settings', icon: Sparkles },
    ],
  },
];

export const isNavLinkActive = (pathname: string, item: INavLink): boolean => {
  if (item.end) {
    return pathname === item.path;
  }
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
};

export const getActiveGroupId = (pathname: string): string | null => {
  for (const group of navGroups) {
    if (group.items.some((item) => isNavLinkActive(pathname, item))) {
      return group.id;
    }
  }
  return null;
};
