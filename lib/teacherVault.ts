"use client";

import Dexie, { type EntityTable } from "dexie";
import db from "./db";
import type { TeacherAccount, TeacherProfile } from "@/types/iep";

const VERIFIER_TEXT = "SE3000 teacher vault verifier v1";
const PBKDF2_ITERATIONS = 310_000;

interface TeacherAccountDatabase extends Dexie {
  accounts: EntityTable<TeacherAccount, "id">;
  vaults: EntityTable<BrowserVaultRecord, "teacherId">;
}

interface BrowserVaultRecord {
  teacherId: string;
  encryptedPayload: string;
  updatedAt: string;
}

class AccountDatabase extends Dexie implements TeacherAccountDatabase {
  accounts!: EntityTable<TeacherAccount, "id">;
  vaults!: EntityTable<BrowserVaultRecord, "teacherId">;

  constructor() {
    super("SE3000TeacherAccounts");
    this.version(1).stores({ accounts: "id, name, createdAt" });
    this.version(2).stores({ accounts: "id, name, createdAt", vaults: "teacherId, updatedAt" });
  }
}

interface VaultEnvelope {
  version: 1;
  iv: string;
  ciphertext: string;
  updatedAt: string;
}

interface VaultSnapshot {
  version: 1;
  teacherId: string;
  savedAt: string;
  tables: Record<string, unknown[]>;
}

interface PortableVault {
  format: "se3000-portable-vault";
  version: 1;
  teacher: Pick<TeacherAccount, "id" | "name" | "passwordSalt" | "verifierIv" | "verifierCiphertext" | "createdAt" | "updatedAt">;
  encryptedPayload: string;
  exportedAt: string;
}

export const accountDb = new AccountDatabase();

let activeAccount: TeacherAccount | null = null;
let activeKey: CryptoKey | null = null;
let restoring = false;
let hooksInstalled = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let saveInFlight: Promise<void> | null = null;
let savePending = false;
const statusListeners = new Set<(status: VaultSaveStatus) => void>();

export type VaultSaveStatus = "idle" | "saving" | "saved" | "error";

function emitStatus(status: VaultSaveStatus) {
  statusListeners.forEach((listener) => listener(status));
}

export function subscribeToVaultStatus(listener: (status: VaultSaveStatus) => void) {
  statusListeners.add(listener);
  return () => { statusListeners.delete(listener); };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function deriveVaultKey(password: string, saltBase64: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: base64ToBytes(saltBase64), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptText(key: CryptoKey, text: string): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
  return { iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(encrypted)) };
}

async function decryptText(key: CryptoKey, iv: string, ciphertext: string): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    key,
    base64ToBytes(ciphertext)
  );
  return new TextDecoder().decode(decrypted);
}

async function requestFolderAccess(handle: FileSystemDirectoryHandle): Promise<void> {
  const descriptor = { mode: "readwrite" as const };
  const current = await handle.queryPermission(descriptor);
  if (current === "granted") return;
  const requested = await handle.requestPermission(descriptor);
  if (requested !== "granted") throw new Error("Folder access was not granted.");
}

async function encodeValue(value: unknown): Promise<unknown> {
  if (value instanceof Blob) {
    return {
      __se3000Type: "Blob",
      mimeType: value.type,
      data: bytesToBase64(new Uint8Array(await value.arrayBuffer())),
    };
  }
  if (Array.isArray(value)) return Promise.all(value.map(encodeValue));
  if (value && typeof value === "object") {
    const entries = await Promise.all(
      Object.entries(value).map(async ([key, child]) => [key, await encodeValue(child)] as const)
    );
    return Object.fromEntries(entries);
  }
  return value;
}

function decodeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decodeValue);
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;
    if (row.__se3000Type === "Blob" && typeof row.data === "string") {
      return new Blob([base64ToBytes(row.data)], { type: typeof row.mimeType === "string" ? row.mimeType : "" });
    }
    return Object.fromEntries(Object.entries(row).map(([key, child]) => [key, decodeValue(child)]));
  }
  return value;
}

async function createSnapshot(account: TeacherAccount): Promise<VaultSnapshot> {
  const tables: Record<string, unknown[]> = {};
  for (const table of db.tables) tables[table.name] = (await encodeValue(await table.toArray())) as unknown[];
  return { version: 1, teacherId: account.id, savedAt: new Date().toISOString(), tables };
}

