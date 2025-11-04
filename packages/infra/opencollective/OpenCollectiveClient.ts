import { injectable } from "@tsed/di";

import { HttpClient } from "../http/HttpClient.js";

interface OpenCollectiveMember {
  MemberId: number;
  createdAt: string;
  type: "USER" | "ORGANIZATION" | string;
  role: string;
  isActive: boolean;
  totalAmountDonated: number;
  currency: string;
  lastTransactionAt: string;
  lastTransactionAmount: number;
  profile: string;
  name: string;
  company: string | null;
  description: string;
  image: string;
  email: string | null;
  newsletterOptIn: string | null;
  twitter: string | null;
  github: string | null;
  website: string | null;
}

export class OpenCollectiveClient extends HttpClient {
  callee = "OPEN_COLLECTIVE";

  host = "https://opencollective.com";

  getMembers(repo: string): Promise<OpenCollectiveMember[]> {
    return this.get(`${this.host}/${repo}/members/all.json`);
  }
}

injectable(OpenCollectiveClient);
