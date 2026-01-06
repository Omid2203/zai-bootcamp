-- Add is_active column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create touch_points table
CREATE TABLE IF NOT EXISTS touch_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  author_id uuid REFERENCES users(id),
  author_name text NOT NULL,
  author_avatar text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE touch_points ENABLE ROW LEVEL SECURITY;

-- RLS policies for touch_points
CREATE POLICY "Touch points viewable by authenticated" ON touch_points
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Touch points insertable by authenticated" ON touch_points
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
