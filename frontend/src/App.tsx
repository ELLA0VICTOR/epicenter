import { Footer } from "./components/layout/Footer";
import { NavBar } from "./components/layout/NavBar";
import { Marquee } from "./components/ui/Marquee";
import { useAnalyze } from "./hooks/useAnalyze";
import { useIncidents } from "./hooks/useIncidents";
import { AnalyzeSection } from "./sections/AnalyzeSection";
import { Hero } from "./sections/Hero";
import { PanelsSection } from "./sections/PanelsSection";
import { ProblemSection } from "./sections/ProblemSection";
import { ResultsSection } from "./sections/ResultsSection";

export default function App() {
  const incidents = useIncidents();
  const analysis = useAnalyze();
  const tickerItems = incidents.data?.incidents.map(
    (incident) => `${incident.name} / ${incident.compromisedVersionCount} artifacts`,
  ) ?? [];

  return (
    <div className="min-h-screen bg-black text-fg">
      <NavBar />
      <Marquee items={tickerItems} />
      <main>
        <Hero />
        <ProblemSection data={incidents.data} error={incidents.error} />
        <AnalyzeSection isLoading={analysis.isLoading} error={analysis.error} onAnalyze={analysis.analyze} />
        <ResultsSection result={analysis.data} />
        <PanelsSection incidents={incidents.data?.incidents ?? []} />
      </main>
      <Footer />
    </div>
  );
}
