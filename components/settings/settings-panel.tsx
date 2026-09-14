"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/use-local-data";
import { getRepositories } from "@/lib/storage";
import type { SettingsPatch } from "@/lib/storage/settings-repository";
import { HOLD_TO_START_OPTIONS_MS } from "@/lib/storage/schemas";
import { brand } from "@/lib/config/brand";
import { AppearanceControls } from "@/components/appearance/appearance-controls";
import { AccountSection } from "./account-section";
import { DataSection } from "./data-section";
import { HardwareTimerControls } from "./hardware-timer-section";
import { SettingsSection } from "./settings-section";

async function updateSettings(patch: SettingsPatch) {
  try {
    await getRepositories().settings.update(patch);
  } catch {
    toast.error("Couldn’t save that setting");
  }
}

export function SettingsPanel() {
  const settings = useSettings();

  return (
    <div className="grid max-w-3xl gap-5">
      <AccountSection />

      <SettingsSection
        id="appearance"
        title="Appearance"
        description="Themes, timer digits and motion. Saved on this device."
      >
        <AppearanceControls />
      </SettingsSection>

      <SettingsSection id="timer" title="Timer" description="Changes apply to your next solve.">
        {settings ? (
          <div className="grid gap-5">
            <SettingRow
              id="inspection"
              label="WCA inspection"
              description="15 seconds to inspect. Starting 15–17 s adds +2; after 17 s is DNF."
            >
              <Switch
                id="inspection"
                checked={settings.inspectionSeconds === 15}
                onCheckedChange={(checked) =>
                  updateSettings({ inspectionSeconds: checked ? 15 : 0 })
                }
              />
            </SettingRow>
            <SettingRow
              id="audio-cues"
              label="Inspection sounds"
              description="Short tones at 8 and 12 seconds, like a judge’s calls."
            >
              <Switch
                id="audio-cues"
                checked={settings.inspectionAudioCues}
                disabled={settings.inspectionSeconds === 0}
                onCheckedChange={(checked) => updateSettings({ inspectionAudioCues: checked })}
              />
            </SettingRow>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium" id="hold-label">
                  Hold to start
                </p>
                <p className="text-sm text-muted-foreground">
                  How long to hold before the timer turns green.
                </p>
              </div>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                aria-labelledby="hold-label"
                value={String(settings.holdToStartMs)}
                onValueChange={(value) => value && updateSettings({ holdToStartMs: Number(value) })}
              >
                {HOLD_TO_START_OPTIONS_MS.map((ms) => (
                  <ToggleGroupItem key={ms} value={String(ms)} className="px-3 font-mono tabular">
                    {ms === 0 ? "Instant" : `${(ms / 1000).toFixed(2)}s`}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <HardwareTimerControls
              value={settings.timerInput}
              onChange={(timerInput) => void updateSettings({ timerInput })}
            />
            <SettingRow
              id="hide-time"
              label="Hide time while solving"
              description="Shows “Solving” instead of running digits, so the clock can’t distract you."
            >
              <Switch
                id="hide-time"
                checked={settings.hideTimeWhileRunning}
                onCheckedChange={(checked) => updateSettings({ hideTimeWhileRunning: checked })}
              />
            </SettingRow>
            <SettingRow
              id="preview"
              label="Scramble preview"
              description="Show a flat diagram of the scrambled cube."
            >
              <Switch
                id="preview"
                checked={settings.showScramblePreview}
                onCheckedChange={(checked) => updateSettings({ showScramblePreview: checked })}
              />
            </SettingRow>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground" role="status">
            Loading preferences…
          </p>
        )}
      </SettingsSection>

      <DataSection />

      <SettingsSection
        id="about"
        title={`${brand.name} ${brand.version}`}
        description={brand.versionLabel}
      >
        <p className="text-sm text-muted-foreground">
          What this version includes, and what is planned next, is on the Overview page.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-3 w-fit">
          <Link href="/overview/">Overview</Link>
        </Button>
      </SettingsSection>
    </div>
  );
}

function SettingRow({
  id,
  label,
  description,
  children,
}: {
  id: string;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="pt-0.5">{children}</div>
    </div>
  );
}
