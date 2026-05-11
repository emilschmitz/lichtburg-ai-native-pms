import { createContext, useContext, useState, useMemo, type ReactNode } from "react";

interface AcademyCtx {
  points: number;
  completedCourses: string[];
  completeCourse: (id: string, earnedPoints: number) => void;
  activeCourseId: string | null;
  setActiveCourseId: (id: string | null) => void;
}

const AcademyContext = createContext<AcademyCtx | null>(null);

export function AcademyProvider({ children }: { children: ReactNode }) {
  const [points, setPoints] = useState(0);
  const [completedCourses, setCompletedCourses] = useState<string[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);

  const completeCourse = (id: string, earnedPoints: number) => {
    if (!completedCourses.includes(id)) {
      setCompletedCourses((prev) => [...prev, id]);
      setPoints((prev) => prev + earnedPoints);
    }
  };

  const value = useMemo(
    () => ({ points, completedCourses, completeCourse, activeCourseId, setActiveCourseId }),
    [points, completedCourses, activeCourseId],
  );

  return <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>;
}

export function useAcademy() {
  const ctx = useContext(AcademyContext);
  if (!ctx) throw new Error("useAcademy must be used within AcademyProvider");
  return ctx;
}
