-- Seed data generated from Book1.csv
-- All times use FIXED_DATE 2026-01-01 with GMT+2 offset (only time-of-day matters)

-- ============================================================
-- WORKSHOPS
-- ============================================================
INSERT INTO workshops (title, description, capacity, time, end_time, location, host, host_logo_url, has_waiting_list, cv_required)
VALUES ('WS Opening', NULL, 30, '2026-01-01T08:30:00+02:00', '2026-01-01T09:00:00+02:00', 'Mainstage', 'Replace', NULL, FALSE, FALSE);

INSERT INTO workshops (title, description, capacity, time, end_time, location, host, host_logo_url, has_waiting_list, cv_required)
VALUES ('WS0 1 (optional)', NULL, 30, '2026-01-01T09:00:00+02:00', '2026-01-01T09:45:00+02:00', 'Mainstage', 'Replace', NULL, FALSE, FALSE);

INSERT INTO workshops (title, description, capacity, time, end_time, location, host, host_logo_url, has_waiting_list, cv_required)
VALUES ('WS1 Spark 1', NULL, 30, '2026-01-01T10:30:00+02:00', '2026-01-01T11:15:00+02:00', 'Mainstage', 'Replace', NULL, FALSE, FALSE);

INSERT INTO workshops (title, description, capacity, time, end_time, location, host, host_logo_url, has_waiting_list, cv_required)
VALUES ('WS1 Spark 2', NULL, 30, '2026-01-01T10:30:00+02:00', '2026-01-01T11:15:00+02:00', 'Mainstage', 'Replace', NULL, FALSE, FALSE);

INSERT INTO workshops (title, description, capacity, time, end_time, location, host, host_logo_url, has_waiting_list, cv_required)
VALUES ('WS2 Build 1', NULL, 30, '2026-01-01T11:45:00+02:00', '2026-01-01T12:30:00+02:00', 'Mainstage', 'Replace', NULL, FALSE, FALSE);

INSERT INTO workshops (title, description, capacity, time, end_time, location, host, host_logo_url, has_waiting_list, cv_required)
VALUES ('WS2 Build 2', NULL, 30, '2026-01-01T11:45:00+02:00', '2026-01-01T12:30:00+02:00', 'Mainstage', 'Replace', NULL, FALSE, FALSE);

INSERT INTO workshops (title, description, capacity, time, end_time, location, host, host_logo_url, has_waiting_list, cv_required)
VALUES ('WS3 Fuel 1', NULL, 30, '2026-01-01T14:00:00+02:00', '2026-01-01T14:45:00+02:00', 'Mainstage', 'Replace', NULL, FALSE, FALSE);

INSERT INTO workshops (title, description, capacity, time, end_time, location, host, host_logo_url, has_waiting_list, cv_required)
VALUES ('WS3 Fuel 2', NULL, 30, '2026-01-01T14:00:00+02:00', '2026-01-01T14:45:00+02:00', 'Mainstage', 'Replace', NULL, FALSE, FALSE);

INSERT INTO workshops (title, description, capacity, time, end_time, location, host, host_logo_url, has_waiting_list, cv_required)
VALUES ('WS4 Scale 1', NULL, 30, '2026-01-01T15:15:00+02:00', '2026-01-01T16:00:00+02:00', 'Mainstage', 'Replace', NULL, FALSE, FALSE);

INSERT INTO workshops (title, description, capacity, time, end_time, location, host, host_logo_url, has_waiting_list, cv_required)
VALUES ('WS4 Scale 2', NULL, 30, '2026-01-01T15:15:00+02:00', '2026-01-01T16:00:00+02:00', 'Mainstage', 'Replace', NULL, FALSE, FALSE);

INSERT INTO workshops (title, description, capacity, time, end_time, location, host, host_logo_url, has_waiting_list, cv_required)
VALUES ('WS5 Legacy 1 (optional)', NULL, 30, '2026-01-01T16:30:00+02:00', '2026-01-01T17:15:00+02:00', 'Mainstage', 'Replace', NULL, FALSE, FALSE);

