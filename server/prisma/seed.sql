-- Seed users (passwords hashed with bcrypt, agent123 and admin123)
INSERT INTO "user" (email, phone_number, "password_hash", "name", "role")
VALUES 
  ('agent1@gmail.com', '123-456-7890', '$2b$10$eUnSYctw2bA5lcDxvHyqOu4Bemi6NIQv0wTUJcIsr53t7fKi0SlOy', 'Agent Smith 1', 'user'),
  ('agent2@gmail.com', '124-456-7890', '$2b$10$eUnSYctw2bA5lcDxvHyqOu4Bemi6NIQv0wTUJcIsr53t7fKi0SlOy', 'Agent Smith 2', 'user'),
  ('admin1@gmail.com', '12093', '$2b$10$7.mXiBV57u05riDryVUTK.E9DqYtFMUM9i3HS6P2VTmaULAl1v8fm', 'Admin User 1', 'admin'),
  ('admin2@gmail.com', '12094', '$2b$10$7.mXiBV57u05riDryVUTK.E9DqYtFMUM9i3HS6P2VTmaULAl1v8fm', 'Admin User 2', 'admin')
ON CONFLICT (email) DO NOTHING;
