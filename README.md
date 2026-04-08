# Tuk an App — SaaS Platform for TukTuk Tour Management

Complete React + Vite + Tailwind + Supabase application for managing TukTuk tours in Lisbon.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables** (already in `.env`):
   - `VITE_SUPABASE_URL`: https://xpxvignbglkjchgsimfb.supabase.co
   - `VITE_SUPABASE_ANON_KEY`: sb_publishable_IacYsOQpUrmFVDZY_0QsLQ_HZCWI_5O

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v3
- **Routing**: React Router v6
- **Database**: Supabase (PostgreSQL)
- **Icons**: lucide-react
- **Dates**: date-fns (pt-PT locale)

## Key Features

### Owner Dashboard
- Real-time KPIs: daily/weekly/monthly revenue, tours today, top driver, top tuktuk
- 7-day revenue chart
- Fleet management (add/edit tuktuks, alert on insurance/maintenance expiry)
- Weekly booking calendar + list view
- Driver management & commission tracking
- Payment records with filtering & CSV export
- Company settings editor

### Driver App
- Today's shift view with assigned bookings
- Active tour timer and end-tour flow
- Booking history (last 30 + monthly commission)
- Profile editor

## Database Tables

All RLS enforced: owners see all company data, drivers see only their own records.

- `companies`: company_id, name, nif
- `profiles`: user_id, company_id, role (owner|driver), full_name, phone
- `tuktuks`: id, company_id, plate, nickname, status, color, km, insurance_expiry, next_service_km
- `bookings`: id, company_id, tuktuk_id, driver_id, customer details, tour_type, pax, times, price, status
- `shifts`: id, company_id, driver_id, tuktuk_id, shift_date, times
- `payments`: id, company_id, booking_id, method, amount, received_at, received_by
- `maintenance_logs`: id, company_id, tuktuk_id, log_date, type, km, cost

## Deploy to Vercel

1. Create a GitHub repo and push this folder
2. Import into Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy
5. Test signup at `https://your-vercel-domain.com/signup`

## Supabase Project Reference

Project: `xpxvignbglkjchgsimfb`
All tables are pre-created with RLS policies in place.
