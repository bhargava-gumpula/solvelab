interface SettingsSectionProps {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingsSection({ id, title, description, children }: SettingsSectionProps) {
  const headingId = `${id ?? title.toLowerCase().replace(/\W+/g, "-")}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-20 rounded-2xl p-5 glass md:p-6"
    >
      <h2 id={headingId} className="text-base font-semibold">
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