async function writeVault(account: TeacherAccount, key: CryptoKey): Promise<void> {
  const snapshot = await createSnapshot(account);
  const encrypted = await encryptText(key, JSON.stringify(snapshot));
  const envelope: VaultEnvelope = { version: 1, ...encrypted, updatedAt: snapshot.savedAt };
  const payload = JSON.stringify(envelope);
  if (account.storageMode === "browser") {
    await accountDb.vaults.put({ teacherId: account.id, encryptedPayload: payload, updatedAt: snapshot.savedAt });
    return;
  }
  if (!account.directoryHandle) throw new Error("The selected data folder is no longer available.");
  await requestFolderAccess(account.directoryHandle);
  const fileHandle = await account.directoryHandle.getFileHandle(account.vaultFilename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(payload);
  await writable.close();
}

async function readVault(account: TeacherAccount, key: CryptoKey): Promise<VaultSnapshot> {
  let payload: string;
  if (account.storageMode === "browser") {
    const stored = await accountDb.vaults.get(account.id);
    if (!stored) throw new Error("This teacher's encrypted browser vault could not be found.");
    payload = stored.encryptedPayload;
  } else {
    if (!account.directoryHandle) throw new Error("The selected data folder is no longer available.");
    await requestFolderAccess(account.directoryHandle);
    const fileHandle = await account.directoryHandle.getFileHandle(account.vaultFilename);
    payload = await (await fileHandle.getFile()).text();
  }
  const envelope = JSON.parse(payload) as VaultEnvelope;
  if (envelope.version !== 1) throw new Error("This vault was created by an unsupported version of SE 3000.");
  const snapshot = JSON.parse(await decryptText(key, envelope.iv, envelope.ciphertext)) as VaultSnapshot;
  if (snapshot.version !== 1 || snapshot.teacherId !== account.id) throw new Error("This folder contains a different teacher's vault.");
  return snapshot;
}

async function readEncryptedPayload(account: TeacherAccount): Promise<string> {
  if (account.storageMode === "browser") {
    const stored = await accountDb.vaults.get(account.id);
    if (!stored) throw new Error("This teacher's encrypted browser vault could not be found.");
    return stored.encryptedPayload;
  }
  if (!account.directoryHandle) throw new Error("The selected data folder is no longer available.");
  await requestFolderAccess(account.directoryHandle);
  const fileHandle = await account.directoryHandle.getFileHandle(account.vaultFilename);
  return (await fileHandle.getFile()).text();
}

async function replaceWorkingDatabase(snapshot: VaultSnapshot): Promise<void> {
  restoring = true;
  try {
    await db.transaction("rw", db.tables, async () => {
      for (const table of db.tables) await table.clear();
      for (const table of db.tables) {
        const rows = snapshot.tables[table.name];
        if (Array.isArray(rows) && rows.length > 0) await table.bulkPut(decodeValue(rows) as object[]);
      }
    });
  } finally {
    restoring = false;
  }
}

async function clearWorkingDatabase(): Promise<void> {
  restoring = true;
  try {
    await db.transaction("rw", db.tables, async () => {
      for (const table of db.tables) await table.clear();
    });
  } finally {
    restoring = false;
  }
}

export function enableVaultPersistence(): void {
  if (hooksInstalled) return;
  hooksInstalled = true;
  for (const table of db.tables) {
    table.hook("creating", () => scheduleVaultSave());
    table.hook("updating", () => scheduleVaultSave());
    table.hook("deleting", () => scheduleVaultSave());
  }
}

export function scheduleVaultSave(): void {
  if (!activeAccount || !activeKey || restoring) return;
  savePending = true;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { void flushVault(); }, 250);
}

export async function flushVault(): Promise<void> {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  if (saveInFlight) await saveInFlight;
  if (!savePending || !activeAccount || !activeKey) return;
  savePending = false;
  const account = activeAccount;
  const key = activeKey;
  emitStatus("saving");
  saveInFlight = writeVault(account, key)
    .then(() => emitStatus("saved"))
    .catch((error) => {
      savePending = true;
      emitStatus("error");
      throw error;
    })
    .finally(() => { saveInFlight = null; });
  await saveInFlight;
  if (savePending) await flushVault();
}

