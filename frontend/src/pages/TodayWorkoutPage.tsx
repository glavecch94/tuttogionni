import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, Dumbbell, Trophy, ArrowLeft, Timer, Settings, SkipForward } from 'lucide-react';
import { workoutPlanApi } from '../services/api';
import type { CardioType, Difficulty, WorkoutDaySummary } from '../types';
import { CARDIO_TYPE_LABELS } from '../types';

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
    setTimeout(() => ctx.close(), 600);
  } catch {
    // Audio not available
  }
}

const REST_PRESETS = [
  { label: '1:00', value: 60 },
  { label: '1:30', value: 90 },
  { label: '2:00', value: 120 },
  { label: '3:00', value: 180 },
];

export default function TodayWorkoutPage() {
  // completedSets[exerciseIndex] = number of sets completed so far
  const [completedSets, setCompletedSets] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<number, Difficulty>>({});
  const [editingFeedback, setEditingFeedback] = useState<Record<number, boolean>>({});
  const [logId, setLogId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Timer principale
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showNextWorkoutPicker, setShowNextWorkoutPicker] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [workoutStartTime] = useState<number>(Date.now());
  const [workoutElapsed, setWorkoutElapsed] = useState(0);
  const [workoutStarted, setWorkoutStarted] = useState(false);

  // Rest timer
  const [restDuration, setRestDuration] = useState(120);
  const [restTimeLeft, setRestTimeLeft] = useState<number | null>(null);
  const [showRestConfig, setShowRestConfig] = useState(true); // shown at start
  const restTotalRef = useRef(120);

  const { data: todayWorkout, isLoading } = useQuery({
    queryKey: ['todayWorkout'],
    queryFn: workoutPlanApi.getTodayWorkout,
  });

  const startMutation = useMutation({
    mutationFn: workoutPlanApi.startTodayWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayWorkout'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ logId, notes }: { logId: number; notes?: string }) =>
      workoutPlanApi.completeWorkout(logId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayWorkout'] });
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowCompleteModal(false);
      navigate('/');
    },
  });

  const skipWorkoutMutation = useMutation({
    mutationFn: workoutPlanApi.skipTodayWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayWorkout'] });
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowSkipConfirm(false);
      navigate('/');
    },
  });

  const nextWorkoutMutation = useMutation({
    mutationFn: (dayIndex: number) => workoutPlanApi.nextWorkoutToday(dayIndex),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['todayWorkout'] });
      setCompletedSets({});
      setFeedbacks({});
      setEditingFeedback({});
      setLogId(data.id);
      setShowNextWorkoutPicker(false);
      setSelectedDayIndex(null);
    },
    onError: (err) => {
      console.error('nextWorkout error:', err);
    },
  });

  // Timer principale – aggiorna ogni secondo
  useEffect(() => {
    if (showCompleteModal) return;
    const id = setInterval(() => {
      setWorkoutElapsed(Math.floor((Date.now() - workoutStartTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [workoutStartTime, showCompleteModal]);

  // Rest timer countdown
  useEffect(() => {
    if (restTimeLeft === null || restTimeLeft <= 0) return;
    const id = setInterval(() => {
      setRestTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          playBeep();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [restTimeLeft !== null && restTimeLeft > 0]);

  const skipRest = useCallback(() => {
    setRestTimeLeft(null);
  }, []);

  // Keep logId in sync with todayLogId from query
  useEffect(() => {
    if (todayWorkout?.todayLogId && !logId) {
      setLogId(todayWorkout.todayLogId);
    }
  }, [todayWorkout?.todayLogId, logId]);

  const ensureLogStarted = useCallback(async () => {
    if (logId) return logId;
    if (todayWorkout?.todayLogId) {
      setLogId(todayWorkout.todayLogId);
      return todayWorkout.todayLogId;
    }
    const log = await workoutPlanApi.startTodayWorkout();
    setLogId(log.id);
    queryClient.invalidateQueries({ queryKey: ['todayWorkout'] });
    return log.id;
  }, [logId, todayWorkout?.todayLogId, queryClient]);

  const isExerciseCompleted = (index: number) => {
    if (!todayWorkout) return false;
    const exercise = todayWorkout.exercises[index];
    if (exercise.muscleGroup === 'CARDIO' || exercise.cardioType) return completedSets[index] === 1;
    return (completedSets[index] || 0) >= (exercise.sets ?? 0);
  };

  const completedExerciseCount = todayWorkout
    ? todayWorkout.exercises.filter((_, i) => isExerciseCompleted(i)).length
    : 0;

  const totalSetsCount = todayWorkout
    ? todayWorkout.exercises.reduce((sum, ex) => sum + (ex.muscleGroup === 'CARDIO' ? 1 : (ex.sets ?? 0)), 0)
    : 0;

  const completedSetsCount = Object.values(completedSets).reduce((sum, v) => sum + v, 0);

  // First exercise not yet fully completed — only this one is interactable
  const currentExerciseIndex = todayWorkout
    ? todayWorkout.exercises.findIndex((_, i) => !isExerciseCompleted(i))
    : 0;

  const completeNextSet = async (index: number) => {
    if (!todayWorkout) return;
    const exercise = todayWorkout.exercises[index];
    const current = completedSets[index] || 0;

    const maxSets = (exercise.muscleGroup === 'CARDIO' || exercise.cardioType) ? 1 : (exercise.sets ?? 0);
    if (current >= maxSets) return; // already all done

    // Auto-start workout on first toggle if autoProgression is enabled
    if (todayWorkout.autoProgression && completedSetsCount === 0) {
      await ensureLogStarted();
    }

    const newCount = current + 1;
    setCompletedSets((prev) => ({ ...prev, [index]: newCount }));

    // Start rest timer unless this was the last set of the last exercise
    const isLastSetOfExercise = newCount >= maxSets;
    const isLastExercise = completedExerciseCount === todayWorkout.exercises.length - 1 && isLastSetOfExercise;

    if (!isLastExercise) {
      const duration = exercise.restSeconds || restDuration;
      restTotalRef.current = duration;
      setRestTimeLeft(duration);
    }
  };

  const undoSet = (index: number) => {
    const current = completedSets[index] || 0;
    if (current <= 0) return;

    if (current === (todayWorkout?.exercises[index]?.sets || 0)) {
      // Was fully completed, remove feedback
      setFeedbacks((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }

    setCompletedSets((prev) => ({ ...prev, [index]: current - 1 }));
  };

  const handleFeedback = async (index: number, difficulty: Difficulty) => {
    if (!todayWorkout) return;
    const currentLogId = await ensureLogStarted();
    const exercise = todayWorkout.exercises[index];

    try {
      await workoutPlanApi.submitFeedback({
        workoutLogId: currentLogId,
        exerciseName: exercise.name,
        workoutPlanId: todayWorkout.workoutPlanId,
        difficulty,
        weightUsed: exercise.weight,
        setsCompleted: exercise.sets,
        repsCompleted: exercise.reps,
      });
      setFeedbacks((prev) => ({ ...prev, [index]: difficulty }));
      setEditingFeedback((prev) => ({ ...prev, [index]: false }));
      queryClient.invalidateQueries({ queryKey: ['todayWorkout'] });
    } catch {
      // error
    }
  };

  const allExercisesCompleted = todayWorkout
    ? todayWorkout.exercises.every((_, i) => isExerciseCompleted(i))
    : false;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!todayWorkout) {
    return (
      <div className="pb-20 lg:pb-0">
        <div className="text-center py-12">
          <Dumbbell size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nessun allenamento programmato</h2>
          <p className="text-gray-500 mb-4">
            Attiva un piano di allenamento per vedere l'allenamento di oggi
          </p>
          <button
            onClick={() => navigate('/plans')}
            className="btn btn-primary"
          >
            Vai ai Piani
          </button>
        </div>
      </div>
    );
  }

  if (todayWorkout.alreadyCompletedToday) {
    const availableDays = todayWorkout.availableWorkoutDays ?? [];
    return (
      <div className="pb-20 lg:pb-0">
        <div className="text-center py-12">
          <Trophy size={48} className="mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Allenamento completato!</h2>
          <p className="text-gray-500 mb-4">
            Hai già completato l'allenamento di oggi. Ottimo lavoro!
          </p>
          <div className="flex flex-col gap-3 items-center">
            <button
              onClick={() => {
                const nextIdx = availableDays.length > 0
                  ? availableDays[(availableDays.findIndex(d => d.name === todayWorkout.workoutDayName) + 1) % availableDays.length].dayIndex
                  : 0;
                setSelectedDayIndex(nextIdx);
                setShowNextWorkoutPicker(true);
              }}
              className="btn btn-primary flex items-center gap-2"
            >
              <Dumbbell size={18} />
              Fai un altro allenamento
            </button>
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              Torna alla Dashboard
            </button>
          </div>
        </div>

        {/* Day picker modal */}
        {showNextWorkoutPicker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6">
              <div className="text-center mb-5">
                <Dumbbell size={32} className="mx-auto text-primary-500 mb-2" />
                <h2 className="text-lg font-bold">Scegli l'allenamento</h2>
                <p className="text-sm text-gray-500 mt-1">Quale giorno vuoi fare adesso?</p>
              </div>

              <div className="space-y-2 mb-6">
                {availableDays.map((day: WorkoutDaySummary) => (
                  <button
                    key={day.dayIndex}
                    onClick={() => setSelectedDayIndex(day.dayIndex)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      selectedDayIndex === day.dayIndex
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">Giorno {day.dayNumber}</span>
                    <span className="text-gray-500 ml-2">— {day.name}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowNextWorkoutPicker(false)}
                  className="btn btn-secondary flex-1"
                >
                  Annulla
                </button>
                <button
                  onClick={() => selectedDayIndex !== null && nextWorkoutMutation.mutate(selectedDayIndex)}
                  disabled={selectedDayIndex === null || nextWorkoutMutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  {nextWorkoutMutation.isPending ? 'Caricamento...' : 'Inizia'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const restProgress = restTimeLeft !== null ? restTimeLeft / restTotalRef.current : 0;

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 truncate">{todayWorkout.workoutPlanName}</p>
          <h1 className="text-lg sm:text-2xl font-bold truncate">
            Giorno {todayWorkout.workoutDayNumber}: {todayWorkout.workoutDayName}
          </h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 bg-primary-50 text-primary-700 px-2 sm:px-3 py-1.5 rounded-full font-mono text-xs sm:text-sm font-medium">
            <Timer size={14} />
            {formatTime(workoutElapsed)}
          </div>
          <button
            onClick={() => setShowRestConfig(true)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            title="Configura recupero"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {todayWorkout.workoutDayDescription && (
        <p className="text-gray-600 mb-6">{todayWorkout.workoutDayDescription}</p>
      )}

      {/* Progress */}
      <div className="bg-primary-50 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary-700">Progresso</span>
          <span className="text-sm text-primary-600">
            {completedSetsCount}/{totalSetsCount} serie
          </span>
        </div>
        <div className="w-full bg-primary-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${totalSetsCount > 0 ? (completedSetsCount / totalSetsCount) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-3 mb-6">
        {todayWorkout.exercises.map((exercise, index) => {
          const done = completedSets[index] || 0;
          const isCardio = exercise.muscleGroup === 'CARDIO' || !!exercise.cardioType;
          const total = isCardio ? 1 : (exercise.sets ?? 0);
          const fullyDone = done >= total;
          const isCurrent = index === currentExerciseIndex;
          const isFuture = currentExerciseIndex !== -1 && index > currentExerciseIndex;
          return (
          <div key={exercise.id || index}>
            <div
              className={`card transition-all ${
                fullyDone
                  ? 'bg-green-50 border-green-200'
                  : isFuture
                    ? 'opacity-50'
                    : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {fullyDone ? (
                    <CheckCircle className="text-green-500" size={24} />
                  ) : (
                    <Circle className="text-gray-300" size={24} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3
                      className={`font-medium truncate ${
                        fullyDone ? 'line-through text-gray-500' : ''
                      }`}
                    >
                      {exercise.name}
                    </h3>
                    {(() => {
                      const history = todayWorkout.exerciseFeedbackHistory?.[exercise.name];
                      if (!history?.length) return null;
                      return (
                        <div className="flex gap-0.5 flex-shrink-0">
                          {history.map((d, i) => (
                            <span
                              key={i}
                              className={`inline-block w-2 h-2 rounded-full ${
                                d === 'LIGHT' ? 'bg-green-400' :
                                d === 'NEUTRAL' ? 'bg-yellow-400' :
                                'bg-red-400'
                              }`}
                              title={d === 'LIGHT' ? 'Leggero' : d === 'NEUTRAL' ? 'Stimolante' : 'Pesante'}
                            />
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {isCardio ? (
                      <>
                        {exercise.cardioType ? CARDIO_TYPE_LABELS[exercise.cardioType as CardioType] : 'Cardio'}
                        {exercise.durationMinutes && ` • ${exercise.durationMinutes} min`}
                      </>
                    ) : (
                      <>
                        {exercise.sets} serie x {exercise.reps} ripetizioni
                        {exercise.weight && ` • ${exercise.weight}kg`}
                      </>
                    )}
                  </p>
                  {exercise.notes && (
                    <p className="text-xs text-gray-400 mt-1 truncate">{exercise.notes}</p>
                  )}
                </div>
              </div>

              {/* Set tracker */}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-3 ml-9 flex-wrap">
                {isCardio ? (
                  <button
                    disabled={isFuture || fullyDone}
                    onClick={(e) => { e.stopPropagation(); if (!isFuture && !fullyDone) completeNextSet(index); }}
                    className={`px-4 h-8 rounded-full text-xs font-bold transition-all ${
                      fullyDone
                        ? 'bg-green-500 text-white'
                        : isFuture
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-orange-100 text-orange-700 ring-2 ring-orange-400 hover:bg-orange-200'
                    }`}
                  >
                    {fullyDone ? 'Completato' : 'Segna completato'}
                  </button>
                ) : Array.from({ length: total }, (_, s) => {
                  const isNextSet = s === done;
                  const isSetDisabled = isFuture || (isNextSet && restTimeLeft !== null);
                  return (
                  <button
                    key={s}
                    disabled={isSetDisabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isFuture) return;
                      if (s < done) {
                        if (isCurrent) undoSet(index);
                      } else if (isNextSet) {
                        completeNextSet(index);
                      }
                    }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold transition-all ${
                      s < done
                        ? 'bg-green-500 text-white'
                        : isNextSet && !isFuture
                          ? isSetDisabled
                            ? 'bg-primary-100 text-primary-300 ring-2 ring-primary-200 cursor-not-allowed'
                            : 'bg-primary-100 text-primary-700 ring-2 ring-primary-400 hover:bg-primary-200'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                    title={s < done ? 'Annulla serie' : isNextSet && !isFuture ? (isSetDisabled ? 'Attendi fine recupero' : 'Completa serie') : ''}
                  >
                    {s + 1}
                  </button>
                  );
                })}
                {!isCardio && (
                  <span className="text-xs text-gray-400 ml-1">
                    {done}/{total}
                  </span>
                )}
              </div>

              {/* Feedback buttons - shown after first set */}
              {done > 0 && (
                <div className="mt-3 ml-9">
                  {feedbacks[index] && !editingFeedback[index] ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingFeedback((prev) => ({ ...prev, [index]: true })); }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-opacity hover:opacity-70 ${
                        feedbacks[index] === 'LIGHT' ? 'bg-green-50 border-green-200 text-green-700' :
                        feedbacks[index] === 'NEUTRAL' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                        'bg-red-50 border-red-200 text-red-700'
                      }`}
                    >
                      <span>{feedbacks[index] === 'LIGHT' ? '🟢' : feedbacks[index] === 'NEUTRAL' ? '🟡' : '🔴'}</span>
                      {feedbacks[index] === 'LIGHT' ? 'Leggero' : feedbacks[index] === 'NEUTRAL' ? 'Stimolante' : 'Pesante'}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleFeedback(index, 'HEAVY'); }}
                        className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                      >
                        Pesante
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleFeedback(index, 'NEUTRAL'); }}
                        className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors"
                      >
                        Stimolante
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleFeedback(index, 'LIGHT'); }}
                        className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                      >
                        Leggero
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {/* Rest Timer Banner */}
      {restTimeLeft !== null && (
        <div className="mb-4 bg-primary-50 border border-primary-200 rounded-xl p-4 animate-in fade-in">
          <div className="flex items-center gap-4">
            {/* Circular progress */}
            <div className="relative flex-shrink-0 w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle
                  cx="28" cy="28" r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-primary-200"
                />
                <circle
                  cx="28" cy="28" r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-primary-500 transition-all duration-1000"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 24}
                  strokeDashoffset={2 * Math.PI * 24 * (1 - restProgress)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Timer size={18} className="text-primary-600" />
              </div>
            </div>

            <div className="flex-1">
              <p className="text-sm font-medium text-primary-700">Recupero</p>
              <p className="text-2xl font-bold font-mono text-primary-800">
                {formatTime(restTimeLeft)}
              </p>
            </div>

            <button
              onClick={skipRest}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg text-sm font-medium transition-colors"
            >
              <SkipForward size={16} />
              Salta
            </button>
          </div>
        </div>
      )}

      {/* Complete Button */}
      <button
        onClick={() => {
          if (!logId && !todayWorkout.todayLogId) {
            startMutation.mutate();
          }
          setShowCompleteModal(true);
        }}
        disabled={!allExercisesCompleted}
        className={`w-full py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all ${
          allExercisesCompleted
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {allExercisesCompleted ? 'Completa Allenamento' : 'Completa tutti gli esercizi'}
      </button>

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm sm:max-w-md p-6">
            <div className="text-center mb-6">
              <Trophy size={48} className="mx-auto text-yellow-500 mb-2" />
              <h2 className="text-lg sm:text-xl font-bold">Ottimo lavoro!</h2>
              <p className="text-gray-500">
                Allenamento completato in {formatTime(workoutElapsed)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note (opzionale)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input"
                rows={3}
                placeholder="Come ti sei sentito? Qualche nota?"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="btn btn-secondary flex-1"
              >
                Annulla
              </button>
              <button
                onClick={async () => {
                  const resolvedLogId = logId ?? todayWorkout.todayLogId;
                  if (!resolvedLogId) {
                    const log = await workoutPlanApi.startTodayWorkout();
                    completeMutation.mutate({ logId: log.id, notes });
                  } else {
                    completeMutation.mutate({ logId: resolvedLogId, notes });
                  }
                }}
                disabled={completeMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {completeMutation.isPending ? 'Salvataggio...' : 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rest Config Modal */}
      {showRestConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="text-center mb-4">
              <Timer size={32} className="mx-auto text-primary-500 mb-2" />
              <h2 className="text-lg font-bold">
                {workoutStarted ? 'Tempo di recupero' : 'Configura recupero tra le serie'}
              </h2>
              {!workoutStarted && (
                <p className="text-sm text-gray-500 mt-1">
                  Il timer partirà automaticamente dopo ogni serie
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2 text-center">
                Durata: <span className="font-semibold">{formatTime(restDuration)}</span>
              </label>
              <input
                type="range"
                min={30}
                max={300}
                step={15}
                value={restDuration}
                onChange={(e) => setRestDuration(Number(e.target.value))}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0:30</span>
                <span>5:00</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              {REST_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setRestDuration(p.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    restDuration === p.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {workoutStarted ? (
              <button
                onClick={() => setShowRestConfig(false)}
                className="btn btn-primary w-full"
              >
                Fatto
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSkipConfirm(true)}
                    className="btn btn-secondary flex-1 flex items-center justify-center gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    <SkipForward size={18} />
                    Salta
                  </button>
                  <button
                    onClick={() => {
                      setShowRestConfig(false);
                      setWorkoutStarted(true);
                    }}
                    className="btn btn-primary flex-[2]"
                  >
                    Inizia allenamento
                  </button>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="btn btn-secondary w-full"
                >
                  Annulla
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Skip Workout Confirm Modal */}
      {showSkipConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="text-center mb-4">
              <SkipForward size={32} className="mx-auto text-orange-500 mb-2" />
              <h2 className="text-lg font-bold">Salta allenamento</h2>
              <p className="text-sm text-gray-500 mt-2">
                Il ciclo avanzerà al giorno successivo del piano.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="btn btn-secondary flex-1"
              >
                Annulla
              </button>
              <button
                onClick={() => skipWorkoutMutation.mutate()}
                disabled={skipWorkoutMutation.isPending}
                className="btn btn-primary flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {skipWorkoutMutation.isPending ? 'Salvataggio...' : 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
