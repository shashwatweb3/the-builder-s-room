-- 017_devcon8_remove_rajasthan_field_station.sql
-- Removes "Field Station: Rajasthan — Logos × Zu-Grama" from the published
-- event board. The event happens in Dhun, Rajasthan, not Mumbai/Goa, so it does
-- not belong to the DEVCON 8 (Mumbai) or PRE-DEVCON (Goa) views.
--
-- Delisting keeps the published set correct without touching any other row.
-- Safe to re-run (no-op when the row is already gone).

delete from public.events
where slug = 'field-station-rajasthan-zu-grama';