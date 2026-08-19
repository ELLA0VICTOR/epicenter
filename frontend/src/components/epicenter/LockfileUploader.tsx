import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { PixelMark } from "../ui/PixelMark";

interface LockfileUploaderProps {
  isLoading: boolean;
  error: string | null;
  onAnalyze: (lockfile: string, sourceLabel?: string) => Promise<unknown>;
}

export function LockfileUploader({ isLoading, error, onAnalyze }: LockfileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lockfile, setLockfile] = useState("");
  const [sourceLabel, setSourceLabel] = useState("Pasted package-lock.json");
  const [dragActive, setDragActive] = useState(false);

  const readFile = async (file: File) => {
    setLockfile(await file.text());
    setSourceLabel(file.name);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void readFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files[0];
    if (file) void readFile(file);
  };

  return (
    <Card cornerAccent eyebrow="package-lock.json / v2 + v3" className="overflow-hidden">
      <div
        className={`border-b border-rule px-5 py-8 text-center md:px-8 ${dragActive ? "drop-active" : ""}`}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <PixelMark className="mx-auto h-7 w-7 text-accent" />
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-white">Drop your lockfile here</p>
        <p className="mt-2 text-sm text-dim">or select a local package-lock.json</p>
        <input ref={inputRef} className="sr-only" type="file" accept="application/json,.json" onChange={handleFile} aria-label="Choose package-lock.json" />
        <Button className="mt-5 min-h-10" variant="outline" type="button" onClick={() => inputRef.current?.click()}>
          Choose file
        </Button>
      </div>
      <label className="block px-5 pt-5 font-mono text-[9px] uppercase tracking-[0.16em] text-dim" htmlFor="lockfile-input">
        Or paste raw JSON
      </label>
      <textarea
        id="lockfile-input"
        aria-label="Package lock JSON"
        className="min-h-64 w-full resize-y border-0 bg-black px-5 py-4 font-mono text-xs leading-5 text-muted outline-none placeholder:text-dim md:px-8"
        value={lockfile}
        onChange={(event) => {
          setLockfile(event.target.value);
          setSourceLabel("Pasted package-lock.json");
        }}
        placeholder={'{\n  "name": "your-project",\n  "lockfileVersion": 3,\n  "packages": { ... }\n}'}
        spellCheck={false}
      />
      <div className="flex flex-col gap-4 border-t border-rule p-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-dim">
          {lockfile ? `${Math.round(lockfile.length / 1024)} KB / ${sourceLabel}` : "Nothing leaves this analysis request"}
        </div>
        <Button
          className="sm:min-w-48"
          disabled={isLoading || lockfile.trim().length === 0}
          type="button"
          onClick={() => void onAnalyze(lockfile, sourceLabel).catch(() => undefined)}
        >
          {isLoading ? "Tracing graph..." : "Analyze blast radius"}
        </Button>
      </div>
      {error ? (
        <div role="alert" className="border-t border-accent px-5 py-4 font-mono text-[10px] uppercase tracking-[0.12em] text-accent md:px-8">
          Analysis failed / {error}
        </div>
      ) : null}
    </Card>
  );
}
