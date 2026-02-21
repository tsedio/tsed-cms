import { cleanObject } from "@tsed/core";
import { inject } from "@tsed/di";
import { defineOperationApi } from "@tsed/directus-sdk";
import type { Sponsor } from "@tsed-cms/infra/directus/interfaces/DirectusSchema.js";
import { GitHubClient } from "@tsed-cms/infra/github/GitHubClient.js";
import { OpenCollectiveClient } from "@tsed-cms/infra/opencollective/OpenCollectiveClient.js";
import { SponsorsService } from "@tsed-cms/usecases/sponsors/SponsorsService.js";
import moment from "moment";

export type Options = {
  githubUser?: string;
  openCollectiveSlug?: string;
};

const DAY_OFFSET = 22;

// GitHub billing happens monthly on the 22nd (UTC), using moment for date math.
function latestBillingDate(on = moment.utc()): moment.Moment {
  const day = on.date();
  const base = on.clone().utc().startOf("day");
  if (day >= DAY_OFFSET) {
    return base.date(DAY_OFFSET);
  }
  return base.subtract(1, "month").date(DAY_OFFSET);
}

function firstBillingOnOrAfter(dateStr: string | null | undefined): moment.Moment | null {
  if (!dateStr) {
    return null;
  }

  const m = moment.utc(dateStr);

  if (!m.isValid()) {
    return null;
  }

  const base = m.clone().utc().startOf("day");

  if (base.date() <= DAY_OFFSET) {
    return base.date(DAY_OFFSET);
  }

  return base.add(1, "month").date(DAY_OFFSET);
}

function monthsBetween22sInclusive(start: moment.Moment, end: moment.Moment): number {
  const diff = end.diff(start, "months");

  return diff < 0 ? 0 : diff + 1;
}

function mapGithubSponsor(input: any): Partial<Sponsor> & Pick<Sponsor, "login"> {
  const firstTx = input.firstTransactionAt ?? null;
  const firstPayment = firstBillingOnOrAfter(firstTx);
  const lastPayment = latestBillingDate();

  let monthsPaid = 0;

  if (firstPayment && firstPayment.isSameOrBefore(lastPayment)) {
    monthsPaid = monthsBetween22sInclusive(firstPayment, lastPayment);
  }

  const monthly = Number(input.monthlyPriceInDollars ?? 0) || 0;
  const total = monthly && monthsPaid ? monthly * monthsPaid : undefined;

  return {
    source: "github",
    login: input.login,
    name: input.name || input.login,
    type: input.type,
    avatar: input.avatar || undefined,
    profile: input.url || undefined,
    status: input.status,
    visibility: input.visibility,
    tier: input.tier ?? undefined,
    last_transaction_amount: monthly || undefined,
    first_transaction_at: firstTx ?? undefined,
    last_transaction_at: firstPayment ? lastPayment.toISOString() : undefined,
    total_amount_donated: total,
    currency: "USD"
  } as Partial<Sponsor> & Pick<Sponsor, "login">;
}

function mapOpenCollective(member: any): Partial<Sponsor> & Pick<Sponsor, "login"> {
  return cleanObject({
    source: "open_collective",
    login: String(member.MemberId),
    name: member.name ?? undefined,
    type: member.type?.toLowerCase?.() ?? undefined,
    email: member.email ?? undefined,
    description: member.description ?? undefined,
    company: member.company ?? undefined,
    twitter: member.twitter ?? undefined,
    website: member.website ?? undefined,
    profile: member.profile ?? undefined,
    avatar: member.avatar ?? undefined,
    total_amount_donated: member.totalAmountDonated ?? undefined,
    currency: member.currency ?? undefined,
    last_transaction_amount: member.lastTransactionAmount ?? undefined,
    visibility: "public",
    tier: member.tier ?? undefined,
    first_transaction_at: member.createdAt ?? undefined,
    last_transaction_at: member.lastTransactionAt ?? undefined,
    status:
      member.lastTransactionAt && moment.utc(member.lastTransactionAt).isBefore(moment.utc().subtract(1, "year"))
        ? "archived"
        : member.isActive
          ? "published"
          : "archived"
  }) as Partial<Sponsor> & Pick<Sponsor, "login">;
}

export default defineOperationApi<Options>({
  id: "tsed-flow-sponsors",
  handler: async (opts) => {
    const startedAt = Date.now();

    const github = inject(GitHubClient);
    const oc = inject(OpenCollectiveClient);
    const sponsorsService = inject(SponsorsService);

    const githubUser = (opts?.githubUser || "romakita").toString();
    const ocSlug = (opts?.openCollectiveSlug || "tsed").toString();

    let processed = 0;
    let upserted = 0;
    const errors: { source: string; login?: string; error: string }[] = [];

    // GitHub sponsors
    let githubArchived = 0;
    try {
      const ghSponsors = await github.getSponsors(githubUser);
      const activeGithubLogins = new Set<string>();
      for (const s of ghSponsors) {
        try {
          const data = mapGithubSponsor(s);
          activeGithubLogins.add(String(data.login));

          await sponsorsService.upsertOneByLogin(data);
          upserted += 1;
          processed += 1;
        } catch (er: any) {
          errors.push({ source: "github", login: s?.login, error: er?.message || String(er) });
        }
      }

      // Archive GitHub sponsors that are not part of the active list returned by GitHub
      try {
        githubArchived = await sponsorsService.archiveMissingBySource("github", activeGithubLogins);
      } catch (archiveErr: any) {
        errors.push({ source: "github", error: archiveErr?.message || String(archiveErr) });
      }
    } catch (er: any) {
      errors.push({ source: "github", error: er?.message || String(er) });
    }

    // OpenCollective BACKERs
    try {
      const members = await oc.getMembers(ocSlug);

      for (const member of members) {
        try {
          if (member.role !== "BACKER") {
            continue;
          }

          const data = mapOpenCollective(member);
          await sponsorsService.upsertOneByLogin(data);

          upserted += 1;
          processed += 1;
        } catch (er: any) {
          errors.push({ source: "open_collective", login: String(member?.MemberId), error: er?.message || String(er) });
        }
      }
    } catch (er: any) {
      errors.push({ source: "open_collective", error: er?.message || String(er) });
    }

    return {
      processed,
      upserted,
      githubArchived,
      durationMs: Date.now() - startedAt,
      errors
    };
  }
});
