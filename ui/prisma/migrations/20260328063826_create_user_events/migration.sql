CREATE TABLE "user_events" (
  "id" BIGSERIAL PRIMARY KEY,
  "action" TEXT NOT NULL CHECK ("action" IN ('search', 'favorite', 'click')),
  "tool_id" TEXT,
  "keyword" TEXT,
  "user_id" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "user_events_action_created_at_idx"
  ON "user_events" ("action", "created_at");

CREATE INDEX "user_events_user_id_created_at_idx"
  ON "user_events" ("user_id", "created_at");

CREATE INDEX "user_events_tool_id_created_at_idx"
  ON "user_events" ("tool_id", "created_at");
