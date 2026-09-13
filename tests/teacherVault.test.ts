import "fake-indexeddb/auto";
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import db from "../lib/db";
import {
  accountDb,
  createTeacherAccount,
  deleteActiveTeacherWorkspace,
  exportActiveTeacherVault,
  flushVault,
  importTeacherVault,
  lockTeacherAccount,
  unlockTeacherAccount,
} from "../lib/teacherVault";
import type { StudentIEPProfile } from "../types/iep";
import { backfillGeorgeMartinDemoSchedules, georgeMartinStudents, seedGeorgeMartinDemo } from "../lib/georgeMartinDemo";

class MemoryDirectory {
  readonly kind = "directory" as const;
  readonly name: string;
  readonly files = new Map<string, string>();

  constructor(name: string) { this.name = name; }
  async queryPermission() { return "granted" as const; }
  async requestPermission() { return "granted" as const; }
  async getFileHandle(name: string, options?: { create?: boolean }) {
    if (!options?.create && !this.files.has(name)) throw new DOMException("Missing", "NotFoundError");
    const directory = this;
    return {
      kind: "file" as const,
      name,
      async getFile() { return { text: async () => directory.files.get(name) ?? "" } as File; },
      async createWritable() {
        return {
          async write(data: string | Blob | ArrayBuffer | ArrayBufferView) {
            if (typeof data !== "string") throw new Error("Test vault expected a JSON string.");
            directory.files.set(name, data);
          },
          async close() {},
        };
      },
    };
  }
  async removeEntry(name: string) {
    if (!this.files.delete(name)) throw new DOMException("Missing", "NotFoundError");
  }
}

function student(id: string): StudentIEPProfile {
  return {
    id,
    studentInitials: id.toUpperCase(),
    grade: "3rd",
    primaryEligibility: "SLD",
    iepAnnualReviewDate: "2027-06-01",
    plaafpSummary: "Private student data",
    learningProfile: { readingLevel: "", comprehensionLevel: "", communicationNeeds: [], sensoryConsiderations: [], interests: [], preferredModality: [] },
    goals: [], services: [], accommodations: [], createdAt: "2026-01-01", updatedAt: "2026-01-01",
  };
}

beforeEach(async () => {
  try { await lockTeacherAccount(); } catch {}
  await db.delete();
  await db.open();
  await accountDb.delete();
  await accountDb.open();
});

test("a teacher vault is encrypted, password-gated, and restores its students", async () => {
  const folder = new MemoryDirectory("Teacher Data");
  await db.profiles.put(student("ab"));
  const teacher = await createTeacherAccount("Ms. Rivera", "correct horse battery", folder as unknown as FileSystemDirectoryHandle);

  const rawVault = folder.files.get(teacher.vaultFilename) ?? "";
  assert.ok(rawVault.length > 0);
  assert.equal(rawVault.includes("Private student data"), false);
  assert.equal(rawVault.includes("correct horse battery"), false);

  await lockTeacherAccount();
  assert.equal(await db.profiles.count(), 0);
  await assert.rejects(unlockTeacherAccount(teacher, "wrong password"), /Incorrect password/);
  await unlockTeacherAccount(teacher, "correct horse battery");
  assert.equal((await db.profiles.get("ab"))?.studentInitials, "AB");
});

test("teachers sharing a parent folder still receive isolated vault files", async () => {
  const folder = new MemoryDirectory("School Records");
  const first = await createTeacherAccount("Teacher One", "teacher-one-password", folder as unknown as FileSystemDirectoryHandle);
  await db.profiles.put(student("one"));
  await flushVault();
  await lockTeacherAccount();

  const second = await createTeacherAccount("Teacher Two", "teacher-two-password", folder as unknown as FileSystemDirectoryHandle);
  await db.profiles.put(student("two"));
  await flushVault();
  await lockTeacherAccount();

  assert.notEqual(first.vaultFilename, second.vaultFilename);
  assert.equal(folder.files.size, 2);
  await unlockTeacherAccount(first, "teacher-one-password");
  assert.ok(await db.profiles.get("one"));
  assert.equal(await db.profiles.get("two"), undefined);
});

