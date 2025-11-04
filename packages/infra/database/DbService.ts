import { constant, injectable } from "@tsed/di";
import knex from "knex";

export const DATABASE = injectable(Symbol.for("DATABASE"))
  .factory(() => {
    return knex({
      client: "pg",
      connection: {
        host: constant<string>("DB_HOST"),
        port: constant<number>("DB_PORT"),
        database: constant<string>("DB_DATABASE"),
        user: constant("DB_USER"),
        password: constant("DB_PASSWORD"),
        ssl: constant("DB_SSL") === "true" ? { rejectUnauthorized: false } : false
      }
    });
  })
  .hooks({
    $onDestroy(knex: knex.Knex) {
      console.log("Destroying database connection...");

      return knex.destroy();
    }
  })
  .token();

export type DATABASE = typeof DATABASE;