INSERT INTO workshops (title, description, capacity, time, end_time, location, host, host_logo_url, has_waiting_list, cv_required)
VALUES ('WS5 Legacy 2 (optional)', NULL, 30, '2026-01-01T16:30:00+02:00', '2026-01-01T17:15:00+02:00', 'Mainstage', 'Replace', NULL, FALSE, FALSE);

-- ============================================================
-- SCHEDULE ITEMS — Workshops (linked to workshops table)
-- ============================================================
INSERT INTO schedule_items (title, time, end_time, location, category, description, workshop_id)
SELECT 'WS Opening', '2026-01-01T08:30:00+02:00', '2026-01-01T09:00:00+02:00', 'Mainstage', 'workshop', NULL, w.id
FROM workshops w WHERE w.title = 'WS Opening' LIMIT 1;

INSERT INTO schedule_items (title, time, end_time, location, category, description, workshop_id)
SELECT 'WS0 1 (optional)', '2026-01-01T09:00:00+02:00', '2026-01-01T09:45:00+02:00', 'Mainstage', 'workshop', NULL, w.id
FROM workshops w WHERE w.title = 'WS0 1 (optional)' LIMIT 1;

INSERT INTO schedule_items (title, time, end_time, location, category, description, workshop_id)
SELECT 'WS1 Spark 1', '2026-01-01T10:30:00+02:00', '2026-01-01T11:15:00+02:00', 'Mainstage', 'workshop', NULL, w.id
FROM workshops w WHERE w.title = 'WS1 Spark 1' LIMIT 1;

INSERT INTO schedule_items (title, time, end_time, location, category, description, workshop_id)
SELECT 'WS1 Spark 2', '2026-01-01T10:30:00+02:00', '2026-01-01T11:15:00+02:00', 'Mainstage', 'workshop', NULL, w.id
FROM workshops w WHERE w.title = 'WS1 Spark 2' LIMIT 1;

INSERT INTO schedule_items (title, time, end_time, location, category, description, workshop_id)
SELECT 'WS2 Build 1', '2026-01-01T11:45:00+02:00', '2026-01-01T12:30:00+02:00', 'Mainstage', 'workshop', NULL, w.id
FROM workshops w WHERE w.title = 'WS2 Build 1' LIMIT 1;

INSERT INTO schedule_items (title, time, end_time, location, category, description, workshop_id)
SELECT 'WS2 Build 2', '2026-01-01T11:45:00+02:00', '2026-01-01T12:30:00+02:00', 'Mainstage', 'workshop', NULL, w.id
FROM workshops w WHERE w.title = 'WS2 Build 2' LIMIT 1;

INSERT INTO schedule_items (title, time, end_time, location, category, description, workshop_id)
SELECT 'WS3 Fuel 1', '2026-01-01T14:00:00+02:00', '2026-01-01T14:45:00+02:00', 'Mainstage', 'workshop', NULL, w.id
FROM workshops w WHERE w.title = 'WS3 Fuel 1' LIMIT 1;

INSERT INTO schedule_items (title, time, end_time, location, category, description, workshop_id)
SELECT 'WS3 Fuel 2', '2026-01-01T14:00:00+02:00', '2026-01-01T14:45:00+02:00', 'Mainstage', 'workshop', NULL, w.id
FROM workshops w WHERE w.title = 'WS3 Fuel 2' LIMIT 1;

INSERT INTO schedule_items (title, time, end_time, location, category, description, workshop_id)
SELECT 'WS4 Scale 1', '2026-01-01T15:15:00+02:00', '2026-01-01T16:00:00+02:00', 'Mainstage', 'workshop', NULL, w.id
FROM workshops w WHERE w.title = 'WS4 Scale 1' LIMIT 1;

INSERT INTO schedule_items (title, time, end_time, location, category, description, workshop_id)
SELECT 'WS4 Scale 2', '2026-01-01T15:15:00+02:00', '2026-01-01T16:00:00+02:00', 'Mainstage', 'workshop', NULL, w.id
FROM workshops w WHERE w.title = 'WS4 Scale 2' LIMIT 1;

