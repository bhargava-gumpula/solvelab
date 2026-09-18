import type { AppearancePreferences } from "@/lib/appearance/preferences";
import type { UserSettings, ViewPreferences } from "@/types/domain";
import type { LocalDatabase } from "./database";
import { normalizeSettings, settingsSchema } from "./schemas";

export type SettingsPatch = Partial<Omit<UserSettings, "id">>;

export class SettingsRepository {
  constructor(private readonly db: LocalDatabase) {}

  async get(): Promise<UserSettings> {
    return normalizeSettings(await this.db.settings.get("preferences"));
  }

  async update(patch: SettingsPatch): Promise<UserSettings> {
    return this.db.transaction("rw", this.db.settings, async () => {
      const current = normalizeSettings(await this.db.settings.get("preferences"));
      const next = normalizeSettings(
        settingsSchema.parse({
          ...current,
          ...patch,
          id: "preferences",
          updatedAt: new Date().toISOString(),
        }),
      );
      await this.db.settings.put(next);
      return next;
    });
  }

  /** Merges view choices inside the transaction so quick successive changes all stick. */
  async updateView(patch: Partial<ViewPreferences>): Promise<UserSettings> {
    return this.db.transaction("rw", this.db.settings, async () => {
      const current = normalizeSettings(await this.db.settings.get("preferences"));
      const next = normalizeSettings(
        settingsSchema.parse({
          ...current,
          view: { ...current.view, ...patch },
          updatedAt: new Date().toISOString(),
        }),
      );
      await this.db.settings.put(next);
      return next;
    });
  }

  /**
   * Records this device's existing appearance the first time settings carry
   * one. It keeps the old edit time, so an account copy that was edited more
   * recently still wins when the two are merged.
   */
  async adoptAppearance(appearance: AppearancePreferences): Promise<void> {
    await this.db.transaction("rw", this.db.settings, async () => {
      const current = normalizeSettings(await this.db.settings.get("preferences"));
      if (current.appearance) return;
      await this.db.settings.put(normalizeSettings({ ...current, appearance }));
    });
  }
}
