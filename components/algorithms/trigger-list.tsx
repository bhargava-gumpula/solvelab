"use client";

import { LabelBar, LabelTally, LabelToggleItem } from "@/components/algorithms/label-style";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup } from "@/components/ui/toggle-group";
import {
  FUNDAMENTALS,
  repeatsText,
  touchesText,
  triggerProgressId,
  type Trigger,
} from "@/data/algorithms/fundamentals";
import { algorithmActions, useAlgorithmProgress } from "@/hooks/use-algorithms";
import { CASE_LABELS, countLabels, type CaseLabel } from "@/lib/algorithms/labels";

/** The triggers in the order they are shown, grouped. */
function groupTriggers(): { group: string; triggers: Trigger[] }[] {
  const groups = new Map<string, Trigger[]>();
  for (const trigger of FUNDAMENTALS) {
    const list = groups.get(trigger.group) ?? [];
    list.push(trigger);
    groups.set(trigger.group, list);
  }
  return [...groups].map(([group, triggers]) => ({ group, triggers }));
}

/**
 * The Fundamentals set. There is no case to draw and nothing to solve, so each
 * trigger is a card of what it does and how the hands do it, with the same
 * three labels as a case.
 */
export function TriggerList() {
  const { loaded, labels } = useAlgorithmProgress();
  const counts = countLabels(FUNDAMENTALS.map(triggerProgressId), labels);

  return (
    <div className="grid gap-4">
      <div className="tile grid gap-2 px-5 py-4">
        <p className="text-sm text-muted-foreground" data-testid="set-progress">
          {loaded ? (
            <>
              <span className="font-mono tabular text-foreground">{counts.known}</span> of{" "}
              {counts.total} owned
            </>
          ) : (
            "Counting what you know…"
          )}
        </p>
        {loaded ? (
          <>
            <LabelBar counts={counts} className="max-w-sm" />
            <LabelTally counts={counts} />
          </>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Every number here is checked on SolveLab&apos;s own cube: how many in a row bring a solved
          cube back, and which pieces each one moves. Loop a trigger until it comes back solved
          without you watching it, then call it owned.
        </p>
      </div>

      {!loaded ? (
        <Skeleton className="h-64" />
      ) : (
        groupTriggers().map(({ group, triggers }) => (
          <section key={group} aria-labelledby={`group-${group.replace(/\W+/g, "-")}`}>
            <h2
              id={`group-${group.replace(/\W+/g, "-")}`}
              className="mb-2 eyebrow text-muted-foreground"
            >
              {group}
            </h2>
            <ul className="grid gap-3 md:grid-cols-2">
              {triggers.map((trigger) => {
                const id = triggerProgressId(trigger);
                const label = labels.get(id) ?? "unknown";
                return (
                  <li
                    key={trigger.id}
                    className="tile grid content-start gap-3 p-5"
                    data-testid={`trigger-${trigger.id}`}
                    data-label={label}
                  >
                    <div>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <h3 className="font-medium">{trigger.name}</h3>
                        {trigger.aliases?.length ? (
                          <p className="text-xs text-muted-foreground">
                            also {trigger.aliases.join(", ")}
                          </p>
                        ) : null}
                      </div>
                      <p className="mt-1 font-mono tabular text-lg">{trigger.moves}</p>
                    </div>
                    <ul className="grid gap-1 text-xs text-muted-foreground">
                      <li data-testid={`trigger-repeats-${trigger.id}`}>{repeatsText(trigger)}</li>
                      <li>{touchesText(trigger)}</li>
                    </ul>
                    <p className="text-sm">{trigger.purpose}</p>
                    {trigger.fingers ? (
                      <p className="text-sm text-muted-foreground">{trigger.fingers}</p>
                    ) : null}
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      size="sm"
                      aria-label={`Do you own ${trigger.name}?`}
                      value={label}
                      onValueChange={(value) => {
                        if (value) void algorithmActions.setLabel(id, value as CaseLabel);
                      }}
                    >
                      {CASE_LABELS.map((option) => (
                        <LabelToggleItem
                          key={option.id}
                          label={option.id}
                          value={option.id}
                          className="px-3"
                          data-testid={`trigger-label-${trigger.id}-${option.id}`}
                        />
                      ))}
                    </ToggleGroup>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