INSERT INTO schedule_items (title, time, end_time, location, category, description, workshop_id)
SELECT 'WS5 Legacy 1 (optional)', '2026-01-01T16:30:00+02:00', '2026-01-01T17:15:00+02:00', 'Mainstage', 'workshop', NULL, w.id
FROM workshops w WHERE w.title = 'WS5 Legacy 1 (optional)' LIMIT 1;

INSERT INTO schedule_items (title, time, end_time, location, category, description, workshop_id)
SELECT 'WS5 Legacy 2 (optional)', '2026-01-01T16:30:00+02:00', '2026-01-01T17:15:00+02:00', 'Mainstage', 'workshop', NULL, w.id
FROM workshops w WHERE w.title = 'WS5 Legacy 2 (optional)' LIMIT 1;

-- ============================================================
-- SCHEDULE ITEMS — Keynotes, Podcasts, Events
-- ============================================================
INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('Opening', '2026-01-01T09:00:00+02:00', '2026-01-01T10:00:00+02:00', 'Mainstage', 'event', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('Breakfast (Anpassung nötig)', '2026-01-01T09:00:00+02:00', '2026-01-01T10:30:00+02:00', 'Mainstage', 'event', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('Intro', '2026-01-01T10:00:00+02:00', '2026-01-01T10:30:00+02:00', 'Mainstage', 'event', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('KN1 Spark', '2026-01-01T10:30:00+02:00', '2026-01-01T11:00:00+02:00', 'Mainstage', 'keynote', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('Podcast 1 Spark', '2026-01-01T10:30:00+02:00', '2026-01-01T11:30:00+02:00', 'Mainstage', 'podcast', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('KN2 Spark', '2026-01-01T11:00:00+02:00', '2026-01-01T11:30:00+02:00', 'Mainstage', 'keynote', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('KN3 Build', '2026-01-01T11:30:00+02:00', '2026-01-01T12:00:00+02:00', 'Mainstage', 'keynote', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('Podcast 2 Build', '2026-01-01T11:30:00+02:00', '2026-01-01T12:30:00+02:00', 'Mainstage', 'podcast', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('KN4 Build', '2026-01-01T12:00:00+02:00', '2026-01-01T12:30:00+02:00', 'Mainstage', 'keynote', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('Podcast 3 Star Guest', '2026-01-01T12:45:00+02:00', '2026-01-01T13:45:00+02:00', 'Mainstage', 'podcast', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('KN5 Fuel', '2026-01-01T14:00:00+02:00', '2026-01-01T14:30:00+02:00', 'Mainstage', 'keynote', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('Podcast 4 Fuel', '2026-01-01T14:00:00+02:00', '2026-01-01T15:00:00+02:00', 'Mainstage', 'podcast', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('KN6 Fuel', '2026-01-01T14:30:00+02:00', '2026-01-01T15:00:00+02:00', 'Mainstage', 'keynote', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('KN7 Scale', '2026-01-01T15:00:00+02:00', '2026-01-01T15:30:00+02:00', 'Mainstage', 'keynote', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('Podcast 5 Scale', '2026-01-01T15:00:00+02:00', '2026-01-01T16:00:00+02:00', 'Mainstage', 'podcast', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('KN8 Scale', '2026-01-01T15:30:00+02:00', '2026-01-01T16:00:00+02:00', 'Mainstage', 'keynote', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('KN9 Legacy', '2026-01-01T16:00:00+02:00', '2026-01-01T16:30:00+02:00', 'Mainstage', 'keynote', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('Podcast 6 Legacy', '2026-01-01T16:00:00+02:00', '2026-01-01T17:00:00+02:00', 'Mainstage', 'podcast', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('KN10 Legacy & Closing (Oder optional noch eine KN vorher)', '2026-01-01T16:30:00+02:00', '2026-01-01T17:00:00+02:00', 'Mainstage', 'keynote', NULL);

INSERT INTO schedule_items (title, time, end_time, location, category, description)
VALUES ('Afterworkevent', '2026-01-01T18:00:00+02:00', '2026-01-01T22:00:00+02:00', 'Mainstage', 'event', NULL);
