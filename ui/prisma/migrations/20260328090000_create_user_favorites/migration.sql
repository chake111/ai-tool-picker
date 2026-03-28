CREATE TABLE "user_favorites" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "tool_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "desc" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "link" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "user_favorites_user_id_tool_id_key" UNIQUE ("user_id", "tool_id")
);

CREATE INDEX "user_favorites_user_id_updated_at_idx"
  ON "user_favorites" ("user_id", "updated_at");
