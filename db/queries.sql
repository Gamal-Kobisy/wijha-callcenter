-- 1. Row counts: ensure each table has at least 10 rows
SELECT 'project' AS table_name, COUNT(*) FROM project
UNION ALL SELECT 'user', COUNT(*) FROM "user"
UNION ALL SELECT 'owner', COUNT(*) FROM owner
UNION ALL SELECT 'numbers', COUNT(*) FROM numbers
UNION ALL SELECT 'owner_info', COUNT(*) FROM owner_info
UNION ALL SELECT 'user_log', COUNT(*) FROM user_log
UNION ALL SELECT 'call_detail_record', COUNT(*) FROM call_detail_record
UNION ALL SELECT 'project_call_detail_record', COUNT(*) FROM project_call_detail_record
UNION ALL SELECT 'owner_project', COUNT(*) FROM owner_project
UNION ALL SELECT 'call_status', COUNT(*) FROM call_status;

-- 2. All call records with agent name, owner name, and status label
SELECT
  cdr.id,
  u.name AS agent_name,
  o.name AS owner_name,
  cs.name AS call_status,
  cdr.time,
  cdr.duration,
  cdr.agent_notes
FROM call_detail_record cdr
JOIN "user" u ON cdr.agent_id = u.id
JOIN owner o ON cdr.owner_id = o.id
JOIN call_status cs ON cdr.status = cs.id
ORDER BY cdr.time DESC;

-- 3. Which call statuses are used and how many calls per status
SELECT cs.name, COUNT(*) AS total_calls
FROM call_detail_record cdr
JOIN call_status cs ON cdr.status = cs.id
GROUP BY cs.name
ORDER BY total_calls DESC;

-- 4. Agents and their total calls / total call duration
SELECT
  u.name AS agent_name,
  COUNT(cdr.id) AS calls_handled,
  COALESCE(SUM(cdr.duration), 0) AS total_duration_seconds
FROM "user" u
LEFT JOIN call_detail_record cdr ON u.id = cdr.agent_id
WHERE u.role = 'user'   -- only agents (non‑admins)
GROUP BY u.id, u.name
ORDER BY calls_handled DESC;

-- 5. Owners with their phone numbers (shows the numbers table link)
SELECT o.name AS owner_name, n.number
FROM owner o
JOIN numbers n ON n.owner_id = o.id
ORDER BY o.name, n.number;

-- 6. Owners with extra info (key‑value pairs)
SELECT o.name, oi.key, oi.value
FROM owner o
JOIN owner_info oi ON oi.owner_id = o.id
ORDER BY o.name, oi.key;

-- 7. Which projects does each owner belong to?
SELECT o.name AS owner_name, p.name AS project_name
FROM owner o
JOIN owner_project op ON o.id = op.owner_id
JOIN project p ON op.project_id = p.id
ORDER BY o.name, p.name;

-- 8. Which projects are associated with each call?
SELECT
  cdr.id AS call_id,
  p.name AS project_name,
  o.name AS owner_name,
  u.name AS agent_name
FROM call_detail_record cdr
JOIN project_call_detail_record pcdr ON cdr.id = pcdr.call_detail_record_id
JOIN project p ON pcdr.project_id = p.id
JOIN owner o ON cdr.owner_id = o.id
JOIN "user" u ON cdr.agent_id = u.id
ORDER BY cdr.time;

-- 9. Check that no orphan rows exist (foreign key integrity)
-- These should all return 0 rows.

-- call_detail_record with invalid owner
SELECT cdr.id FROM call_detail_record cdr
LEFT JOIN owner o ON cdr.owner_id = o.id WHERE o.id IS NULL;

-- call_detail_record with invalid agent
SELECT cdr.id FROM call_detail_record cdr
LEFT JOIN "user" u ON cdr.agent_id = u.id WHERE u.id IS NULL;

-- call_detail_record with invalid status
SELECT cdr.id FROM call_detail_record cdr
LEFT JOIN call_status cs ON cdr.status = cs.id WHERE cs.id IS NULL;

-- numbers with invalid owner
SELECT * FROM numbers n
LEFT JOIN owner o ON n.owner_id = o.id WHERE o.id IS NULL;

-- owner_info with invalid owner
SELECT * FROM owner_info oi
LEFT JOIN owner o ON oi.owner_id = o.id WHERE o.id IS NULL;

-- user_log with invalid agent
SELECT * FROM user_log ul
LEFT JOIN "user" u ON ul.agent_id = u.id WHERE u.id IS NULL;

-- project_call_detail_record referencing missing project or CDR
SELECT * FROM project_call_detail_record pcdr
LEFT JOIN project p ON pcdr.project_id = p.id WHERE p.id IS NULL;
SELECT * FROM project_call_detail_record pcdr
LEFT JOIN call_detail_record cdr ON pcdr.call_detail_record_id = cdr.id WHERE cdr.id IS NULL;

-- owner_project referencing missing owner or project
SELECT * FROM owner_project op
LEFT JOIN owner o ON op.owner_id = o.id WHERE o.id IS NULL;
SELECT * FROM owner_project op
LEFT JOIN project p ON op.project_id = p.id WHERE p.id IS NULL;

-- 10. User log entries with agent name and active status
SELECT ul.id, u.name AS agent_name, ul.start_time, ul.duration, ul.is_active
FROM user_log ul
JOIN "user" u ON ul.agent_id = u.id
ORDER BY ul.start_time DESC;

-- 11. Summary: owners with attempt_count and next_dial_at
SELECT name, attempt_count, last_dialed_at, next_dial_at
FROM owner
WHERE next_dial_at IS NOT NULL
ORDER BY next_dial_at;