-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "files" TEXT NOT NULL DEFAULT '[]',
    "chatId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Config" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main',
    "password" TEXT NOT NULL,
    "tunnelUrl" TEXT NOT NULL DEFAULT '',
    "tunnelPort" INTEGER NOT NULL DEFAULT 20128,
    "cavemanMode" BOOLEAN NOT NULL DEFAULT false,
    "cacheEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cacheTTL" INTEGER NOT NULL DEFAULT 300,
    "avatarUrl" TEXT NOT NULL DEFAULT '',
    "themeMode" TEXT NOT NULL DEFAULT 'dark',
    "themeAccent" TEXT NOT NULL DEFAULT 'indigo'
);
INSERT INTO "new_Config" ("cacheEnabled", "cacheTTL", "cavemanMode", "id", "password", "tunnelPort", "tunnelUrl") SELECT "cacheEnabled", "cacheTTL", "cavemanMode", "id", "password", "tunnelPort", "tunnelUrl" FROM "Config";
DROP TABLE "Config";
ALTER TABLE "new_Config" RENAME TO "Config";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
