ALTER TABLE "user_events"
  ADD COLUMN "metadata" JSONB;

UPDATE "user_events"
SET "metadata" = jsonb_build_object('operation', "keyword")
WHERE "action" = 'favorite'
  AND "keyword" IN ('add', 'remove')
  AND "metadata" IS NULL;
