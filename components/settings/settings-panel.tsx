"use client";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, Database, ShieldCheck } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { DATABASE_VERSION } from "@/lib/storage/database";
const subscribe = () => () => {};
const modes = [{ id: "light", label: "Light", icon: Sun }, { id: "dark", label: "Dark", icon: Moon }, { id: "system", label: "System", icon: Monitor }];

export function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const { status, retry } = useStorageStatus();
  return <div className="settings-stack"><section className="panel settings-section"><div className="settings-heading"><div><h2>Appearance</h2><p>Make this space feel comfortable for your next session.</p></div></div><RadioGroup aria-label="Theme" className="theme-options" value={mounted ? (theme ?? "dark") : ""} onValueChange={setTheme}>{modes.map(({ id, label, icon: Icon }) => <label htmlFor={`theme-${id}`} className="theme-option" key={id}><div className={`theme-swatch swatch-${id}`} aria-hidden="true"><span/><div><i/><i/><i/></div></div><div className="theme-option-label"><Icon size={17}/><span>{label}</span><RadioGroupItem value={id} id={`theme-${id}`}/></div></label>)}</RadioGroup></section>
    <section className="panel settings-section"><div className="settings-heading"><div><h2>Your data, on your device</h2><p>No account or cloud connection is needed for the core experience.</p></div><ShieldCheck size={22}/></div><div className="storage-status" role="status"><Database size={21}/><div><strong>{status === "ready" ? "Local database ready" : status === "error" ? "Local storage is unavailable" : "Opening local database…"}</strong><p>{status === "ready" ? `Version ${DATABASE_VERSION} · A default session is initialized. No sample solves have been stored.` : status === "error" ? "Your browser may be blocking storage. Enable site storage and retry. Existing data has not been reset." : "Checking this browser’s storage."}</p></div>{status === "error" && <Button variant="outline" onClick={retry}>Retry</Button>}</div><p className="settings-fineprint">Data belongs to this browser and website address. Clearing site data removes local records. JSON backup and restore will arrive with the working timer.</p></section>
    <section className="panel settings-section"><div className="settings-heading"><div><h2>Built in deliberate steps</h2><p>Current stage: V0 design and architecture foundation.</p></div></div><div className="roadmap-list"><div><span className="roadmap-current">V0</span><strong>Foundation</strong><span>In review</span></div><div><span>V1</span><strong>Daily timer</strong><span>Next phase</span></div><div><span>V1.5</span><strong>Algorithm trainer</strong><span>Planned</span></div><div><span>V2</span><strong>Diagnostic coach</strong><span>Planned</span></div></div></section>
  </div>;
}