test("the George R. R. Martin fixture creates four fictional students inside the vault", async () => {
  const folder = new MemoryDirectory("Demo Records");
  const teacher = await createTeacherAccount(
    "George R. R. Martin",
    "winter-is-coming-demo",
    folder as unknown as FileSystemDirectoryHandle,
    seedGeorgeMartinDemo
  );

  assert.equal((await db.teacherProfiles.get("current-teacher"))?.name, "George R. R. Martin");
  assert.equal(await db.profiles.count(), georgeMartinStudents.length);
  assert.equal(await db.progressLogs.count(), georgeMartinStudents.length * 2);
  assert.equal((await db.profiles.get("demo-got-jon-snow"))?.schoolSchedule?.length, 8);
  assert.equal((folder.files.get(teacher.vaultFilename) ?? "").includes("Jon Snow"), false);

  await lockTeacherAccount();
  await unlockTeacherAccount(teacher, "winter-is-coming-demo");
  assert.deepEqual((await db.profiles.orderBy("id").keys()).sort(), georgeMartinStudents.map((student) => student.id).sort());
});

test("existing George R. R. Martin demo students receive schedules without losing edits", async () => {
  const legacyStudent = structuredClone(georgeMartinStudents[0]);
  legacyStudent.schoolSchedule = undefined;
  legacyStudent.plaafpSummary = "Teacher-edited summary";
  await db.profiles.put(legacyStudent);

  assert.equal(await backfillGeorgeMartinDemoSchedules(), 1);
  const updated = await db.profiles.get(legacyStudent.id);
  assert.equal(updated?.schoolSchedule?.length, 8);
  assert.equal(updated?.plaafpSummary, "Teacher-edited summary");
  assert.equal(await backfillGeorgeMartinDemoSchedules(), 0);
});

test("Brave-compatible accounts persist an encrypted vault without a directory picker", async () => {
  const teacher = await createTeacherAccount(
    "George R. R. Martin",
    "brave-browser-password",
    undefined,
    seedGeorgeMartinDemo
  );
  assert.equal(teacher.storageMode, "browser");
  const stored = await accountDb.vaults.get(teacher.id);
  assert.ok(stored?.encryptedPayload);
  assert.equal(stored?.encryptedPayload.includes("George R. R. Martin"), false);
  assert.equal(stored?.encryptedPayload.includes("Private student data"), false);

  await lockTeacherAccount();
  assert.equal(await db.profiles.count(), 0);
  await unlockTeacherAccount(teacher, "brave-browser-password");
  assert.equal(await db.profiles.count(), georgeMartinStudents.length);
});

test("a complete workspace can be exported, deleted, and imported on another browser", async () => {
  const teacher = await createTeacherAccount(
    "George R. R. Martin",
    "portable-vault-password",
    undefined,
    seedGeorgeMartinDemo
  );
  const exported = await exportActiveTeacherVault();
  assert.match(exported.filename, /\.se3000-vault$/);
  assert.equal(exported.data.includes("Fictional development record"), false);

  await deleteActiveTeacherWorkspace();
  assert.equal(await accountDb.accounts.get(teacher.id), undefined);
  assert.equal(await accountDb.vaults.get(teacher.id), undefined);
  assert.equal(await db.profiles.count(), 0);

  await assert.rejects(importTeacherVault(exported.data, "wrong-password"), /Incorrect password/);
  const imported = await importTeacherVault(exported.data, "portable-vault-password");
  assert.equal(imported.id, teacher.id);
  assert.equal(imported.storageMode, "browser");
  assert.equal(await db.profiles.count(), georgeMartinStudents.length);
});
