-- ============================================
-- Supabase Database Setup for Car Share App
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query)
-- ============================================

-- 1. Create users table (linked to Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('PASSENGER', 'DRIVER', 'ADMIN')),
  is_verified BOOLEAN DEFAULT FALSE,
  license_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for users table
CREATE POLICY "Users can view own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Service role can do anything" 
  ON users FOR ALL 
  USING (true);

-- 4. Create cars table
CREATE TABLE IF NOT EXISTS cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  license_plate TEXT NOT NULL,
  color TEXT,
  seats INTEGER NOT NULL,
  price_per_day DECIMAL(10, 2) NOT NULL,
  hourly_rate DECIMAL(10, 2),
  location TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RENTED', 'MAINTENANCE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available cars" 
  ON cars FOR SELECT 
  USING (status = 'AVAILABLE' OR owner_id = auth.uid());

CREATE POLICY "Verified drivers can insert cars" 
  ON cars FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'DRIVER' 
      AND is_verified = true
    )
  );

CREATE POLICY "Owners can update their cars" 
  ON cars FOR UPDATE 
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their cars" 
  ON cars FOR DELETE 
  USING (owner_id = auth.uid());

-- 5. Create carpools table
CREATE TABLE IF NOT EXISTS carpools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  available_seats INTEGER NOT NULL,
  price_per_seat DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE carpools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view carpools" 
  ON carpools FOR SELECT 
  USING (true);

CREATE POLICY "Verified drivers can create carpools" 
  ON carpools FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'DRIVER' 
      AND is_verified = true
    )
  );

CREATE POLICY "Drivers can update their carpools" 
  ON carpools FOR UPDATE 
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can delete their carpools" 
  ON carpools FOR DELETE 
  USING (driver_id = auth.uid());

-- 6. Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  carpool_id UUID REFERENCES carpools(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT booking_type_check CHECK (
    (car_id IS NOT NULL AND carpool_id IS NULL) OR 
    (car_id IS NULL AND carpool_id IS NOT NULL)
  )
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings" 
  ON bookings FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create bookings" 
  ON bookings FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their bookings" 
  ON bookings FOR UPDATE 
  USING (user_id = auth.uid());

-- 7. Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(booking_id, reviewer_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" 
  ON reviews FOR SELECT 
  USING (true);

CREATE POLICY "Users can create reviews for their bookings" 
  ON reviews FOR INSERT 
  WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE id = booking_id 
      AND user_id = auth.uid()
    )
  );

-- 8. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create triggers for all tables
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cars_updated_at 
  BEFORE UPDATE ON cars 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carpools_updated_at 
  BEFORE UPDATE ON carpools 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON bookings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_cars_owner_id ON cars(owner_id);
CREATE INDEX idx_cars_status ON cars(status);
CREATE INDEX idx_carpools_driver_id ON carpools(driver_id);
CREATE INDEX idx_carpools_departure_time ON carpools(departure_time);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_car_id ON bookings(car_id);
CREATE INDEX idx_bookings_carpool_id ON bookings(carpool_id);
CREATE INDEX idx_reviews_car_id ON reviews(car_id);

-- 11. Insert test admin user (optional - change email/password as needed)
-- Note: You'll need to create the auth user first in Supabase Auth UI
-- Then run this with the actual UUID from auth.users
/*
INSERT INTO users (id, email, name, role, is_verified)
VALUES (
  'YOUR-AUTH-USER-UUID-HERE',
  'admin@carshare.com',
  'Admin User',
  'ADMIN',
  true
);
*/

-- ============================================
-- Setup Complete! 🎉
-- ============================================
-- Next steps:
-- 1. Test by registering a new user in your app
-- 2. Check if the user appears in the users table
-- 3. Manually verify a driver to test car creation
-- 4. Enable email verification in Supabase settings
-- ============================================
