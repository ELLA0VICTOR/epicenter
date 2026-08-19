import { useState, type FormEvent } from "react";

import { useTyposquats } from "../../hooks/useTyposquats";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export function TyposquatPanel() {
  const [input, setInput] = useState("mbt");
  const [packageName, setPackageName] = useState("mbt");
  const { data, error, isLoading } = useTyposquats(packageName);
  const result = data?.packageName === packageName ? data : null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextPackage = input.trim();
    if (nextPackage) setPackageName(nextPackage);
  };

  return (
    <Card cornerAccent eyebrow="06 / Typosquat watch" className="h-full">
      <div className="border-b border-rule p-6 md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-2xl font-medium tracking-[-0.035em] text-white">
              Names within two edits
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
              Read precomputed NAME_SIMILAR_TO edges against 2,000 ranked npm
              package names. No string distance runs in this request.
            </p>
          </div>
          <Badge tone={result?.matches.length ? "critical" : "safe"}>
            {isLoading ? "Querying" : `${result?.matches.length ?? 0} nearby`}
          </Badge>
        </div>
        <form className="mt-7 flex flex-col gap-2 sm:flex-row" onSubmit={submit}>
          <label className="sr-only" htmlFor="typosquat-package-name">Seeded package name</label>
          <input
            id="typosquat-package-name"
            className="min-h-12 min-w-0 flex-1 border border-rule-strong bg-black px-4 font-mono text-xs text-white outline-none placeholder:text-dim focus:border-accent"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="mbt"
          />
          <Button type="submit">Check name</Button>
        </form>
      </div>
      <div className="p-6 md:p-8" aria-live="polite">
        {error ? (
          <p role="alert" className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">{error}</p>
        ) : isLoading || !result ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-dim">Reading similarity edges...</p>
        ) : result.matches.length === 0 ? (
          <div>
            <div className="font-display text-5xl text-white">0</div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white">No nearby high-impact names</p>
            <p className="mt-3 text-sm leading-6 text-dim">No different name in the 2,000-package snapshot is within Levenshtein distance two of {result.packageName}.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {result.matches.map((match) => (
              <div className="flex items-center justify-between gap-4 border border-rule px-4 py-3" key={match.name}>
                <span className="font-mono text-xs text-white">{match.name}</span>
                <Badge tone="critical">distance {match.distance}</Badge>
              </div>
            ))}
          </div>
        )}
        {result ? (
          <a className="mt-6 inline-block font-mono text-[9px] uppercase tracking-[0.13em] text-dim hover:text-accent" href={result.corpus.sourceUrl} target="_blank" rel="noreferrer">
            Source / {result.corpus.name} / {result.corpus.packageCount} names
          </a>
        ) : null}
      </div>
    </Card>
  );
}
