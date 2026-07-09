-- Seed users (passwords hashed with bcrypt, agent123 and admin123)
INSERT INTO "user" (email, phone_number, "password_hash", "name", "role")
VALUES 
  ('agent', '123-456-7890', '$2b$10$eUnSYctw2bA5lcDxvHyqOu4Bemi6NIQv0wTUJcIsr53t7fKi0SlOy', 'Agent Smith', 'user'),
  ('admin', '', '$2b$10$7.mXiBV57u05riDryVUTK.E9DqYtFMUM9i3HS6P2VTmaULAl1v8fm', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;
