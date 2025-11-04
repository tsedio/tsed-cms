// Script to create a TypeScript migration file for Directus
// This script creates a TypeScript migration file with a timestamp and compiles it to JavaScript

import { logger } from "@tsed/di";
import { cli } from "@tsed-cms/infra/bootstrap/cli.js";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get the migration name from the command line arguments or prompt for it
async function getMigrationName(): Promise<string> {
  return new Promise((resolve) => {
    if (process.argv.length > 2) {
      resolve(process.argv[2]);
    } else {
      rl.question('Enter migration name (e.g., "create-users-table"): ', (answer) => {
        resolve(answer);
      });
    }
  });
}

async function main() {
  try {
    // Get the migration name
    const migrationName = await getMigrationName();

    if (!migrationName) {
      logger().error("Error: Migration name is required");
      process.exit(1);
    }

    // Create a timestamp for the migration filename
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);
    const migrationFileName = `${timestamp}-${migrationName.replace(/\s+/g, "-").toLowerCase()}.ts`;
    const migrationFilePath = path.join(process.cwd(), "migrations", migrationFileName);

    // Create the migrations directory if it doesn't exist
    const migrationsDir = path.join(process.cwd(), "migrations");
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    // Create the migration file template
    const migrationTemplate = `// Migration: ${migrationName}
// Created: ${new Date().toISOString()}
import { useLogger } from "@directus/api/logger/index";
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const logger = useLogger();
  // Write your migration code here
  // Example:
  // await knex.schema.createTable('my_table', (table) => {
  //   table.increments('id').primary();
  //   table.string('name').notNullable();
  //   table.timestamps(true, true);
  // });
}

export async function down(knex: Knex): Promise<void> {
  // Revert the changes made in the up function
  // Example:
  // await knex.schema.dropTable('my_table');
}
`;

    // Write the migration file
    fs.writeFileSync(migrationFilePath, migrationTemplate);
    logger().info(`Created TypeScript migration file: ${migrationFilePath}`);

    // Compile the TypeScript migration to JavaScript
    logger().info("Compiling TypeScript migration to JavaScript...");
    execSync("pnpm run build:migrations", { stdio: "inherit" });

    logger().info("Migration created and compiled successfully.");
    logger().info("You can now run the migration with:");
    logger().info("  pnpm run migrate:dev");
  } catch (error) {
    logger().error("Error creating migration:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

await cli(main);
