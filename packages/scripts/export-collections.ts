// Script to export roles and permissions from the Directus database
// Run this script with: node scripts/export-roles-permissions.js
import { inject, logger } from "@tsed/di";
import { cli } from "@tsed-cms/infra/bootstrap/cli.js";
import { DATABASE } from "@tsed-cms/infra/database/DbService.js";
import fs from "fs";
import type { Knex } from "knex";
import path from "path";

const COLLECTIONS = [
  "directus_roles",
  "directus_policies",
  "directus_permissions",
  "directus_access",
  "directus_presets",
  "directus_flows",
  "directus_operations"
];

export function getAdministratorRoleId(knex: Knex): Promise<string | null> {
  return knex("directus_roles")
    .select("id")
    .where({ name: "Administrator" })
    .first()
    .then((role) => {
      return role ? role.id : null;
    });
}

function filterCollections(collectionName: string, items: any[], administratorRoleId: string | null) {
  if (collectionName === "directus_access") {
    return items.filter((item) => {
      return item.role !== administratorRoleId && item.role !== null;
    });
  }
  if (collectionName === "directus_roles") {
    return items.filter((item) => {
      return item.id !== administratorRoleId;
    });
  }
  if (collectionName === "directus_policies") {
    return items.filter((item) => {
      return !["$t:public_label", "Administrator"].includes(item.name);
    });
  }

  if (collectionName === "directus_presets") {
    return items.filter((item) => {
      return item.role === null && item.user === null;
    });
  }

  return items;
}

function replaceByAPlaceholder(collectionName: string, administratorRoleId: string, content: string) {
  if (collectionName === "directus_permissions") {
    const reg = new RegExp(`"${administratorRoleId}"`, "g");
    const reg2 = new RegExp(`"_neq": "null"`, "g");
    content = content.replace(reg, '"{{ID_ROLE_ADMINISTRATOR}}"').replace(reg2, '"_neq": "{{ID_ROLE_ADMINISTRATOR}}"');
  }
  return content;
}

async function exportCollection(collectionName: string) {
  const knex = inject(DATABASE);
  const administratorRoleId = await getAdministratorRoleId(knex);

  logger().info(`Administrator role ID: ${administratorRoleId}`);

  if (!administratorRoleId) {
    logger().error("Administrator role not found. Exiting...");
    process.exit(-1);
  }
  // Save roles to JSON file
  // Get all roles from the database
  let items = await knex(collectionName).select("*");

  logger().info(`Found ${items.length} ${collectionName} in the database.`);

  const rolesFilePath = path.join(import.meta.dirname, `../../migrations/data/${collectionName}.json`);

  items = filterCollections(collectionName, items, administratorRoleId);

  let content = JSON.stringify(items, null, 2);
  content = replaceByAPlaceholder(collectionName, administratorRoleId!, content);

  fs.writeFileSync(rolesFilePath, content, "utf8");

  logger().info(`Exported ${items.length}  ${collectionName}  to ${rolesFilePath}`);
}

await cli(async () => {
  // Create a database connection using environment variables
  for (const collection of COLLECTIONS) {
    await exportCollection(collection);
  }

  // After export, rename the migration file to today's date so it's picked up on next deploy
  try {
    const migrationsDir = path.join(import.meta.dirname, "../../migrations");
    const files = fs.readdirSync(migrationsDir);
    const pattern = /^\d{8}[A-Z]-update-all\.ts$/;

    const matches = files.filter((f) => pattern.test(f));

    if (matches.length === 0) {
      logger().warn("No migration file matching '*-update-all.ts' found to rename.");
    } else {
      // If multiple, take the first by lexicographic order just to be deterministic
      matches.sort();
      const sourceName = matches[0];

      const now = new Date();
      const yyyy = String(now.getFullYear());
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const todayPrefix = `${yyyy}${mm}${dd}`;
      const targetName = `${todayPrefix}A-update-all.ts`;

      if (sourceName === targetName) {
        logger().info(`Migration file already up-to-date: ${targetName}`);
      } else {
        const sourcePath = path.join(migrationsDir, sourceName);
        const targetPath = path.join(migrationsDir, targetName);

        if (fs.existsSync(targetPath)) {
          logger().info(`Target migration already exists, skipping rename: ${targetName}`);
        } else {
          fs.renameSync(sourcePath, targetPath);
          logger().info(`Renamed migration: ${sourceName} -> ${targetName}`);
        }
      }
    }
  } catch (err) {
    logger().error("Failed to rename migration file after export", err as Error);
  }

  logger().info("Export completed successfully.");
});
