import type { Knex } from "knex";

export function getAdministratorRoleId(knex: Knex): Promise<string | null> {
  return knex("directus_roles")
    .select("id")
    .where({ name: "Administrator" })
    .first()
    .then((role) => {
      return role ? role.id : null;
    });
}
