import React, { useState } from "react";
import {
  Trophy,
  Star,
  CheckCircle2,
  PlayCircle,
  ChevronRight,
  ChevronLeft,
  Award,
  Flame,
} from "lucide-react";
import { useAcademy } from "@/lib/pms/academy-store";
import { COURSES, LEVELS, LEADERBOARD } from "@/data/academy";

export function AcademyView() {
  const { points, completedCourses, completeCourse, activeCourseId, setActiveCourseId } =
    useAcademy();

  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showQuizResults, setShowQuizResults] = useState(false);

  const currentLevel = LEVELS.find((l) => points >= l.minPoints) || LEVELS[LEVELS.length - 1];
  const nextLevel = [...LEVELS].reverse().find((l) => l.minPoints > points);
  const progressToNext = nextLevel
    ? ((points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100;

  const activeCourse = COURSES.find((c) => c.id === activeCourseId);

  // Derive full leaderboard including current user
  const fullLeaderboard = [
    ...LEADERBOARD,
    { id: "me", name: "You", points, role: "Reception Trainee" },
  ].sort((a, b) => b.points - a.points);

  const startCourse = (id: string) => {
    setActiveCourseId(id);
    setActiveModuleIndex(0);
    setQuizAnswers([]);
    setShowQuizResults(false);
  };

  const quitCourse = () => {
    setActiveCourseId(null);
  };

  const nextModule = () => {
    if (activeCourse && activeModuleIndex < activeCourse.content.length) {
      setActiveModuleIndex((prev) => prev + 1);
    }
  };

  const prevModule = () => {
    if (activeModuleIndex > 0) {
      setActiveModuleIndex((prev) => prev - 1);
    }
  };

  const answerQuestion = (qIndex: number, aIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[qIndex] = aIndex;
    setQuizAnswers(newAnswers);
  };

  const submitQuiz = () => {
    if (!activeCourse) return;

    // Check if passed
    let correctCount = 0;
    activeCourse.quiz.forEach((q, i) => {
      if (quizAnswers[i] === q.correctIndex) correctCount++;
    });

    setShowQuizResults(true);

    if (correctCount === activeCourse.quiz.length) {
      completeCourse(activeCourse.id, activeCourse.points);
    }
  };

  if (activeCourse) {
    const isQuizPhase = activeModuleIndex === activeCourse.content.length;

    return (
      <div className="h-full flex flex-col bg-background relative overflow-hidden">
        {/* Header */}
        <div className="h-14 hairline-b bg-card flex items-center px-6 shrink-0 z-10">
          <button
            onClick={quitCourse}
            className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Academy
          </button>
          <div className="ml-auto font-semibold">{activeCourse.title}</div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 relative z-10">
          <div className="max-w-2xl mx-auto">
            {!isQuizPhase ? (
              <div className="bg-card hairline rounded-xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                <div className="mb-8 flex items-center justify-between text-sm text-muted-foreground">
                  <span className="uppercase tracking-wider font-semibold text-primary">
                    Module {activeModuleIndex + 1} of {activeCourse.content.length}
                  </span>
                </div>
                {activeCourse.content[activeModuleIndex]}
              </div>
            ) : (
              <div className="bg-card hairline rounded-xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                <div className="mb-8 flex items-center justify-between text-sm text-muted-foreground">
                  <span className="uppercase tracking-wider font-semibold text-primary">
                    Final Quiz
                  </span>
                </div>

                {showQuizResults ? (
                  <div className="space-y-6 text-center">
                    {(() => {
                      let correctCount = 0;
                      activeCourse.quiz.forEach((q, i) => {
                        if (quizAnswers[i] === q.correctIndex) correctCount++;
                      });
                      const passed = correctCount === activeCourse.quiz.length;

                      return (
                        <>
                          <div
                            className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${passed ? "bg-green-500/20 text-green-500" : "bg-destructive/20 text-destructive"}`}
                          >
                            {passed ? (
                              <CheckCircle2 className="h-10 w-10" />
                            ) : (
                              <Flame className="h-10 w-10" />
                            )}
                          </div>
                          <h2 className="text-2xl font-bold">
                            {passed ? "Course Completed!" : "Keep trying!"}
                          </h2>
                          <p className="text-muted-foreground">
                            You got {correctCount} out of {activeCourse.quiz.length} correct.
                          </p>
                          {passed ? (
                            <div className="p-4 bg-primary/10 rounded-lg text-primary font-medium mt-6">
                              +{activeCourse.points} Points Earned
                            </div>
                          ) : null}
                          <div className="mt-8">
                            <button
                              onClick={quitCourse}
                              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                            >
                              Return to Dashboard
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {activeCourse.quiz.map((q, qIndex) => (
                      <div key={qIndex} className="space-y-4">
                        <p className="font-medium text-lg">
                          {qIndex + 1}. {q.question}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt, aIndex) => (
                            <button
                              key={aIndex}
                              onClick={() => answerQuestion(qIndex, aIndex)}
                              className={`w-full text-left p-4 rounded-lg hairline transition-all ${
                                quizAnswers[qIndex] === aIndex
                                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                                  : "bg-background hover:bg-secondary border-border"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="pt-6">
                      <button
                        onClick={submitQuiz}
                        disabled={
                          quizAnswers.length !== activeCourse.quiz.length ||
                          quizAnswers.includes(undefined as unknown as number)
                        }
                        className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Submit Answers
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        {!showQuizResults && (
          <div className="h-20 hairline-t bg-card flex items-center justify-between px-8 shrink-0 z-10">
            <button
              onClick={prevModule}
              disabled={activeModuleIndex === 0}
              className="px-4 py-2 font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-secondary rounded-md transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>

            <div className="flex gap-1.5">
              {Array.from({ length: activeCourse.content.length + 1 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full transition-colors ${i === activeModuleIndex ? "bg-primary" : i < activeModuleIndex ? "bg-primary/40" : "bg-secondary"}`}
                />
              ))}
            </div>

            {!isQuizPhase && (
              <button
                onClick={nextModule}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {isQuizPhase && (
              <div className="w-[85px]"></div> // placeholder to balance footer
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-muted/30 overflow-auto">
      {/* Header Banner */}
      <div className="relative bg-primary text-primary-foreground overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="p-8 md:p-12 relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Lichtburg Academy
            </h1>
            <p className="text-primary-foreground/80 max-w-xl text-lg">
              Master the art of hospitality. Complete courses, earn points, and climb the
              leaderboard.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8">
        {/* Main Content Area */}
        <div className="flex-1 space-y-8">
          {/* Progress Card */}
          <div className="bg-card hairline rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center">
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-muted/30"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * progressToNext) / 100}
                  className="text-primary transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-xl font-bold">{points}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  PTS
                </span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                Current Status
              </h2>
              <div
                className={`text-2xl font-bold ${currentLevel.color} flex items-center justify-center md:justify-start gap-2 mb-2`}
              >
                <Award className="h-6 w-6" />
                {currentLevel.name}
              </div>
              {nextLevel ? (
                <p className="text-sm text-muted-foreground">
                  {nextLevel.minPoints - points} more points to reach{" "}
                  <strong className="text-foreground">{nextLevel.name}</strong>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You have reached the highest level. Outstanding!
                </p>
              )}
            </div>
          </div>

          {/* Course List */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold tracking-tight">Available Courses</h2>
              <span className="text-sm text-muted-foreground">
                {completedCourses.length} of {COURSES.length} completed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COURSES.map((course) => {
                const isCompleted = completedCourses.includes(course.id);
                return (
                  <div
                    key={course.id}
                    className={`group relative bg-card hairline rounded-xl overflow-hidden transition-all hover:shadow-md hover:border-primary/50 ${isCompleted ? "opacity-80" : ""}`}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isCompleted ? "bg-green-500/10 text-green-600" : "bg-primary/10 text-primary"}`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Star className="h-3.5 w-3.5" />
                          )}
                          {course.points} Points
                        </div>
                        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                          <PlayCircle className="h-3.5 w-3.5" /> {course.duration}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
                        {course.description}
                      </p>

                      <button
                        onClick={() => startCourse(course.id)}
                        className="w-full py-2.5 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-2"
                      >
                        {isCompleted ? "Retake Course" : "Start Course"}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar / Leaderboard */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-card hairline rounded-2xl p-6 shadow-sm sticky top-6">
            <div className="flex items-center gap-3 mb-6 pb-4 hairline-b">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h2 className="font-semibold text-lg tracking-tight">Leaderboard</h2>
            </div>

            <div className="space-y-4">
              {fullLeaderboard.map((user, index) => {
                const isMe = user.id === "me";
                const rankColor =
                  index === 0
                    ? "text-yellow-500"
                    : index === 1
                      ? "text-gray-400"
                      : index === 2
                        ? "text-amber-600"
                        : "text-muted-foreground";

                return (
                  <div
                    key={user.id}
                    className={`flex items-center gap-4 p-2 rounded-lg transition-colors ${isMe ? "bg-primary/5 border border-primary/20" : "hover:bg-secondary/50"}`}
                  >
                    <div className={`w-6 text-center font-bold text-sm ${rankColor}`}>
                      #{index + 1}
                    </div>
                    <div className="h-10 w-10 rounded-full bg-secondary hairline flex items-center justify-center text-sm font-semibold shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-sm font-medium truncate ${isMe ? "text-primary" : "text-foreground"}`}
                        >
                          {user.name}
                        </p>
                        <span className="text-xs font-bold tabular-nums">{user.points}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{user.role}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 hairline-t">
              <p className="text-xs text-center text-muted-foreground">
                Keep completing courses to climb the ranks!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