export async function listTeacherAccounts(): Promise<TeacherAccount[]> {
  const accounts = await accountDb.accounts.orderBy("createdAt").toArray();
  return accounts.map((account) => ({
    ...account,
    storageMode: account.storageMode ?? "folder",
  }));
}

function safeExportName(name: string): string {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${normalized || "teacher"}.se3000-vault`;
}

export async function exportActiveTeacherVault(): Promise<{ filename: string; data: string }> {
  if (!activeAccount || !activeKey) throw new Error("Unlock a teacher workspace before exporting it.");
  savePending = true;
  await flushVault();
  const account = activeAccount;
  const portable: PortableVault = {
    format: "se3000-portable-vault",
    version: 1,
    teacher: {
      id: account.id,
      name: account.name,
      passwordSalt: account.passwordSalt,
      verifierIv: account.verifierIv,
      verifierCiphertext: account.verifierCiphertext,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    },
    encryptedPayload: await readEncryptedPayload(account),
    exportedAt: new Date().toISOString(),
  };
  return { filename: safeExportName(account.name), data: JSON.stringify(portable) };
}

function parsePortableVault(data: string): PortableVault {
  let value: unknown;
  try { value = JSON.parse(data); } catch { throw new Error("This is not a valid SE 3000 vault export."); }
  const portable = value as Partial<PortableVault>;
  const teacher = portable.teacher as Partial<PortableVault["teacher"]> | undefined;
  if (
    portable.format !== "se3000-portable-vault" || portable.version !== 1 ||
    typeof portable.encryptedPayload !== "string" || !teacher ||
    typeof teacher.id !== "string" || typeof teacher.name !== "string" ||
    typeof teacher.passwordSalt !== "string" || typeof teacher.verifierIv !== "string" ||
    typeof teacher.verifierCiphertext !== "string" || typeof teacher.createdAt !== "string" ||
    typeof teacher.updatedAt !== "string"
  ) throw new Error("This is not a valid SE 3000 vault export.");
  return portable as PortableVault;
}

export async function importTeacherVault(data: string, password: string): Promise<TeacherAccount> {
  const portable = parsePortableVault(data);
  if (await accountDb.accounts.get(portable.teacher.id)) throw new Error("This teacher workspace is already registered in this browser.");
  const key = await deriveVaultKey(password, portable.teacher.passwordSalt);
  try {
    const verifier = await decryptText(key, portable.teacher.verifierIv, portable.teacher.verifierCiphertext);
    if (verifier !== VERIFIER_TEXT) throw new Error("invalid verifier");
  } catch {
    throw new Error("Incorrect password for this vault export.");
  }
  const envelope = JSON.parse(portable.encryptedPayload) as VaultEnvelope;
  if (envelope.version !== 1) throw new Error("This vault export uses an unsupported version.");
  let snapshot: VaultSnapshot;
  try {
    snapshot = JSON.parse(await decryptText(key, envelope.iv, envelope.ciphertext)) as VaultSnapshot;
  } catch {
    throw new Error("The encrypted vault is damaged or the password is incorrect.");
  }
  if (snapshot.version !== 1 || snapshot.teacherId !== portable.teacher.id) throw new Error("The vault export failed its identity check.");

  const account: TeacherAccount = {
    ...portable.teacher,
    storageMode: "browser",
    folderName: "Imported encrypted storage",
    vaultFilename: safeExportName(portable.teacher.name),
  };
  await accountDb.transaction("rw", accountDb.accounts, accountDb.vaults, async () => {
    await accountDb.vaults.add({ teacherId: account.id, encryptedPayload: portable.encryptedPayload, updatedAt: portable.exportedAt });
    await accountDb.accounts.add(account);
  });
  await replaceWorkingDatabase(snapshot);
  activeAccount = account;
  activeKey = key;
  enableVaultPersistence();
  emitStatus("saved");
  return account;
}

export async function deleteActiveTeacherWorkspace(): Promise<void> {
  if (!activeAccount) throw new Error("No teacher workspace is unlocked.");
  const account = activeAccount;
  if (account.storageMode === "folder") {
    if (!account.directoryHandle) throw new Error("The selected data folder is no longer available.");
    await requestFolderAccess(account.directoryHandle);
    await account.directoryHandle.removeEntry(account.vaultFilename);
  }
  activeAccount = null;
  activeKey = null;
  savePending = false;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  await accountDb.transaction("rw", accountDb.accounts, accountDb.vaults, async () => {
    await accountDb.vaults.delete(account.id);
    await accountDb.accounts.delete(account.id);
  });
  await clearWorkingDatabase();
  emitStatus("idle");
}

export async function createTeacherAccount(
  name: string,
  password: string,
  directoryHandle?: FileSystemDirectoryHandle,
  initialize?: () => Promise<void>
): Promise<TeacherAccount> {
  if (directoryHandle) await requestFolderAccess(directoryHandle);
  const isFirstAccount = (await accountDb.accounts.count()) === 0;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveVaultKey(password, bytesToBase64(salt));
  const verifier = await encryptText(key, VERIFIER_TEXT);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const account: TeacherAccount = {
    id,
    name: name.trim(),
    storageMode: directoryHandle ? "folder" : "browser",
    folderName: directoryHandle?.name ?? "Brave encrypted storage",
    vaultFilename: `se3000-${id}.vault`,
    directoryHandle,
    passwordSalt: bytesToBase64(salt),
    verifierIv: verifier.iv,
    verifierCiphertext: verifier.ciphertext,
    createdAt: now,
    updatedAt: now,
  };

  activeAccount = account;
  activeKey = key;
  enableVaultPersistence();
  if (!isFirstAccount) await clearWorkingDatabase();

  const existingTeacher = await db.teacherProfiles.get("current-teacher");
  const teacher: TeacherProfile = {
    id: "current-teacher",
    name: account.name,
    roleTitle: existingTeacher?.roleTitle ?? "",
    subjectsOrGrades: existingTeacher?.subjectsOrGrades ?? "",
    yearsExperience: existingTeacher?.yearsExperience ?? "",
    hobbiesAndInterests: existingTeacher?.hobbiesAndInterests ?? [],
    funFacts: existingTeacher?.funFacts ?? [],
    favoriteQuote: existingTeacher?.favoriteQuote ?? "",
    teachingPhilosophy: existingTeacher?.teachingPhilosophy ?? "",
    funLearningGoalForStudents: existingTeacher?.funLearningGoalForStudents ?? "",
    contactInfo: existingTeacher?.contactInfo ?? "",
    themeColor: existingTeacher?.themeColor ?? "#4f46e5",
    photoDataUrl: existingTeacher?.photoDataUrl,
    createdAt: existingTeacher?.createdAt ?? now,
    updatedAt: now,
  };
  restoring = true;
  try {
    await db.teacherProfiles.put(teacher);
  } finally {
    restoring = false;
  }

  try {
    await initialize?.();
    savePending = true;
    await flushVault();
    await accountDb.accounts.add(account);
    return account;
  } catch (error) {
    activeAccount = null;
    activeKey = null;
    throw error;
  }
}

export async function unlockTeacherAccount(account: TeacherAccount, password: string): Promise<void> {
  // Ask while the submit gesture is still active. Browsers may reject a
  // permission prompt if it is delayed until after password derivation.
  if (account.storageMode !== "browser") {
    if (!account.directoryHandle) throw new Error("The selected data folder is no longer available.");
    await requestFolderAccess(account.directoryHandle);
  }
  const key = await deriveVaultKey(password, account.passwordSalt);
  try {
    const verifier = await decryptText(key, account.verifierIv, account.verifierCiphertext);
    if (verifier !== VERIFIER_TEXT) throw new Error("Incorrect password.");
  } catch {
    throw new Error("Incorrect password.");
  }
  const snapshot = await readVault(account, key);
  await replaceWorkingDatabase(snapshot);
  activeAccount = account;
  activeKey = key;
  enableVaultPersistence();
  emitStatus("saved");
}

export async function lockTeacherAccount(): Promise<void> {
  await flushVault();
  activeAccount = null;
  activeKey = null;
  savePending = false;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  await clearWorkingDatabase();
  emitStatus("idle");
}
