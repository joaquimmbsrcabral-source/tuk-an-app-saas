export type DriverStatus = 'available' | 'busy' | 'offline'

export type Profile = {
  id: string
  company_id: string
  role: 'owner' | 'driver'
  full_name: string
  phone: string
  commission_pct: number
  status: DriverStatus
  status_updated_at: string | null
  last_seen_at: string | null
  is_super_admin: boolean
  created_at: string
}

export type Company = {
  id: string
  name: string
  nif: string
  default_commission_pct: number
  created_at: string
}

export type TourCatalogItem = {
  id: string
  company_id: string
  name: string
  description: string | null
  default_price: number
  default_duration_min: number
  active: boolean
  created_at: string
}

export type TukTuk = {
  id: string
  company_id: string
  plate: string
  nickname: string
  status: 'active' | 'maintenance' | 'retired'
  color: string
  km: number
  insurance_expiry: string
  next_service_km: number
  notes: string
  created_at: string
}

export type Booking = {
  id: string
  company_id: string
  tuktuk_id: string
  driver_id: string
  customer_name: string
  customer_phone: string
  tour_type: string
  pax: number
  start_at: string
  end_at: string
  price: number
  tip_amount: number
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  source: string
  pickup_location: string
  notes: string
  created_at: string
}

export type Shift = {
  id: string
  company_id: string
  driver_id: string
  tuktuk_id: string | null
  shift_date: string
  start_at: string | null
  end_at: string | null
  notes: string
  created_at: string
}

export type Payment = {
  id: string
  company_id: string
  booking_id: string
  method: 'cash' | 'mbway' | 'card' | 'transfer' | 'other'
  amount: number
  received_at: string
  received_by: string
  notes: string
  created_at: string
}

export type StreetSale = {
  id: string
  company_id: string
  driver_id: string
  tuktuk_id: string | null
  tour_name: string
  duration_min: number
  pax: number
  price: number
  payment_method: 'cash' | 'mbway' | 'card' | 'transfer' | 'other'
  tip_amount: number
  sold_at: string
  notes: string | null
  created_at: string
}

export type MaintenanceLog = {
  id: string
  company_id: string
  tuktuk_id: string
  log_date: string
  type: string
  km: number
  cost: number
  notes: string
  created_at: string
}

export type AuthUser = {
  id: string
  email: string
}
