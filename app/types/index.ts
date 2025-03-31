// app/types/index.ts
// @ts-nocheck
// نوع المستخدم
export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  created_at: string;
}

// أدوار المستخدمين
export enum UserRole {
  ADMIN = 'ADMIN',
  SHOP = 'SHOP',
  CUSTOMER = 'CUSTOMER'
}

// نوع العميل
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

// نوع السيارة
export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  plate_number: string;
  color: string;
  vin?: string;
  customer_id: string;
  customer?: Customer;
}

// تصدير افتراضي لدعم NOBRIDGE
export default {
  UserRole
};

export type Shop = {
  id: string;
  name: string;
  owner_id: string;
  phone: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export type ServiceCategory = {
  id: string;
  name: string;
  description: string;
};

export type ServiceVisit = {
  id: string;
  car_id: string;
  shop_id: string;
  service_category_id: string;
  date: string;
  mileage?: number;
  notes?: string;
  price: number;
  next_service_reminder?: string;
};

export type VehicleType = {
  id: string;
  name: string;
};

export type VehicleModel = {
  id: string;
  type_id: string;
  name: string;
  year_start: number;
  year_end?: number;
}; 