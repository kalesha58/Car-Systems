export interface IDashboardStats {
  totalUsers: number;
  totalDealers: number;
  totalOrders: number;
  totalProducts: number;
}

export interface IChartData {
  month: string;
  users?: number;
  orders?: number;
}

export interface IOrderStatusData {
  name: string;
  value: number;
  percentage: number;
}

export interface IDashboardData {
  stats: IDashboardStats;
  usersPerMonth: IChartData[];
  ordersPerMonth: IChartData[];
  orderStatus: IOrderStatusData[];
}

