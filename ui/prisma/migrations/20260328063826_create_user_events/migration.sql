CREATE TABLE "user_events" (
  "id" BIGSERIAL PRIMARY KEY,
  "action" TEXT NOT NULL CHECK ("action" IN ('search', 'favorite', 'click')),
  "toolId" TEXT,
  "keyword" TEXT,
  "userId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "user_events_action_createdAt_idx"
  ON "user_events" ("action", "createdAt");

CREATE INDEX "user_events_userId_createdAt_idx"
  ON "user_events" ("userId", "createdAt");

CREATE INDEX "user_events_toolId_createdAt_idx"
  ON "user_events" ("toolId", "createdAt");
