import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, Dumbbell, Trophy, ArrowLeft, Timer, Settings, SkipForward } from 'lucide-react';
import { workoutPlanApi } from '../services/api';
import type { Difficulty } from '../types';

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
  const [logId, setLogId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Timer principale
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
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
    return (completedSets[index] || 0) >= exercise.sets;
  };

  const completedExerciseCount = todayWorkout
    ? todayWorkout.exercises.filter((_, i) => isExerciseCompleted(i)).length
    : 0;

  const totalSetsCount = todayWorkout
    ? todayWorkout.exercises.reduce((sum, ex) => sum + ex.sets, 0)
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

    if (current >= exercise.sets) return; // already all done

    // Auto-start workout on first toggle if autoProgression is enabled
    if (todayWorkout.autoProgression && completedSetsCount === 0) {
      await ensureLogStarted();
    }

    const newCount = current + 1;
    setCompletedSets((prev) => ({ ...prev, [index]: newCount }));

    // Start rest timer unless this was the last set of the last exercise
    const isLastSetOfExercise = newCount >= exercise.sets;
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
    } catch {
      // Feedback already submitted or error
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
    return (
      <div className="pb-20 lg:pb-0">
        <div className="text-center py-12">
          <Trophy size={48} className="mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Allenamento completato!</h2>
          <p className="text-gray-500 mb-4">
            Hai già completato l'allenamento di oggi. Ottimo lavoro!
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Torna alla Dashboard
          </button>
        </div>
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
          const total = exercise.sets;
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
                  <h3
                    className={`font-medium truncate ${
                      fullyDone ? 'line-through text-gray-500' : ''
                    }`}
                  >
                    {exercise.name}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {exercise.sets} serie x {exercise.reps} ripetizioni
                    {exercise.weight && ` • ${exercise.weight}kg`}
                  </p>
                  {exercise.notes && (
                    <p className="text-xs text-gray-400 mt-1 truncate">{exercise.notes}</p>
                  )}
                </div>
              </div>

              {/* Set tracker */}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-3 ml-9 flex-wrap">
                {Array.from({ length: total }, (_, s) => {
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
                        // Undo: clicking a completed set undoes from the last
                        if (isCurrent) undoSet(index);
                      } else if (isNextSet) {
                        // Complete next set
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
                <span className="text-xs text-gray-400 ml-1">
                  {done}/{total}
                </span>
              </div>
            </div>

            {/* Feedback buttons - shown after completing exercise when autoProgression is on */}
            {todayWorkout.autoProgression && fullyDone && (
              <div className="mt-1 ml-9">
                {feedbacks[index] ? (
                  <p className="text-xs text-gray-500">
                    Difficoltà: <span className={`font-medium ${
                      feedbacks[index] === 'LIGHT' ? 'text-green-600' :
                      feedbacks[index] === 'NEUTRAL' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {feedbacks[index] === 'LIGHT' ? 'Facile' :
                       feedbacks[index] === 'NEUTRAL' ? 'Medio' : 'Difficile'}
                    </span>
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFeedback(index, 'LIGHT'); }}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                    >
                      Facile
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFeedback(index, 'NEUTRAL'); }}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
                    >
                      Medio
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFeedback(index, 'HEAVY'); }}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                    >
                      Difficile
                    </button>
                  </div>
                )}
              </div>
            )}
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
          if (!todayWorkout.todayLogId) {
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
                  let logId = todayWorkout.todayLogId;
                  if (!logId) {
                    const log = await workoutPlanApi.startTodayWorkout();
                    logId = log.id;
                  }
                  completeMutation.mutate({ logId, notes });
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
