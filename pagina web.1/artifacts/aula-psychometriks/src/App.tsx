import React, { useState, useEffect, useMemo } from "react";
import { Sidebar } from "./components/Sidebar";
import { HomePage } from "./components/HomePage";
import { ModulePage } from "./components/ModulePage";
import { MarketLivePanel } from "./components/MarketLivePanel";
import { ExamPage } from "./components/ExamPage";
import { TestsPage } from "./components/TestsPage";
import { ProfilePage } from "./components/ProfilePage";
import { DashboardPage } from "./components/DashboardPage";
import { RetosPage } from "./components/RetosPage";
import { LoginPage } from "./pages/LoginPage";
import { AdminPanel } from "./pages/AdminPanel";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { User, initStorage, getSession, logout, ROLE_META, LEVEL_ACCESS } from "./auth/types";
import { MODULES } from "./data/modules";
import { getExamHistory } from "./auth/examHistory";
import { computeStats } from "./auth/userProgress";
import { getLessonsDone, getLevelProgress } from "./auth/lessonProgress";
import type { ExamMode } from "./data/examQuestions";

type SpecialView = "exam" | "tests" | "profile" | "dashboard" | "retos" | null;

const SPECIAL_IDS = new Set(["mercados-live"]);

// Parse hash like "#test-N1" → { view: "exam", mode: "N1" }
function parseHash(hash: string): { view: SpecialView; mode: ExamMode | null } {
  const h = hash.replace("#", "").trim();
  if (h.startsWith("test-")) {
    const mode = h.replace("test-", "").toUpperCase() as ExamMode;
    return { view: "exam", mode };
  }
  return { view: null, mode: null };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [specialView, setSpecialView] = useState<SpecialView>(null);
  const [examInitialMode, setExamInitialMode] = useState<ExamMode | undefined>(undefined);
  const [lessonsDoneVersion, setLessonsDoneVersion] = useState(0); // bump to trigger re-read

  const initialModule = () => {
    const hash = window.location.hash.replace("#", "").trim();
    if (hash.startsWith("test-")) return null;
    return hash || null;
  };
  const [currentModule, setCurrentModule] = useState<string | null>(initialModule);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    initStorage();
    const user = getSession();
    setCurrentUser(user);
    setAuthReady(true);

    // Handle initial hash — e.g. coming from a shared link
    const parsed = parseHash(window.location.hash);
    if (parsed.view === "exam" && parsed.mode) {
      setSpecialView("exam");
      setExamInitialMode(parsed.mode);
    }
  }, []);

  // Live stats for sidebar badges
  const sidebarStats = useMemo(() => {
    if (!currentUser) return { currentStreak: 0, earnedBadges: 0 };
    const history = getExamHistory(currentUser.id);
    const stats = computeStats(history);
    return { currentStreak: stats.currentStreak, earnedBadges: stats.earnedBadges.length };
  }, [currentUser, specialView]);

  // Lesson progress for sidebar indicators
  const { lessonsDone, levelProgress } = useMemo(() => {
    if (!currentUser) return { lessonsDone: {}, levelProgress: {} };
    const done = getLessonsDone(currentUser.id);
    const modulesByLevel: Record<string, string[]> = {};
    MODULES.forEach(m => {
      if (!modulesByLevel[m.level]) modulesByLevel[m.level] = [];
      modulesByLevel[m.level].push(m.id);
    });
    const progress = getLevelProgress(currentUser.id, modulesByLevel);
    return { lessonsDone: done, levelProgress: progress };
  }, [currentUser, lessonsDoneVersion]);

  const handleLogin = (user: User) => setCurrentUser(user);

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setCurrentModule(null);
    setSpecialView(null);
    window.location.hash = "";
  };

  const canAccessModule = (moduleId: string): boolean => {
    if (!currentUser) return false;
    if (SPECIAL_IDS.has(moduleId)) return true;
    const mod = MODULES.find(m => m.id === moduleId);
    if (!mod) return true;
    return LEVEL_ACCESS[currentUser.role].includes(mod.level);
  };

  const handleSelect = (id: string) => {
    if (!canAccessModule(id)) return;
    setSpecialView(null);
    setCurrentModule(id);
    window.location.hash = id;
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentModule(null);
    window.location.hash = "";
    // Bump to refresh lesson completion after visiting a module
    setLessonsDoneVersion(v => v + 1);
  };

  const goHome = () => {
    setCurrentModule(null);
    setSpecialView(null);
    window.location.hash = "";
    setLessonsDoneVersion(v => v + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goSpecial = (view: SpecialView, mode?: ExamMode) => {
    setSpecialView(view);
    setExamInitialMode(mode);
    setCurrentModule(null);
    if (view === "exam" && mode) {
      window.location.hash = `test-${mode}`;
    } else {
      window.location.hash = "";
    }
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle test start from TestsPage — opens exam with a specific mode
  const handleStartExam = (mode: ExamMode) => {
    goSpecial("exam", mode);
  };

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace("#", "").trim();
      // Deep link to test
      if (hash.startsWith("test-")) {
        const mode = hash.replace("test-", "").toUpperCase() as ExamMode;
        setSpecialView("exam");
        setExamInitialMode(mode);
        setCurrentModule(null);
        return;
      }
      if (hash && !canAccessModule(hash)) {
        window.location.hash = "";
        setCurrentModule(null);
        return;
      }
      if (hash) setSpecialView(null);
      setCurrentModule(hash || null);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [currentUser]);

  if (!authReady) {
    return (
      <div style={{
        minHeight: "100vh", background: "#060a0f", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ color: "#00e5ff", fontFamily: "'Orbitron', monospace", letterSpacing: 4, fontSize: 12 }}>
          CARGANDO...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const roleColor = ROLE_META[currentUser.role].color;

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "var(--bg)", position: "relative",
    }}>
      <Sidebar
        currentId={specialView ? null : currentModule}
        onSelect={handleSelect}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onAdmin={() => setShowAdmin(true)}
        onChangePwd={() => setShowChangePwd(true)}
        onExam={() => goSpecial("exam")}
        showExam={specialView === "exam"}
        onTests={() => goSpecial("tests")}
        showTests={specialView === "tests"}
        onProfile={() => goSpecial("profile")}
        showProfile={specialView === "profile"}
        onDashboard={() => goSpecial("dashboard")}
        showDashboard={specialView === "dashboard"}
        onRetos={() => goSpecial("retos")}
        showRetos={specialView === "retos"}
        currentStreak={sidebarStats.currentStreak}
        earnedBadges={sidebarStats.earnedBadges}
        lessonsDone={lessonsDone}
        levelProgress={levelProgress}
      />

      <main style={{
        flex: 1, overflow: "auto", minHeight: "100vh",
        position: "relative", zIndex: 1,
      }}>
        {/* Mobile top bar */}
        <div style={{
          display: "none", padding: "12px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg2)", alignItems: "center", gap: 12,
          position: "sticky", top: 0, zIndex: 20,
          justifyContent: "space-between",
        }} className="mobile-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              style={{
                background: "none", border: "1px solid var(--border)",
                color: "var(--cyan)", cursor: "pointer", padding: "6px 10px", fontSize: 16,
              }}
            >☰</button>
            <span style={{
              fontFamily: "'Orbitron', monospace", fontSize: 12,
              letterSpacing: 3, color: "var(--text)",
            }}>PSYCHOMETRIKS</span>
          </div>
          <div style={{
            fontSize: 11, color: roleColor,
            fontFamily: "'Share Tech Mono', monospace",
            border: `1px solid ${roleColor}44`, padding: "3px 8px", borderRadius: 3,
          }}>
            {currentUser.role}
          </div>
        </div>

        {/* ── Botón de retroceso — aparece en todas las vistas excepto HomePage ── */}
        {(specialView !== null || currentModule !== null) && (
          <button
            onClick={goHome}
            style={{
              position: "fixed",
              top: 16,
              left: 260,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 10px",
              background: "rgba(6,10,15,0.92)",
              border: "1px solid #1a2535",
              color: "#2a4a5a",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.18em",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "color 0.15s, border-color 0.15s",
              lineHeight: 1,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "#00e5ff";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#00e5ff55";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "#2a4a5a";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#1a2535";
            }}
          >
            ← INICIO
          </button>
        )}

        {/* Page routing */}
        {specialView === "exam" ? (
          <ExamPage
            currentUser={currentUser}
            initialMode={examInitialMode}
            key={examInitialMode ?? "exam"}
          />
        ) : specialView === "tests" ? (
          <TestsPage
            currentUser={currentUser}
            onStartExam={handleStartExam}
          />
        ) : specialView === "profile" ? (
          <ProfilePage
            currentUser={currentUser}
            onGoExam={() => goSpecial("exam")}
            onGoRetos={() => goSpecial("retos")}
          />
        ) : specialView === "dashboard" ? (
          <DashboardPage
            currentUser={currentUser}
            onGoExam={() => goSpecial("exam")}
            onGoRetos={() => goSpecial("retos")}
          />
        ) : specialView === "retos" ? (
          <RetosPage
            currentUser={currentUser}
            onGoExam={() => goSpecial("exam")}
          />
        ) : currentModule === "mercados-live" ? (
          <MarketLivePanel currentUser={currentUser} />
        ) : currentModule ? (
          <ModulePage
            moduleId={currentModule}
            onBack={handleBack}
            onNext={(id) => { handleSelect(id); setLessonsDoneVersion(v => v + 1); }}
            onPrev={(id) => { handleSelect(id); setLessonsDoneVersion(v => v + 1); }}
            currentUser={currentUser}
          />
        ) : (
          <HomePage
          onSelect={handleSelect}
          currentUser={currentUser}
          onGoTests={() => goSpecial("tests")}
          onGoExam={() => goSpecial("exam", "GENERAL")}
        />
        )}
      </main>

      {showAdmin && currentUser.role === "ADMIN" && (
        <AdminPanel
          currentUser={currentUser}
          onClose={() => setShowAdmin(false)}
          onUserUpdated={(u) => setCurrentUser(u)}
        />
      )}

      {showChangePwd && (
        <ChangePasswordPage
          currentUser={currentUser}
          onClose={() => setShowChangePwd(false)}
          onUserUpdated={(u) => setCurrentUser(u)}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-topbar { display: flex !important; }
        }
        .level-header-btn:hover { background: rgba(255,255,255,0.04); }
        .module-card:hover { border-color: var(--cyan) !important; transform: translateY(-2px); }
      `}</style>
    </div>
  );
}
