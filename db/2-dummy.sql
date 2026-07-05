-- ================================================
-- Dummy data inserts (10+ rows per table)
-- ================================================

-- Fixed: single BEGIN, removed duplicate
BEGIN;
SET CONSTRAINTS ALL DEFERRED;

-- call_status (with explicit IDs to match references)
INSERT INTO "call_status" ("id", "name")
VALUES
  (1, 'new'),
  (2, 'contacted'),
  (3, 'not_interested'),
  (4, 'busy'),
  (5, 'callback');

-- project (10 items)
INSERT INTO "project" ("id", "name", "description")
VALUES
  (1, 'Summer Sales Campaign', 'Outbound sales campaign for summer product line targeting warm leads'),
  (2, 'Customer Feedback Survey', 'Quarterly customer satisfaction survey for existing clients'),
  (3, 'Lead Generation Q3', 'Cold calling campaign to generate new leads for Q3 pipeline'),
  (4, 'Appointment Setting', 'Setting up demos and meetings with potential enterprise clients'),
  (5, 'Debt Collection', 'Follow-up calls for outstanding payments and payment plan arrangements'),
  (6, 'Market Research', 'Gathering market intelligence and competitor analysis data'),
  (7, 'Holiday Promotion', 'Promotional campaign for holiday season special offers and discounts'),
  (8, 'Product Launch Outreach', 'Introducing new product line to existing and potential customers'),
  (9, 'Customer Retention', 'Win-back campaign for churned customers with special offers'),
  (10, 'Event Registration', 'Inviting clients to annual conference and managing RSVPs');

-- user (12 items) – column name now matches table definition
INSERT INTO "user" ("id", "email", "phone_number", "password_hash", "name", "role", "otp", "otp_expiry", "jwt_token")
VALUES
  (1, 'admin_john@example.com', '+15551234567', '$2b$12$LJ3m4ys3Lk0TSwHCpWqFCOHfQdDlDjBq7V3P9M8xA4z8KqWxYz5Oa', 'John Smith', 'admin', NULL, NULL, NULL),
  (2, 'agent_sarah@example.com', '+15552345678', '$2b$12$Kd8xPq2MnR7Ts5YbWvZtEe9XcBnMkL4pH6JfG8hR3aC5dNsVqWyBx', 'Sarah Johnson', 'user', NULL, NULL, NULL),
  (3, 'agent_mike@example.com', '+15553456789', '$2b$12$Ab4cFg7HkL0PqRsUvWxYz2CdEfGhJkMn3OpQr5StUvWxYzAbCdEfG', 'Mike Williams', 'user', NULL, NULL, NULL),
  (4, 'agent_lisa@example.com', '+15554567890', '$2b$12$XyZaBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVw', 'Lisa Brown', 'user', NULL, NULL, NULL),
  (5, 'admin_emma@example.com', '+15555678901', '$2b$12$MnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKl', 'Emma Davis', 'admin', NULL, NULL, NULL),
  (6, 'agent_tom@example.com', '+15556789012', '$2b$12$DeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZaBc', 'Tom Wilson', 'user', NULL, NULL, NULL),
  (7, 'agent_amy@example.com', '+15557890123', '$2b$12$StUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQr', 'Amy Taylor', 'user', NULL, NULL, NULL),
  (8, 'agent_james@example.com', '+15558901234', '$2b$12$EfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdE', 'James Anderson', 'user', NULL, NULL, NULL),
  (9, 'agent_rachel@example.com', '+15559012345', '$2b$12$VwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuV', 'Rachel Martinez', 'user', NULL, NULL, NULL),
  (10, 'agent_david@example.com', '+15550123456', '$2b$12$BcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZa', 'David Thomas', 'user', NULL, NULL, NULL),
  (11, 'agent_karen@example.com', '+15551234560', '$2b$12$PqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoP', 'Karen White', 'user', NULL, NULL, NULL),
  (12, 'admin_chris@example.com', '+15552345671', '$2b$12$JkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHi', 'Chris Lee', 'admin', NULL, NULL, NULL);

-- owner (12 items)
INSERT INTO "owner" ("id", "name", "attempt_count", "last_dialed_at", "next_dial_at")
VALUES
  (1, 'Robert Chen', 3, '2026-06-30 14:30:00', '2026-07-03 10:00:00'),
  (2, 'Maria Garcia', 1, '2026-07-01 09:15:00', '2026-07-05 14:00:00'),
  (3, 'Kevin O''Brien', 5, '2026-07-01 16:45:00', '2026-07-02 11:30:00'),
  (4, 'Jennifer Taylor', 0, NULL, '2026-07-04 09:00:00'),
  (5, 'Daniel Kim', 2, '2026-06-29 10:20:00', '2026-07-06 15:00:00'),
  (6, 'Patricia Lopez', 4, '2026-07-02 08:30:00', '2026-07-03 13:45:00'),
  (7, 'William Turner', 1, '2026-06-28 11:00:00', '2026-07-02 10:00:00'),
  (8, 'Elizabeth Adams', 0, NULL, '2026-07-05 16:30:00'),
  (9, 'Michael Scott', 6, '2026-07-01 13:20:00', '2026-07-03 09:15:00'),
  (10, 'Barbara Wilson', 2, '2026-06-30 15:10:00', '2026-07-07 11:00:00'),
  (11, 'Richard Moore', 3, '2026-07-02 10:05:00', '2026-07-04 14:20:00'),
  (12, 'Susan Clark', 1, '2026-06-27 12:45:00', '2026-07-02 08:30:00');

