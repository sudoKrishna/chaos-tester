-- CreateTable
CREATE TABLE "UploadedSpec" (
    "id" TEXT NOT NULL,
    "filename" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "specId" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "totalEndpoints" INTEGER NOT NULL,
    "totalFindings" INTEGER NOT NULL,
    "findings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Report_specId_key" ON "Report"("specId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_specId_fkey" FOREIGN KEY ("specId") REFERENCES "UploadedSpec"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
