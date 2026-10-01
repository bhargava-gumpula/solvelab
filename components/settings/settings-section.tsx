interface SettingsSectionProps {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingsSection({ id, title, description, children }: SettingsSectionProps) {
  const headingId = `${id ?? title.toLowerCase().replace(/\W+/g, "-")}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className="tile scroll-mt-32 p-6 md:p-8">
      <h2 id={headingId} className="font-display text-[2rem] leading-none">
        {title}
      </h2>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
