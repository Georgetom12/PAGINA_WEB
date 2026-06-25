import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AulaSidebar } from "./components/AulaSidebar";
import { AulaHome } from "./components/AulaHome";
import { AulaModulePage } from "./components/AulaModulePage";
import { useProgress } from "./hooks/useProgress";
import "./aula.css";

const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

export default function AulaPage() {
  const [, setLocation] = useLocation();
  const [authUser, setAuthUser] = useState<string | null>(null);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("psyko_auth");
    if (!raw) {
      setLocation("/login?redirect=/aula");
      return;
    }
    try {
      const { user, ts } = JSON.parse(raw) as { user: string; ts: number };
      if (Date.now() - ts > SESSION_MAX_AGE_MS) {
        localStorage.removeItem("psyko_auth");
        setLocation("/login?redirect=/aula");
        return;
      }
      setAuthUser(user);
    } catch {
      setLocation("/login?redirect=/aula");
    }
  }, [setLocation]);

  const progress = useProgress(authUser ?? "__guest__");

  if (!authUser) return null;

  const handleSelect = (id: string) => {
    setCurrentModule(id);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => setCurrentModule(null);

  const handleNext = (id: string) => {
    if (currentModule) progress.markComplete(currentModule);
    handleSelect(id);
  };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#060a0f",
      position: "relative",
    }}>
      <AulaSidebar
        currentId={currentModule}
        onSelect={handleSelect}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        completed={progress.completed}
      />

      <main style={{ flex: 1, overflow: "auto", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        <div
          className="aula-mobile-topbar"
          style={{
            display: "none",
            padding: "12px 20px",
            borderBottom: "1px solid #1a2a3a",
            background: "#0a1018",
            alignItems: "center",
            gap: 12,
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            style={{
              background: "none",
              border: "1px solid #1a2a3a",
              color: "#00e5ff",
              cursor: "pointer",
              padding: "6px 10px",
              fontSize: 16,
            }}
          >
            ☰
          </button>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 3, color: "#eceff1" }}>
            AULA VIRTUAL
          </span>
        </div>

        {currentModule ? (
          <AulaModulePage
            moduleId={currentModule}
            onBack={handleBack}
            onNext={handleNext}
            onPrev={handleSelect}
            isCompleted={progress.isCompleted(currentModule)}
            onMarkComplete={() => progress.markComplete(currentModule)}
            onMarkIncomplete={() => progress.markIncomplete(currentModule)}
          />
        ) : (
          <AulaHome
            onSelect={handleSelect}
            completed={progress.completed}
          />
        )}
      </main>
    </div>
  );
}
