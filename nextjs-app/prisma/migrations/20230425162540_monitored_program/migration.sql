-- CreateTable
CREATE TABLE "ChatExchange" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tokmon_conversation_id" TEXT NOT NULL,
    "request" JSONB NOT NULL,
    "response" JSONB NOT NULL,
    "tokenUsageSummaryId" TEXT NOT NULL,

    CONSTRAINT "ChatExchange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenUsageSummary" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tokmon_conversation_id" TEXT NOT NULL,
    "monitored_program" TEXT NOT NULL,
    "total_cost" DOUBLE PRECISION NOT NULL,
    "total_usage" JSONB NOT NULL,
    "pricing_data" JSONB NOT NULL,
    "models" TEXT[],

    CONSTRAINT "TokenUsageSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenUsageSummary_tokmon_conversation_id_key" ON "TokenUsageSummary"("tokmon_conversation_id");

-- AddForeignKey
ALTER TABLE "ChatExchange" ADD CONSTRAINT "ChatExchange_tokenUsageSummaryId_fkey" FOREIGN KEY ("tokenUsageSummaryId") REFERENCES "TokenUsageSummary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
