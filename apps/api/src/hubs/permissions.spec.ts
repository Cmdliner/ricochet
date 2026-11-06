import { describe, expect, it } from "vitest";
import { canChangeRoles, canDeleteHub, canEditHub, canRemoveMember } from "./permissions.js";

describe("hub permissions", () => {
  it("lets owners and admins edit, but not members", () => {
    expect(canEditHub("owner")).toBe(true);
    expect(canEditHub("admin")).toBe(true);
    expect(canEditHub("member")).toBe(false);
  });

  it("lets only the owner delete the hub or change roles", () => {
    expect(canDeleteHub("owner")).toBe(true);
    expect(canDeleteHub("admin")).toBe(false);
    expect(canChangeRoles("owner")).toBe(true);
    expect(canChangeRoles("admin")).toBe(false);
    expect(canChangeRoles("member")).toBe(false);
  });

  it("never lets anyone remove the owner", () => {
    expect(canRemoveMember("owner", "owner")).toBe(false);
    expect(canRemoveMember("admin", "owner")).toBe(false);
    expect(canRemoveMember("member", "owner")).toBe(false);
  });

  it("lets the owner remove admins and members", () => {
    expect(canRemoveMember("owner", "admin")).toBe(true);
    expect(canRemoveMember("owner", "member")).toBe(true);
  });

  it("lets an admin remove members only", () => {
    expect(canRemoveMember("admin", "member")).toBe(true);
    expect(canRemoveMember("admin", "admin")).toBe(false);
  });

  it("lets a member remove nobody", () => {
    expect(canRemoveMember("member", "member")).toBe(false);
    expect(canRemoveMember("member", "admin")).toBe(false);
  });
});
