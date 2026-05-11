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
  Landmark,
  Shield,
  Zap,
  ZapOff,
  Layout,
  Gamepad2,
  Sparkles,
  User,
  Gamepad,
} from "lucide-react";
import { useAcademy } from "@/lib/pms/academy-store";
import { COURSES, LEVELS, LEADERBOARD } from "@/data/academy";

type GamificationLevel = "none" | "high";

export function AcademyView() {
  const { points, completedCourses, completeCourse, activeCourseId, setActiveCourseId } =
    useAcademy();

  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [gamification, setGamification] = useState<GamificationLevel>("high");

  const currentLevel = LEVELS.find((l) => points >= l.minPoints) || LEVELS[LEVELS.length - 1];
  const nextLevel = [...LEVELS].reverse().find((l) => l.minPoints > points);
  const progressToNext = nextLevel
    ? ((points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100;

  const activeCourse = COURSES.find((c) => c.id === activeCourseId);

  // Derive leaderboard including current user
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
                  <div className="space-y-6 text-center py-12 relative">
                    {(() => {
                      let correctCount = 0;
                      activeCourse.quiz.forEach((q, i) => {
                        if (quizAnswers[i] === q.correctIndex) correctCount++;
                      });
                      const passed = correctCount === activeCourse.quiz.length;

                      return (
                        <>
                          <div
                            className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 relative z-10 transition-all duration-700 hairline ${
                              passed 
                                ? "bg-card text-[var(--occ-arrival)] scale-110 shadow-sm" 
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {passed ? (
                              <CheckCircle2 className="h-12 w-12" />
                            ) : (
                              <Flame className="h-10 w-10" />
                            )}
                          </div>
                          
                          <div className="relative z-10 space-y-4">
                            <div>
                              <h2 className={`text-4xl font-black tracking-tight transition-all duration-700 ${passed ? "text-foreground" : ""}`}>
                                {passed ? "PERFECT SCORE!" : "Keep trying!"}
                              </h2>
                              <p className="text-muted-foreground text-lg">
                                You mastered this course with {correctCount}/{activeCourse.quiz.length} correct.
                              </p>
                            </div>

                            {passed && (
                              <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-1000 fill-mode-both">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                                  <Star className="w-3.5 h-3.5 text-primary" />
                                  <span className="text-sm font-bold text-primary tabular-nums">+{activeCourse.points} Points</span>
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider ml-1">Awarded</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-12 relative z-10">
                            <button
                              onClick={quitCourse}
                              className={`px-10 py-4 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 ${
                                passed 
                                  ? "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20" 
                                  : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                              }`}
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
    <div className={`h-full flex flex-col overflow-auto transition-colors duration-500 ${gamification === 'none' ? 'bg-background' : 'bg-muted/30'}`}>
      {/* Header Banner */}
      <div className={`relative overflow-hidden shrink-0 transition-all duration-500 ${
        gamification === 'none' 
          ? 'bg-card border-b' 
          : 'bg-primary shadow-lg ring-1 ring-primary/20'
      }`}>
        {gamification === 'high' && (
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse"></div>
        )}
        
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 py-10 md:py-16 relative z-10">
          <div className="flex items-center gap-6 md:gap-8">
            <div className={`transition-all duration-500 ${gamification === 'none' ? 'text-primary' : 'text-primary-foreground'}`}>
              <Landmark className={`transition-all duration-500 ${
                gamification === 'none' 
                  ? 'w-12 h-12 opacity-100' 
                  : 'w-20 h-20 md:w-24 md:h-24 opacity-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className={`text-3xl md:text-5xl font-bold tracking-tight transition-colors duration-500 ${
                  gamification === 'none' ? 'text-foreground' : 'text-primary-foreground'
                }`}>
                  Lichtburg Academy
                </h1>
              </div>
              <p className={`max-w-xl text-lg md:text-xl transition-colors duration-500 ${
                gamification === 'none' ? 'text-muted-foreground' : 'text-primary-foreground/80'
              }`}>
                {gamification === 'none' ? 'Professional Training Portal' : 'Master the art of hospitality.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8">
        {/* Main Content Area */}
        <div className="flex-1 space-y-8">
          {/* Progress Card (Only for High) */}
          {gamification === 'high' && (
            <div className="bg-secondary/40 hairline rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center ring-2 ring-primary/5 bg-gradient-to-br from-secondary/50 to-primary/5 transition-all">
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
          )}

          {gamification === 'none' && (
             <div className="bg-card hairline rounded-xl p-6 flex items-center justify-between">
                <div>
                   <h2 className="text-lg font-bold">Your Progress</h2>
                   <p className="text-sm text-muted-foreground">{completedCourses.length} of {COURSES.length} courses completed</p>
                </div>
                <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-primary" 
                    style={{ width: `${(completedCourses.length / COURSES.length) * 100}%` }}
                   />
                </div>
             </div>
          )}

          {/* Course List */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold tracking-tight">
                {gamification === 'none' ? 'Curriculum' : 'Available Courses'}
              </h2>
              {gamification !== 'none' && (
                <span className="text-sm text-muted-foreground">
                  {completedCourses.length} of {COURSES.length} completed
                </span>
              )}
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${gamification === 'none' ? 'md:grid-cols-1' : ''}`}>
              {COURSES.map((course) => {
                const isCompleted = completedCourses.includes(course.id);
                return (
                    <div
                    key={course.id}
                    className={`group relative hairline rounded-xl overflow-hidden transition-all hover:shadow-md ${
                      gamification === 'none' ? 'bg-card flex items-center p-4 gap-6' : 'bg-secondary/20 p-6'
                    } ${isCompleted && gamification === 'none' ? "opacity-80" : ""} ${
                      gamification === 'high' ? 'hover:bg-secondary/30 hover:scale-[1.02] hover:ring-2 hover:ring-primary/20' : ''
                    }`}
                  >
                    {gamification === 'none' && (
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-primary/5 text-primary'}`}>
                        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      {gamification === 'high' && (
                        <div className="flex justify-between items-start mb-4">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isCompleted 
                                ? "bg-green-500/10 text-green-600" 
                                : "bg-primary text-primary-foreground shadow-sm"
                            }`}
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
                      )}
                      
                      <div className="flex items-center justify-between">
                         <h3 className={`font-bold group-hover:text-primary transition-colors ${gamification === 'none' ? 'text-lg' : 'text-lg mb-2'}`}>
                          {course.title}
                        </h3>
                        {gamification === 'none' && !isCompleted && (
                           <span className="text-xs text-muted-foreground">{course.duration}</span>
                        )}
                      </div>
                      
                      {gamification === 'high' && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
                          {course.description}
                        </p>
                      )}

                      <button
                        onClick={() => startCourse(course.id)}
                        className={`transition-colors flex items-center justify-center gap-2 ${
                          gamification === 'none'
                            ? 'ml-auto px-4 py-2 rounded-md bg-primary/5 text-primary text-sm font-semibold hover:bg-primary hover:text-primary-foreground'
                            : 'w-full py-2.5 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-primary hover:text-primary-foreground'
                        }`}
                      >
                        {isCompleted ? "Retake" : "Start"}
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
          {gamification === 'high' ? (
            <div className="bg-secondary/30 hairline rounded-2xl p-6 shadow-sm sticky top-6 ring-2 ring-primary/5">
              <div className="flex items-center gap-3 mb-6 pb-4 hairline-b">
                <Trophy className="h-5 w-5 text-yellow-500 animate-bounce" />
                <h2 className="font-semibold text-lg tracking-tight">
                  Leaderboard
                </h2>
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
                      className={`flex items-center gap-4 p-2 rounded-lg transition-colors ${
                        isMe 
                          ? "bg-primary text-primary-foreground shadow-md ring-1 ring-primary/20" 
                          : "hover:bg-secondary/50"
                      }`}
                    >
                      <div className={`w-6 text-center font-bold text-sm ${isMe ? 'text-primary-foreground' : rankColor}`}>
                        #{index + 1}
                      </div>
                      <div className={`h-10 w-10 rounded-full hairline flex items-center justify-center text-sm font-semibold shrink-0 ${
                        isMe ? 'bg-primary-foreground text-primary' : 'bg-secondary'
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p
                            className={`text-sm font-medium truncate ${
                              isMe ? "text-primary-foreground" : "text-foreground"
                            }`}
                          >
                            {user.name}
                          </p>
                          <span className={`text-xs font-bold tabular-nums ${isMe ? 'text-primary-foreground' : ''}`}>
                            {user.points}
                          </span>
                        </div>
                        <p className={`text-[11px] truncate ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {user.role}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 hairline-t">
                <p className="text-xs text-center text-muted-foreground">
                  Complete courses and quizzes to climb the leaderboard
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-card hairline rounded-xl p-6 sticky top-6">
               <h2 className="font-semibold text-lg mb-4">Training Resources</h2>
               <div className="space-y-3">
                  <div className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                     <p className="text-sm font-medium">Standard Operating Procedures</p>
                     <p className="text-xs text-muted-foreground">PDF Document • 4.2 MB</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                     <p className="text-sm font-medium">Internal Communication Policy</p>
                     <p className="text-xs text-muted-foreground">Last updated 2 days ago</p>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Gamification Toggle */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 p-1.5 bg-card border shadow-xl rounded-full hairline">
        <button
          onClick={() => setGamification("none")}
          className={`p-2 rounded-full transition-all ${
            gamification === "none" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
          }`}
          title="Professional Mode"
        >
          <User className="w-5 h-5" />
        </button>
        <button
          onClick={() => setGamification("high")}
          className={`p-2 rounded-full transition-all ${
            gamification === "high" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary"
          }`}
          title="Gamified Mode"
        >
          <Gamepad className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
