-- CreateTable
CREATE TABLE "Config" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main',
    "password" TEXT NOT NULL,
    "tunnelUrl" TEXT NOT NULL DEFAULT '',
    "tunnelPort" INTEGER NOT NULL DEFAULT 20128,
    "cavemanMode" BOOLEAN NOT NULL DEFAULT false,
    "cacheEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cacheTTL" INTEGER NOT NULL DEFAULT 300
);

-- CreateTable
CREATE TABLE "Cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "response" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL DEFAULT '',
    "selectedModel" TEXT NOT NULL DEFAULT '',
    "baseUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Personality" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main',
    "systemPrompt" TEXT NOT NULL DEFAULT 'You are a helpful AI assistant.',
    "temperature" REAL NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 4096,
    "topP" REAL NOT NULL DEFAULT 1.0,
    "frequencyPenalty" REAL NOT NULL DEFAULT 0.0,
    "activePreset" TEXT NOT NULL DEFAULT 'Default'
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Bot',
    "enabled" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Combo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ComboItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "model" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "comboId" TEXT NOT NULL,
    CONSTRAINT "ComboItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
