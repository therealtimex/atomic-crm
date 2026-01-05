import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import type { Contact, EmailAndType } from "../../types";
import { getContactAvatar, hash } from "./getContactAvatar";

Object.defineProperty(globalThis, "crypto", {
  value: webcrypto,
});

let fetchResponses: Record<string, boolean>;

const resolveUrl = (input: RequestInfo | URL): string =>
  typeof input === "string" ? input : input.url;

beforeEach(() => {
  fetchResponses = {};
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveUrl(input);
      return { ok: fetchResponses[url] ?? false } as Response;
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("should return gravatar URL for anthony@marmelab.com", async () => {
  const email: EmailAndType[] = [
    { email: "anthony@marmelab.com", type: "Work" },
  ];
  const record: Partial<Contact> = { email_jsonb: email };

  const hashedEmail = await hash(email[0].email);
  const gravatarUrl = `https://www.gravatar.com/avatar/${hashedEmail}?d=404`;
  fetchResponses[gravatarUrl] = true;

  const avatarUrl = await getContactAvatar(record);
  expect(avatarUrl).toBe(
    gravatarUrl,
  );
});

it("should return favicon URL if gravatar does not exist", async () => {
  const email: EmailAndType[] = [
    { email: "no-gravatar@gravatar.com", type: "Work" },
  ];
  const record: Partial<Contact> = { email_jsonb: email };

  const hashedEmail = await hash(email[0].email);
  const gravatarUrl = `https://www.gravatar.com/avatar/${hashedEmail}?d=404`;
  fetchResponses[gravatarUrl] = false;
  fetchResponses["https://gravatar.com/favicon.ico"] = true;

  const avatarUrl = await getContactAvatar(record);
  expect(avatarUrl).toBe("https://gravatar.com/favicon.ico");
});

it("should not return favicon URL if not domain not allowed", async () => {
  const email: EmailAndType[] = [
    { email: "no-gravatar@gmail.com", type: "Work" },
  ];
  const record: Partial<Contact> = { email_jsonb: email };

  const hashedEmail = await hash(email[0].email);
  const gravatarUrl = `https://www.gravatar.com/avatar/${hashedEmail}?d=404`;
  fetchResponses[gravatarUrl] = false;

  const avatarUrl = await getContactAvatar(record);
  expect(avatarUrl).toBeNull();
});

it("should return null if no email is provided", async () => {
  const record: Partial<Contact> = {};

  const avatarUrl = await getContactAvatar(record);
  expect(avatarUrl).toBeNull();
});

it("should return null if an empty array is provided", async () => {
  const email: EmailAndType[] = [];
  const record: Partial<Contact> = { email_jsonb: email };

  const avatarUrl = await getContactAvatar(record);
  expect(avatarUrl).toBeNull();
});

it("should return null if email has no gravatar or validate domain", async () => {
  const email: EmailAndType[] = [
    { email: "anthony@fake-domain-marmelab.com", type: "Work" },
  ];
  const record: Partial<Contact> = { email_jsonb: email };

  const hashedEmail = await hash(email[0].email);
  const gravatarUrl = `https://www.gravatar.com/avatar/${hashedEmail}?d=404`;
  fetchResponses[gravatarUrl] = false;
  fetchResponses["https://fake-domain-marmelab.com/favicon.ico"] = false;

  const avatarUrl = await getContactAvatar(record);
  expect(avatarUrl).toBeNull();
});

it("should return gravatar URL for 2nd email if 1st email has no gravatar nor valid domain", async () => {
  const email: EmailAndType[] = [
    { email: "anthony@fake-domain-marmelab.com", type: "Work" },
    { email: "anthony@marmelab.com", type: "Work" },
  ];
  const record: Partial<Contact> = { email_jsonb: email };

  const firstHash = await hash(email[0].email);
  const secondHash = await hash(email[1].email);
  fetchResponses[`https://www.gravatar.com/avatar/${firstHash}?d=404`] = false;
  fetchResponses["https://fake-domain-marmelab.com/favicon.ico"] = false;
  fetchResponses[`https://www.gravatar.com/avatar/${secondHash}?d=404`] = true;

  const avatarUrl = await getContactAvatar(record);
  const hashedEmail = secondHash;
  expect(avatarUrl).toBe(
    `https://www.gravatar.com/avatar/${hashedEmail}?d=404`,
  );
});
