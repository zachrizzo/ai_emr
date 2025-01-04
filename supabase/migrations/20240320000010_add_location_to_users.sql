-- Add assigned_location column to users table
ALTER TABLE users ADD COLUMN assigned_location UUID REFERENCES locations(id);
