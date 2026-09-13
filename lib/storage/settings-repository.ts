import type { UserSettings } from "@/types/domain";
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
      const next = settingsSchema.parse({ ...current, ...patch, id: "preferences" });
      await this.db.settings.put(next);
      return next;
    });
  }
}