-- numbers (11 items)
INSERT INTO "numbers" ("number", "owner_id")
VALUES
  ('+15551112222', 1),
  ('+15552223342', 1),
  ('+15552223333', 2),
  ('+15553334444', 3),
  ('+15554445555', 4),
  ('+15555556666', 5),
  ('+15556667777', 6),
  ('+15557778888', 7),
  ('+15558889999', 8),
  ('+15559990000', 9),
  ('+15550001111', 10);

-- owner_info (12 items)
INSERT INTO "owner_info" ("key", "owner_id", "value")
VALUES
  ('email', 1, 'robert.chen@email.com'),
  ('company', 1, 'TechCorp Inc'),
  ('email', 2, 'maria.garcia@email.com'),
  ('preferred_time', 2, 'morning'),
  ('email', 3, 'kevin.obrien@email.com'),
  ('notes', 3, 'Prefers calls after 4 PM'),
  ('email', 4, 'jennifer.taylor@email.com'),
  ('email', 5, 'daniel.kim@email.com'),
  ('company', 5, 'Kim Enterprises'),
  ('email', 6, 'patricia.lopez@email.com'),
  ('source', 6, 'Website referral'),
  ('email', 7, 'william.turner@email.com');

-- user_log (12 items)
INSERT INTO "user_log" ("id", "agent_id", "start_time", "duration", "is_active")
VALUES
  (1, 2, '2026-07-01 08:00:00', 14400, true),
  (2, 3, '2026-07-01 08:05:00', 10800, false),
  (3, 4, '2026-07-01 08:30:00', 25200, true),
  (4, 2, '2026-07-02 08:02:00', 7200, true),
  (5, 6, '2026-07-02 08:10:00', 18000, false),
  (6, 7, '2026-07-02 09:00:00', 14400, true),
  (7, 8, '2026-07-02 08:15:00', 3600, false),
  (8, 3, '2026-07-03 08:00:00', NULL, true),
  (9, 4, '2026-07-03 08:45:00', 9000, false),
  (10, 9, '2026-07-03 09:00:00', NULL, true),
  (11, 10, '2026-07-03 08:30:00', 7200, false),
  (12, 11, '2026-07-03 10:00:00', NULL, true);

-- call_detail_record (15 items) – status IDs match call_status
INSERT INTO "call_detail_record" ("id", "owner_id", "agent_id", "status", "time", "duration", "agent_notes")
VALUES
  (1, 1, 2, 2, '2026-06-30 14:30:00', 320, 'Customer interested in product upgrade. Sending brochure.'),
  (2, 2, 3, 2, '2026-07-01 09:15:00', 180, 'Discussed new pricing options. Will review and call back.'),
  (3, 3, 4, 3, '2026-07-01 16:45:00', 45, 'Not interested at this time. Remove from list.'),
  (4, 5, 6, 4, '2026-06-29 10:20:00', 10, 'Line busy. Will retry later.'),
  (5, 6, 7, 2, '2026-07-02 08:30:00', 600, 'Lengthy discussion about service offerings. Very interested.'),
  (6, 7, 8, 1, '2026-06-28 11:00:00', 0, 'No answer. Left voicemail.'),
  (7, 9, 2, 5, '2026-07-01 13:20:00', 240, 'Wants callback next week when budget is finalized.'),
  (8, 10, 3, 2, '2026-06-30 15:10:00', 420, 'Scheduled demo for next Tuesday at 2 PM.'),
  (9, 11, 4, 3, '2026-07-02 10:05:00', 90, 'Asked to be removed from calling list.'),
  (10, 12, 6, 1, '2026-06-27 12:45:00', 0, 'Wrong number.'),
  (11, 1, 9, 2, '2026-07-02 11:20:00', 280, 'Follow-up call. Customer has questions about contract terms.'),
  (12, 3, 10, 4, '2026-07-02 14:00:00', 15, 'Voicemail box full.'),
  (13, 4, 11, 2, '2026-07-03 09:45:00', 350, 'First contact. Explained services. Positive response.'),
  (14, 8, 7, 1, '2026-07-03 10:30:00', 0, 'Ringing, no answer.'),
  (15, 2, 2, 2, '2026-07-03 11:15:00', 195, 'Customer ready to proceed. Processing order.');

-- project_call_detail_record (15 items)
INSERT INTO "project_call_detail_record" ("project_id", "call_detail_record_id")
VALUES
  (1, 1), (1, 5), (1, 8), (1, 13),
  (2, 2), (2, 6), (2, 11),
  (3, 3), (3, 9), (3, 14),
  (4, 4), (4, 7), (4, 15),
  (5, 10), (6, 12);

-- owner_project (15 items)
INSERT INTO "owner_project" ("owner_id", "project_id")
VALUES
  (1, 1), (1, 4),
  (2, 1), (2, 2),
  (3, 3), (3, 5),
  (4, 1), (4, 8),
  (5, 3), (5, 7),
  (6, 2), (6, 6),
  (7, 4), (7, 9),
  (8, 10);

SET CONSTRAINTS ALL IMMEDIATE;
COMMIT;