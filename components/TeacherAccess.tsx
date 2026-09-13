"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Database, FileUp, FolderLock, FolderOpen, GraduationCap, KeyRound, LockKeyhole, ShieldCheck, UserPlus } from "lucide-react";
import type { TeacherAccount } from "@/types/iep";
import {
  createTeacherAccount,
  deleteActiveTeacherWorkspace,
  exportActiveTeacherVault,
  importTeacherVault,
  listTeacherAccounts,
  lockTeacherAccount,
  subscribeToVaultStatus,
  unlockTeacherAccount,
  type VaultSaveStatus,
} from "@/lib/teacherVault";
import { seedGeorgeMartinDemo } from "@/lib/georgeMartinDemo";

interface TeacherSessionValue {
  teacher: TeacherAccount;
  saveStatus: VaultSaveStatus;
  lock: () => Promise<void>;
  exportVault: () => Promise<{ filename: string; data: string }>;
  deleteWorkspace: () => Promise<void>;
}

const TeacherSessionContext = createContext<TeacherSessionValue | null>(null);

export function useTeacherSession(): TeacherSessionValue {
  const value = useContext(TeacherSessionContext);
  if (!value) throw new Error("useTeacherSession must be used inside TeacherAccess.");
  return value;
}

function PasswordField({
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <div className="relative">
      <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      />
    </div>
  );
}

