"use client";

import { Check, MonitorSmartphone } from "lucide-react";
import { motion } from "motion/react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DIGIT_FONTS } from "@/lib/appearance/preferences";
import { THEMES } from "@/lib/appearance/themes";
import { cn } from "@/lib/utils";
import { useAppearance } from "./appearance-provider";

export const PANEL_LAYOUT_RESET_EVENT = "solvelab:reset-panels";

const DIGIT_CLASS: Record<string, string> = {
  clean: "font-mono",
  lcd: "font-lcd",
  dot: "font-dot",
};

/** Theme gallery and display options, shared by the Appearance sheet and Settings. */
export function AppearanceControls() {
  const { preferences, update, theme } = useAppearance();

  return (
    <div className="grid gap-7">
      <section aria-labelledby="theme-heading">
        <h3 id="theme-heading" className="mb-3 eyebrow">
          Theme
        </h3>
        <div
          role="radiogroup"
          aria-label="Theme"
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
        >
          {THEMES.map((option) => {
            const selected = preferences.theme === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={option.label}
                onClick={() => update({ theme: option.id })}
                className={cn(
                  "group relative overflow-hidden rounded-xl border text-left transition-transform hover:-translate-y-0.5",
                  selected ? "border-primary ring-2 ring-primary/50" : "border-border",
                )}
              >
                <span
                  aria-hidden
                  className="block h-16 w-full"
                  style={{
                    background: `radial-gradient(70% 90% at 25% 30%, ${option.swatch[1]} 0%, transparent 70%),
                      radial-gradient(60% 80% at 85% 80%, ${option.swatch[2]} 0%, transparent 70%), ${option.swatch[0]}`,
                  }}
                />
                <span className="flex items-center justify-between gap-2 bg-card px-2.5 py-2">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                  {selected && (
                    <motion.span
                      layoutId="theme-check"
                      className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
                    >
                      <Check className="size-3" />
                    </motion.span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          role="radio"
          aria-checked={preferences.theme === "system"}
          aria-label="Match system"
          onClick={() => update({ theme: "system" })}
          className={cn(
            "mt-2.5 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted",
            preferences.theme === "system"
              ? "border-primary ring-2 ring-primary/50"
              : "border-border",
          )}
        >
          <MonitorSmartphone className="size-4 text-muted-foreground" aria-hidden />
          <span className="flex-1">
            Match system
            <span className="block text-[11px] text-muted-foreground">
              Nebula when dark, Paper when light
            </span>
          </span>
          {preferences.theme === "system" && <Check className="size-4 text-primary" />}
        </button>
      </section>

      <section aria-labelledby="digits-heading" className="grid gap-3">
        <h3 id="digits-heading" className="eyebrow">
          Timer digits
        </h3>
        <ToggleGroup
          type="single"
          variant="outline"
          value={preferences.digitFont}
          onValueChange={(value) =>
            value && update({ digitFont: value as typeof preferences.digitFont })
          }
          aria-labelledby="digits-heading"
          className="w-full"
        >
          {DIGIT_FONTS.map((font) => (
            <ToggleGroupItem
              key={font.id}
              value={font.id}
              className="h-auto flex-1 flex-col gap-1 py-2.5"
              aria-label={font.label}
            >
              <span className={cn("tabular text-xl leading-none", DIGIT_CLASS[font.id])}>
                12.34
              </span>
              <span className="text-[11px] text-muted-foreground">{font.label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="timer-scale" className="text-sm">
              Timer size
            </Label>
            <span className="font-mono tabular text-xs text-muted-foreground">
              {Math.round(preferences.timerScale * 100)}%
            </span>
          </div>
          <Slider
            id="timer-scale"
            min={0.7}
            max={1.4}
            step={0.05}
            value={[preferences.timerScale]}
            onValueChange={([value]) => update({ timerScale: value })}
            aria-label="Timer size"
          />
        </div>
      </section>

      <section aria-labelledby="motion-heading" className="grid gap-4">
        <h3 id="motion-heading" className="eyebrow">
          Motion and extras
        </h3>
        <ToggleRow
          id="animated-bg"
          label="Animated background"
          description={
            theme.background.kind === "solid"
              ? "This theme uses a still background."
              : "A slow-moving shader behind the timer."
          }
          checked={preferences.animatedBackground}
          disabled={theme.background.kind === "solid"}
          onChange={(checked) => update({ animatedBackground: checked })}
        />
        <ToggleRow
          id="pause-bg"
          label="Pause background during solves"
          description="Freezes the animation while the timer runs."
          checked={preferences.pauseBackgroundWhileSolving}
          onChange={(checked) => update({ pauseBackgroundWhileSolving: checked })}
        />
        <ToggleRow
          id="live-averages"
          label="Live averages under the timer"
          description="Ao5 and Ao12 update after every solve."
          checked={preferences.liveAverages}
          onChange={(checked) => update({ liveAverages: checked })}
        />
        <ToggleRow
          id="celebrations"
          label="Celebrate personal bests"
          description="A short confetti burst for a new best single or average."
          checked={preferences.celebrations}
          onChange={(checked) => update({ celebrations: checked })}
        />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium" id="cube-preview-label">
              Scramble preview
            </p>
            <p className="text-sm text-muted-foreground">
              Interactive 3D cube, flat net, or hidden.
            </p>
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={preferences.cubePreview}
            onValueChange={(value) =>
              value && update({ cubePreview: value as typeof preferences.cubePreview })
            }
            aria-labelledby="cube-preview-label"
          >
            <ToggleGroupItem value="3d" className="px-3">
              3D
            </ToggleGroupItem>
            <ToggleGroupItem value="2d" className="px-3">
              2D
            </ToggleGroupItem>
            <ToggleGroupItem value="off" className="px-3">
              Off
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(PANEL_LAYOUT_RESET_EVENT))}
          className="justify-self-start text-sm text-primary underline-offset-4 hover:underline"
        >
          Reset panel positions
        </button>
      </section>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}
