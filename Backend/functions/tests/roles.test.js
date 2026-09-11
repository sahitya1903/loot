import { describe, it, expect, vi, beforeEach } from "vitest";

const userMock = vi.hoisted(() => ({ get: vi.fn() }));
const docMock = vi.hoisted(() => ({ get: vi.fn() }));

const dbMock = vi.hoisted(() => ({
  collection: vi.fn(() => ({
    doc: vi.fn(() => userMock),
  })),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => dbMock,
}));
vi.mock("firebase-functions/logger", () => ({
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));

const { getAccountType, requireProfessional, requirePersonal } = await import("../roles.js");

describe("roles.js — Loot account-type guards", () => {
  beforeEach(() => {
    userMock.get.mockReset();
  });

  it("getAccountType returns null when user does not exist", async () => {
    userMock.get.mockResolvedValue({ exists: false });
    const t = await getAccountType("u1");
    expect(t).toBeNull();
  });

  it("getAccountType returns the stored accountType", async () => {
    userMock.get.mockResolvedValue({ exists: true, data: () => ({ accountType: "professional" }) });
    expect(await getAccountType("u1")).toBe("professional");
  });

  it("requireProfessional throws for personal accounts", async () => {
    userMock.get.mockResolvedValue({ exists: true, data: () => ({ accountType: "personal" }) });
    await expect(requireProfessional("u1")).rejects.toThrow(/permission-denied/);
  });

  it("requireProfessional resolves silently for pro accounts", async () => {
    userMock.get.mockResolvedValue({ exists: true, data: () => ({ accountType: "professional" }) });
    await expect(requireProfessional("u1")).resolves.toBeUndefined();
  });

  it("requirePersonal throws for pro accounts", async () => {
    userMock.get.mockResolvedValue({ exists: true, data: () => ({ accountType: "professional" }) });
    await expect(requirePersonal("u1")).rejects.toThrow(/permission-denied/);
  });
});