export default function TeacherAccess({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<TeacherAccount[]>([]);
  const [teacher, setTeacher] = useState<TeacherAccount | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState<"unlock" | "create" | "import">("unlock");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [folder, setFolder] = useState<FileSystemDirectoryHandle | null>(null);
  const [folderStorageSupported, setFolderStorageSupported] = useState(false);
  const [useGeorgeMartinDemo, setUseGeorgeMartinDemo] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<VaultSaveStatus>("idle");

  const refreshAccounts = useCallback(async () => {
    const rows = await listTeacherAccounts();
    setAccounts(rows);
    setSelectedId((current) => current || rows[0]?.id || "");
    if (rows.length === 0) setMode("create");
  }, []);

  useEffect(() => {
    setFolderStorageSupported(typeof window.showDirectoryPicker === "function");
    refreshAccounts()
      .catch(() => setError("Teacher profiles could not be loaded from this browser."))
      .finally(() => setLoading(false));
    return subscribeToVaultStatus(setSaveStatus);
  }, [refreshAccounts]);

  async function chooseFolder() {
    setError("");
    if (!window.showDirectoryPicker) {
      setError("Folder storage requires Chrome, Edge, or another browser that supports the File System Access API.");
      return;
    }
    try {
      setFolder(await window.showDirectoryPicker({ mode: "readwrite" }));
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === "AbortError")) setError("The folder could not be opened.");
    }
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError("Enter the teacher's name.");
    if (password.length < 10) return setError("Use a password with at least 10 characters.");
    if (password !== confirmation) return setError("The passwords do not match.");
    if (folderStorageSupported && !folder) return setError("Choose the local folder where this teacher's encrypted data will be saved.");
    setBusy(true);
    setError("");
    try {
      const created = await createTeacherAccount(
        name,
        password,
        folderStorageSupported ? folder ?? undefined : undefined,
        useGeorgeMartinDemo ? seedGeorgeMartinDemo : undefined
      );
      setTeacher(created);
      setPassword("");
      setConfirmation("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The teacher profile could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlock(event: React.FormEvent) {
    event.preventDefault();
    const account = accounts.find((item) => item.id === selectedId);
    if (!account) return setError("Choose a teacher profile.");
    if (!password) return setError("Enter this teacher's password.");
    setBusy(true);
    setError("");
    try {
      await unlockTeacherAccount(account, password);
      setTeacher(account);
      setPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This teacher profile could not be unlocked.");
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(event: React.FormEvent) {
    event.preventDefault();
    if (!importFile) return setError("Choose an exported .se3000-vault file.");
    if (!password) return setError("Enter the password that protects this vault.");
    setBusy(true);
    setError("");
    try {
      const imported = await importTeacherVault(await importFile.text(), password);
      setTeacher(imported);
      setPassword("");
      setImportFile(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The teacher vault could not be imported.");
    } finally {
      setBusy(false);
    }
  }

  const sessionValue = useMemo<TeacherSessionValue | null>(() => teacher ? {
    teacher,
    saveStatus,
    lock: async () => {
      await lockTeacherAccount();
      setTeacher(null);
      setPassword("");
      await refreshAccounts();
    },
    exportVault: exportActiveTeacherVault,
    deleteWorkspace: async () => {
      await deleteActiveTeacherWorkspace();
      setTeacher(null);
      setPassword("");
      await refreshAccounts();
    },
  } : null, [teacher, saveStatus, refreshAccounts]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm font-semibold text-indigo-200">Loading secure teacher profiles…</div>;
  }

  if (teacher && sessionValue) {
    return <TeacherSessionContext.Provider value={sessionValue}>{children}</TeacherSessionContext.Provider>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-900">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-700 bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-7 text-white">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30">
            <FolderLock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">SE 3000 Secure Workspace</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">Each teacher has a separate password-protected, encrypted data vault.</p>
        </div>

        <div className="p-6">
          <div className={`mb-5 grid ${accounts.length > 0 ? "grid-cols-3" : "grid-cols-2"} rounded-xl bg-slate-100 p-1 text-xs font-bold`}>
            {accounts.length > 0 && <button type="button" onClick={() => { setMode("unlock"); setError(""); }} className={`rounded-lg px-3 py-2 ${mode === "unlock" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}>Unlock</button>}
            <button type="button" onClick={() => { setMode("create"); setError(""); }} className={`rounded-lg px-3 py-2 ${mode === "create" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}>New teacher</button>
            <button type="button" onClick={() => { setMode("import"); setError(""); }} className={`rounded-lg px-3 py-2 ${mode === "import" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}>Import</button>
          </div>

          {mode === "unlock" ? (
            <form key="unlock" onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">Teacher profile</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200">
                    {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} — {account.storageMode === "browser" ? "Brave secure storage" : account.folderName}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">Password</label>
                <PasswordField value={password} onChange={setPassword} placeholder="Enter password" autoComplete="current-password" />
              </div>
              {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p>}
              <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                <LockKeyhole className="h-4 w-4" /> {busy ? "Unlocking…" : "Unlock workspace"}
              </button>
            </form>
          ) : mode === "import" ? (
            <form key="import" onSubmit={handleImport} className="space-y-4">
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-indigo-950"><FileUp className="h-5 w-5 text-indigo-600" /> Import encrypted teacher vault</div>
                <p className="mt-1.5 text-[11px] leading-5 text-indigo-800">Select a vault previously exported from SE 3000. It remains encrypted until its original password is verified.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">Vault export file</label>
                <input type="file" accept=".se3000-vault,application/json" onChange={(event) => setImportFile(event.target.files?.[0] ?? null)} className="block w-full rounded-xl border border-slate-300 p-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-100 file:px-3 file:py-2 file:font-bold file:text-indigo-700" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">Vault password</label>
                <PasswordField value={password} onChange={setPassword} placeholder="Enter the original password" autoComplete="current-password" />
              </div>
              {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p>}
              <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                <FileUp className="h-4 w-4" /> {busy ? "Importing…" : "Import and unlock"}
              </button>
            </form>
          ) : (
            <form key="create" onSubmit={handleCreate} className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  const next = !useGeorgeMartinDemo;
                  setUseGeorgeMartinDemo(next);
                  if (next) setName("George R. R. Martin");
                }}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${useGeorgeMartinDemo ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
              >
                <Database className={`mt-0.5 h-5 w-5 shrink-0 ${useGeorgeMartinDemo ? "text-amber-700" : "text-slate-500"}`} />
                <span>
                  <span className="block text-sm font-bold text-slate-900">Game of Thrones development fixture</span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-slate-600">George R. R. Martin with four clearly fictional, character-inspired students and sample progress data.</span>
                </span>
              </button>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">Teacher name</label>
                <input value={name} onChange={(event) => { setName(event.target.value); if (event.target.value !== "George R. R. Martin") setUseGeorgeMartinDemo(false); }} placeholder="e.g. Jordan Lee" autoComplete="name" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">Password</label>
                <PasswordField value={password} onChange={setPassword} placeholder="At least 10 characters" autoComplete="new-password" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">Confirm password</label>
                <PasswordField value={confirmation} onChange={setConfirmation} placeholder="Enter it again" autoComplete="new-password" />
              </div>
              {folderStorageSupported ? (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">Local data folder</label>
                  <button type="button" onClick={chooseFolder} className="flex w-full items-center gap-3 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-3 py-3 text-left hover:bg-indigo-100">
                    <FolderOpen className="h-5 w-5 shrink-0 text-indigo-600" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-indigo-900">{folder?.name || "Choose a folder…"}</span>
                      <span className="block text-[11px] text-indigo-700">SE 3000 will write one encrypted vault file here.</span>
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-indigo-950">
                  <Database className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                  <div>
                    <p className="text-sm font-bold">Brave-compatible secure storage</p>
                    <p className="mt-1 text-[11px] leading-4 text-indigo-800">Brave blocks folder access, so this encrypted vault will be saved automatically inside this Brave browser profile.</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2 rounded-xl bg-amber-50 p-3 text-[11px] leading-5 text-amber-900">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{folderStorageSupported ? "Passwords cannot be recovered. Keep the selected folder and its SE 3000 vault file backed up." : "Passwords cannot be recovered. Clearing Brave site data will remove this locally encrypted vault."}</p>
              </div>
              {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p>}
              <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                <UserPlus className="h-4 w-4" /> {busy ? "Creating encrypted vault…" : "Create teacher profile"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
