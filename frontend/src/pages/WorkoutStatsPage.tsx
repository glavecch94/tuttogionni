import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Dumbbell, CheckCircle, Clock, ChevronRight, Trophy, Play,
  TrendingUp, Calendar, Plus, Trash2, Pause, ChevronDown, ChevronUp,
  AlertTriangle, Copy, ArrowUp, ArrowDown
} from 'lucide-react';
import { workoutPlanApi, exerciseTemplateApi } from '../services/api';
import type { WorkoutPlan, WorkoutDay, Exercise, UpdatePreviewResponse, ExerciseTemplate, MuscleGroup } from '../types';
import ExerciseLibrary from '../components/ExerciseLibrary';

const DAYS_OF_WEEK = [
  { key: 'MONDAY', label: 'L', fullLabel: 'Lunedì' },
  { key: 'TUESDAY', label: 'M', fullLabel: 'Martedì' },
  { key: 'WEDNESDAY', label: 'M', fullLabel: 'Mercoledì' },
  { key: 'THURSDAY', label: 'G', fullLabel: 'Giovedì' },
  { key: 'FRIDAY', label: 'V', fullLabel: 'Venerdì' },
  { key: 'SATURDAY', label: 'S', fullLabel: 'Sabato' },
  { key: 'SUNDAY', label: 'D', fullLabel: 'Domenica' },
];

export default function WorkoutStatsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPlans, setShowPlans] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<WorkoutPlan | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);
  const [activatingPlanId, setActivatingPlanId] = useState<number | null>(null);

  const { data: todayWorkout } = useQuery({
    queryKey: ['todayWorkout'],
    queryFn: workoutPlanApi.getTodayWorkout,
  });

  const { data: workoutHistory = [] } = useQuery({
    queryKey: ['workoutHistory'],
    queryFn: () => workoutPlanApi.getHistory(),
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['workoutPlans'],
    queryFn: workoutPlanApi.getAll,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: workoutPlanApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, plan, resetCycle, effectiveDate }: { id: number; plan: WorkoutPlan; resetCycle?: boolean; effectiveDate?: string }) =>
      workoutPlanApi.update(id, plan, resetCycle, effectiveDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
      queryClient.invalidateQueries({ queryKey: ['todayWorkout'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setEditingPlan(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: workoutPlanApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: ({ id, startDate, startDayIndex }: { id: number; startDate?: string; startDayIndex?: number }) =>
      workoutPlanApi.activate(id, startDate, startDayIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
      queryClient.invalidateQueries({ queryKey: ['todayWorkout'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['activePlan'] });
      setActivatingPlanId(null);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: workoutPlanApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
      queryClient.invalidateQueries({ queryKey: ['todayWorkout'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['activePlan'] });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: workoutPlanApi.clone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
    },
  });

  const handleViewPlan = async (planId: number) => {
    const plan = await workoutPlanApi.getById(planId);
    setViewingPlan(plan);
  };

  // Stats calculations
  const completedTotal = workoutHistory.filter((w) => w.completed).length;
  const thisWeekWorkouts = workoutHistory.filter((w) => {
    const workoutDate = new Date(w.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return workoutDate >= weekAgo;
  });
  const completedThisWeek = thisWeekWorkouts.filter((w) => w.completed).length;

  const thisMonthWorkouts = workoutHistory.filter((w) => {
    const workoutDate = new Date(w.date);
    const now = new Date();
    return workoutDate.getMonth() === now.getMonth() && workoutDate.getFullYear() === now.getFullYear();
  });
  const completedThisMonth = thisMonthWorkouts.filter((w) => w.completed).length;

  const activePlan = plans.find(p => p.isActive);

  return (
    <div className="pb-20 lg:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Allenamenti</h1>
        <p className="text-gray-500 mt-1">Statistiche, progressi e piani</p>
      </div>

      {/* Today's Workout Card */}
      {todayWorkout && (
        <div
          className={`mb-6 rounded-2xl p-6 cursor-pointer transition-all ${
            todayWorkout.alreadyCompletedToday
              ? 'bg-green-50 border-2 border-green-200'
              : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
          }`}
          onClick={() => navigate('/today-workout')}
        >
          {todayWorkout.alreadyCompletedToday ? (
            <div className="flex items-center gap-4">
              <Trophy size={40} className="text-yellow-500" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-green-800">Allenamento completato!</h2>
                <p className="text-green-600">
                  {todayWorkout.workoutDayName} - Ottimo lavoro oggi!
                </p>
              </div>
              <CheckCircle size={32} className="text-green-500" />
            </div>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-white bg-opacity-20 rounded-xl flex-shrink-0">
                <Dumbbell size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-primary-100 text-xs sm:text-sm truncate">{todayWorkout.workoutPlanName}</p>
                <h2 className="text-lg sm:text-xl font-bold truncate">
                  {todayWorkout.workoutDayName}
                </h2>
                <p className="text-primary-100">
                  {todayWorkout.exercises.length} esercizi da completare
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Play size={24} />
                <ChevronRight size={24} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedThisWeek}</p>
              <p className="text-sm text-gray-500">Questa settimana</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedThisMonth}</p>
              <p className="text-sm text-gray-500">Questo mese</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedTotal}</p>
              <p className="text-sm text-gray-500">Totali</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
              <Dumbbell className="text-orange-600" size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-lg font-bold truncate">{activePlan?.name || '-'}</p>
              <p className="text-sm text-gray-500">Piano attivo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div className="card mb-6">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowPlans(!showPlans)}
        >
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Dumbbell size={20} className="text-primary-600" />
            Piani di Allenamento
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowForm(true);
              }}
              className="btn btn-primary btn-sm flex items-center gap-1"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Nuovo</span>
            </button>
            {showPlans ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>

        {showPlans && (
          <div className="mt-4">
            {plansLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8">
                <Dumbbell size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Nessun piano di allenamento</p>
                <button onClick={() => setShowForm(true)} className="btn btn-primary mt-3">
                  Crea il primo piano
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-4 rounded-xl border ${plan.isActive ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => plan.id && handleViewPlan(plan.id)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-semibold truncate">{plan.name}</h3>
                          {plan.isActive && (
                            <span className="text-xs px-2 py-0.5 bg-primary-500 text-white rounded-full">
                              Attivo
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {plan.workoutsPerWeek}x settimana • {plan.workoutDays?.length || 0} giorni
                          {plan.autoProgression && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                              auto↑
                            </span>
                          )}
                        </p>
                        {plan.trainingDays && plan.trainingDays.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {DAYS_OF_WEEK.map((day) => (
                              <span
                                key={day.key}
                                className={`w-5 h-5 text-xs rounded flex items-center justify-center ${
                                  plan.trainingDays?.includes(day.key)
                                    ? 'bg-primary-200 text-primary-700'
                                    : 'bg-gray-200 text-gray-400'
                                }`}
                                title={day.fullLabel}
                              >
                                {day.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                        {plan.isActive ? (
                          <button
                            onClick={() => plan.id && deactivateMutation.mutate(plan.id)}
                            className="p-2 text-orange-500 hover:bg-orange-100 rounded-lg"
                            title="Disattiva"
                          >
                            <Pause size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => plan.id && setActivatingPlanId(plan.id)}
                            className="p-2 text-green-500 hover:bg-green-100 rounded-lg"
                            title="Attiva"
                          >
                            <Play size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => plan.id && handleViewPlan(plan.id)}
                          className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg"
                          title="Visualizza"
                        >
                          <ChevronRight size={18} />
                        </button>
                        <button
                          onClick={() => plan.id && cloneMutation.mutate(plan.id)}
                          className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg"
                          title="Clona"
                          disabled={cloneMutation.isPending}
                        >
                          <Copy size={18} />
                        </button>
                        <button
                          onClick={() => plan.id && setDeletingPlanId(plan.id)}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                          title="Elimina"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exercise Library */}
      <div className="mb-6">
        <ExerciseLibrary />
      </div>

      {/* Workout History */}
      {workoutHistory.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock size={20} className="text-primary-600" />
            Storico allenamenti
          </h2>
          <div className="space-y-2">
            {workoutHistory.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-3 py-3 px-3 rounded-lg hover:bg-gray-50 border-b last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${log.completed ? 'bg-green-100' : 'bg-orange-100'}`}>
                    <Dumbbell size={18} className={log.completed ? 'text-green-600' : 'text-orange-600'} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{log.workoutDayName}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {log.workoutPlanName} • {format(new Date(log.date), 'd MMMM yyyy', { locale: it })}
                    </p>
                  </div>
                </div>
                {log.completed ? (
                  <CheckCircle className="text-green-500" size={20} />
                ) : (
                  <Clock className="text-orange-500" size={20} />
                )}
              </div>
            ))}
          </div>
          {workoutHistory.length > 10 && (
            <p className="text-center text-sm text-gray-500 mt-4">
              E altri {workoutHistory.length - 10} allenamenti...
            </p>
          )}
        </div>
      )}

      {workoutHistory.length === 0 && !todayWorkout && plans.length === 0 && (
        <div className="card text-center py-8">
          <Dumbbell size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nessun allenamento registrato</p>
          <p className="text-sm text-gray-400 mt-1">Crea un piano e inizia ad allenarti!</p>
        </div>
      )}

      {/* Form Modal */}
      {(showForm || editingPlan) && (
        <PlanForm
          plan={editingPlan}
          onSubmit={(plan, resetCycle, effectiveDate) => {
            if (editingPlan?.id) {
              updateMutation.mutate({ id: editingPlan.id, plan, resetCycle, effectiveDate });
            } else {
              createMutation.mutate(plan);
            }
          }}
          onClose={() => {
            setShowForm(false);
            setEditingPlan(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* View Plan Modal */}
      {viewingPlan && (
        <PlanView
          plan={viewingPlan}
          onClose={() => setViewingPlan(null)}
          onEdit={() => {
            setEditingPlan(viewingPlan);
            setViewingPlan(null);
          }}
          onClone={() => {
            if (viewingPlan.id) {
              cloneMutation.mutate(viewingPlan.id);
              setViewingPlan(null);
            }
          }}
        />
      )}

      {/* Activate Modal */}
      {activatingPlanId && (
        <ActivateModal
          planId={activatingPlanId}
          onActivate={(startDate, startDayIndex) => {
            activateMutation.mutate({ id: activatingPlanId, startDate, startDayIndex });
          }}
          onClose={() => setActivatingPlanId(null)}
          isLoading={activateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingPlanId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold">Elimina Piano</h3>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-gray-700">
                Sei sicuro di voler eliminare questo piano di allenamento?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  <strong>Nota:</strong> Gli allenamenti futuri non ancora completati verranno rimossi dal calendario.
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">
                  Gli allenamenti già completati rimarranno nello storico.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeletingPlanId(null)}
                className="btn btn-secondary flex-1"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(deletingPlanId);
                  setDeletingPlanId(null);
                }}
                className="btn bg-red-500 text-white hover:bg-red-600 flex-1"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanForm({
  plan,
  onSubmit,
  onClose,
  isLoading,
}: {
  plan: WorkoutPlan | null;
  onSubmit: (plan: WorkoutPlan, resetCycle?: boolean, effectiveDate?: string) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<WorkoutPlan>(
    plan || {
      name: '',
      description: '',
      workoutsPerWeek: 3,
      workoutDays: [],
      trainingDays: [],
      trainingTime: '',
    }
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [preview, setPreview] = useState<UpdatePreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [showExercisePicker, setShowExercisePicker] = useState<number | null>(null);

  // Fetch exercise templates
  const { data: exerciseTemplates = [] } = useQuery({
    queryKey: ['exerciseTemplates'],
    queryFn: exerciseTemplateApi.getAll,
  });

  // Sync form data when plan prop changes
  useEffect(() => {
    if (plan) {
      setFormData(plan);
    }
  }, [plan]);

  const toggleTrainingDay = (dayKey: string) => {
    const currentDays = formData.trainingDays || [];
    if (currentDays.includes(dayKey)) {
      setFormData({
        ...formData,
        trainingDays: currentDays.filter((d) => d !== dayKey),
      });
    } else {
      setFormData({
        ...formData,
        trainingDays: [...currentDays, dayKey],
      });
    }
  };

  const addDay = () => {
    setFormData({
      ...formData,
      workoutDays: [
        ...formData.workoutDays,
        {
          dayNumber: formData.workoutDays.length + 1,
          name: `Giorno ${formData.workoutDays.length + 1}`,
          exercises: [],
        },
      ],
    });
  };

  const removeDay = (index: number) => {
    const newDays = formData.workoutDays.filter((_, i) => i !== index);
    setFormData({ ...formData, workoutDays: newDays });
  };

  const updateDay = (index: number, day: WorkoutDay) => {
    const newDays = [...formData.workoutDays];
    newDays[index] = day;
    setFormData({ ...formData, workoutDays: newDays });
  };

  const addExercise = (dayIndex: number) => {
    setShowExercisePicker(dayIndex);
  };

  const addExerciseFromTemplate = (dayIndex: number, template: ExerciseTemplate) => {
    const newDays = [...formData.workoutDays];
    const isCardio = template.muscleGroup === 'CARDIO';
    newDays[dayIndex].exercises.push(isCardio ? {
      exerciseTemplateId: template.id,
      name: template.name,
      muscleGroup: template.muscleGroup,
      cardioType: template.cardioType,
      durationMinutes: template.defaultDurationMinutes,
    } : {
      exerciseTemplateId: template.id,
      name: template.name,
      muscleGroup: template.muscleGroup,
      sets: template.defaultSets,
      reps: template.minReps,
      minReps: template.minReps,
      maxReps: template.maxReps,
      weight: template.initialWeight ? Number(template.initialWeight) : undefined,
      useTwoDumbbells: template.useTwoDumbbells,
    });
    setFormData({ ...formData, workoutDays: newDays });
    setShowExercisePicker(null);
  };

  const addCustomExercise = (dayIndex: number) => {
    const newDays = [...formData.workoutDays];
    newDays[dayIndex].exercises.push({
      name: '',
      sets: 3,
      reps: 10,
    });
    setFormData({ ...formData, workoutDays: newDays });
    setShowExercisePicker(null);
  };

  const removeExercise = (dayIndex: number, exerciseIndex: number) => {
    const newDays = [...formData.workoutDays];
    newDays[dayIndex].exercises = newDays[dayIndex].exercises.filter((_, i) => i !== exerciseIndex);
    setFormData({ ...formData, workoutDays: newDays });
  };

  const updateExercise = (dayIndex: number, exerciseIndex: number, exercise: Exercise) => {
    const newDays = [...formData.workoutDays];
    newDays[dayIndex].exercises[exerciseIndex] = exercise;
    setFormData({ ...formData, workoutDays: newDays });
  };

  const moveExerciseUp = (dayIndex: number, exerciseIndex: number) => {
    if (exerciseIndex === 0) return;
    const newDays = [...formData.workoutDays];
    const exercises = [...newDays[dayIndex].exercises];
    [exercises[exerciseIndex - 1], exercises[exerciseIndex]] = [exercises[exerciseIndex], exercises[exerciseIndex - 1]];
    newDays[dayIndex].exercises = exercises;
    setFormData({ ...formData, workoutDays: newDays });
  };

  const moveExerciseDown = (dayIndex: number, exerciseIndex: number) => {
    const newDays = [...formData.workoutDays];
    const exercises = [...newDays[dayIndex].exercises];
    if (exerciseIndex === exercises.length - 1) return;
    [exercises[exerciseIndex], exercises[exerciseIndex + 1]] = [exercises[exerciseIndex + 1], exercises[exerciseIndex]];
    newDays[dayIndex].exercises = exercises;
    setFormData({ ...formData, workoutDays: newDays });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If autoProgression is on, ensure every strength exercise has weightIncrement
    if (formData.autoProgression) {
      for (const day of formData.workoutDays) {
        for (const ex of day.exercises) {
          const isCardio = ex.muscleGroup === 'CARDIO' || !!ex.cardioType;
          if (!isCardio && !ex.weightIncrement) {
            alert(`Imposta l'incremento peso (+kg) per l'esercizio "${ex.name}" prima di salvare.`);
            return;
          }
        }
      }
    }

    // If editing an existing plan, show confirmation dialog first
    if (plan?.id) {
      setPreviewLoading(true);
      try {
        const previewData = await workoutPlanApi.getUpdatePreview(plan.id, formData);
        setPreview(previewData);
        setShowConfirmDialog(true);
      } catch (error) {
        console.error('Error getting preview:', error);
        // If preview fails, just submit normally
        onSubmit(formData);
      } finally {
        setPreviewLoading(false);
      }
    } else {
      // New plan, no confirmation needed
      onSubmit(formData);
    }
  };

  const handleConfirmSave = (resetCycle?: boolean) => {
    setShowConfirmDialog(false);
    onSubmit(formData, resetCycle, preview?.planIsActive ? effectiveDate : undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {plan ? 'Modifica Piano' : 'Nuovo Piano di Allenamento'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome del Piano
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="es. Push Pull Legs"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrizione
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={2}
                placeholder="Descrizione opzionale"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allenamenti a settimana
              </label>
              <input
                type="number"
                value={formData.workoutsPerWeek}
                onChange={(e) => setFormData({ ...formData, workoutsPerWeek: parseInt(e.target.value) || 1 })}
                className="input w-24"
                min="1"
                max="7"
                required
              />
            </div>

            {/* Training Days Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giorni di allenamento
              </label>
              <div className="flex gap-2 flex-wrap">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = (formData.trainingDays || []).includes(day.key);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => toggleTrainingDay(day.key)}
                      title={day.fullLabel}
                      className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                        isSelected
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Seleziona i giorni della settimana in cui puoi allenarti
              </p>
            </div>

            {/* Training Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orario allenamento
              </label>
              <input
                type="time"
                value={formData.trainingTime || ''}
                onChange={(e) => setFormData({ ...formData, trainingTime: e.target.value })}
                className="input w-32"
              />
              <p className="text-xs text-gray-500 mt-1">
                Orario in cui preferisci allenarti (opzionale)
              </p>
            </div>

            {/* Auto Progression Toggle */}
            <div className="flex items-center justify-between py-3 border rounded-xl px-4 bg-gray-50">
              <div>
                <p className="font-medium text-sm text-gray-800">Progressione automatica</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Aggiusta reps e peso in base ai tuoi feedback di difficoltà
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, autoProgression: !formData.autoProgression })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  formData.autoProgression ? 'bg-primary-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                    formData.autoProgression ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Workout Days */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Giorni di Allenamento</h3>
                <button
                  type="button"
                  onClick={addDay}
                  className="btn btn-secondary text-sm flex items-center gap-1"
                >
                  <Plus size={16} /> Aggiungi Giorno
                </button>
              </div>

              {formData.workoutDays.map((day, dayIndex) => (
                <div key={dayIndex} className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="text"
                      value={day.name}
                      onChange={(e) => updateDay(dayIndex, { ...day, name: e.target.value })}
                      className="input flex-1"
                      placeholder="Nome giorno (es. Push)"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeDay(dayIndex)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Exercises */}
                  <div className="space-y-2 ml-4">
                    {day.exercises.map((exercise, exIndex) => (
                      <div key={exIndex} className="bg-white p-3 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          {/* Reorder buttons */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveExerciseUp(dayIndex, exIndex)}
                              disabled={exIndex === 0}
                              className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Sposta su"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveExerciseDown(dayIndex, exIndex)}
                              disabled={exIndex === day.exercises.length - 1}
                              className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Sposta giù"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                          <span className="font-medium flex-1 truncate">{exercise.name || 'Nuovo esercizio'}</span>
                          {exercise.muscleGroup && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                              {exercise.muscleGroup}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeExercise(dayIndex, exIndex)}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {(exercise.muscleGroup === 'CARDIO' || !!exercise.cardioType) ? (
                          <div className="flex items-center gap-2 text-sm flex-wrap">
                            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">Cardio</span>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Durata:</span>
                              <input
                                type="number"
                                value={exercise.durationMinutes || ''}
                                onChange={(e) => updateExercise(dayIndex, exIndex, { ...exercise, durationMinutes: e.target.value ? parseInt(e.target.value) : undefined })}
                                className="input w-16 text-sm text-center py-1"
                                min="1"
                                placeholder="min"
                              />
                              <span className="text-gray-400">min</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Serie:</span>
                              <input
                                type="number"
                                value={exercise.sets}
                                onChange={(e) => updateExercise(dayIndex, exIndex, { ...exercise, sets: parseInt(e.target.value) || 1 })}
                                className="input w-12 sm:w-14 text-sm text-center py-1"
                                min="1"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Rep:</span>
                              <input
                                type="number"
                                value={exercise.reps}
                                onChange={(e) => updateExercise(dayIndex, exIndex, { ...exercise, reps: parseInt(e.target.value) || 1 })}
                                className="input w-12 sm:w-14 text-sm text-center py-1"
                                min="1"
                              />
                              {exercise.maxReps && exercise.maxReps !== exercise.reps && (
                                <span className="text-gray-400">-{exercise.maxReps}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Peso:</span>
                              <input
                                type="number"
                                value={exercise.weight || ''}
                                onChange={(e) => updateExercise(dayIndex, exIndex, { ...exercise, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
                                className="input w-14 sm:w-16 text-sm text-center py-1"
                                step="0.5"
                                placeholder="-"
                              />
                              <span className="text-gray-400">kg</span>
                            </div>
                            {(() => {
                              const isCardio = (exercise.muscleGroup as string) === 'CARDIO' || !!exercise.cardioType;
                              if (isCardio) return null;
                              const required = !!formData.autoProgression;
                              const missing = required && !exercise.weightIncrement;
                              return (
                                <div className="flex items-center gap-1">
                                  <span className={`text-sm ${missing ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                                    +kg{required ? <span className="text-red-500">*</span> : ''}:
                                  </span>
                                  <input
                                    type="number"
                                    value={exercise.weightIncrement || ''}
                                    onChange={(e) => updateExercise(dayIndex, exIndex, { ...exercise, weightIncrement: e.target.value ? parseFloat(e.target.value) : undefined })}
                                    className={`input w-14 sm:w-16 text-sm text-center py-1 ${missing ? 'border-red-400 focus:border-red-500' : ''}`}
                                    step="0.5"
                                    min="0.5"
                                    placeholder="2.5"
                                  />
                                </div>
                              );
                            })()}
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={exercise.useTwoDumbbells || false}
                                onChange={(e) => updateExercise(dayIndex, exIndex, { ...exercise, useTwoDumbbells: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600"
                              />
                              <span className="text-gray-500">x2</span>
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addExercise(dayIndex)}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      <Plus size={14} /> Aggiungi Esercizio
                    </button>
                  </div>
                </div>
              ))}

              {formData.workoutDays.length === 0 && (
                <p className="text-gray-400 text-center py-4">
                  Aggiungi almeno un giorno di allenamento
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
                Annulla
              </button>
              <button
                type="submit"
                disabled={isLoading || previewLoading || formData.workoutDays.length === 0}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {isLoading || previewLoading ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && preview && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="text-yellow-600" size={24} />
              </div>
              <h3 className="text-lg font-bold">Conferma Modifica</h3>
            </div>

            <div className="space-y-3 mb-6">
              {preview.planIsActive ? (
                <>
                  {preview.cycleWillChange ? (
                    <>
                      <p className="text-gray-700">
                        Stai modificando il numero di giorni del ciclo da <strong>{preview.oldDayCount}</strong> a <strong>{preview.newDayCount}</strong>.
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-yellow-800 text-sm">
                          <strong>Attenzione:</strong> Il ciclo di allenamento ripartirà da Giorno 1. Gli eventi futuri non completati verranno rigenerati.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-700">
                        Le modifiche verranno applicate mantenendo la continuità del ciclo.
                      </p>
                      {preview.lastCompletedDayName && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-blue-800 text-sm">
                            Ultimo allenamento completato: <strong>{preview.lastCompletedDayName}</strong>
                            {preview.lastCompletedDate && ` (${format(new Date(preview.lastCompletedDate), 'd MMMM', { locale: it })})`}
                          </p>
                          <p className="text-blue-800 text-sm mt-1">
                            Il prossimo allenamento sarà: <strong>Giorno {preview.nextDayNumber}</strong>
                          </p>
                        </div>
                      )}
                      {!preview.lastCompletedDayName && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-blue-800 text-sm">
                            Gli eventi futuri non completati verranno rigenerati con le nuove impostazioni.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Effective Date Selector */}
                  <div className="border border-gray-200 rounded-lg p-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data effetto modifiche
                    </label>
                    <input
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="input w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Le modifiche al calendario saranno applicate a partire da questa data
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm">
                      Gli allenamenti già completati rimarranno nel calendario come storico.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-gray-700">
                  Il piano non è attivo. Le modifiche verranno salvate senza generare eventi nel calendario.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="btn btn-secondary flex-1"
              >
                Annulla
              </button>
              <button
                onClick={() => handleConfirmSave(preview.cycleWillChange)}
                className="btn btn-primary flex-1"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Picker Modal */}
      {showExercisePicker !== null && (
        <ExercisePicker
          templates={exerciseTemplates}
          onSelect={(template) => addExerciseFromTemplate(showExercisePicker, template)}
          onCustom={() => addCustomExercise(showExercisePicker)}
          onClose={() => setShowExercisePicker(null)}
        />
      )}
    </div>
  );
}

const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  PETTO: 'Petto',
  SPALLE: 'Spalle',
  BICIPITI: 'Bicipiti',
  TRICIPITI: 'Tricipiti',
  DORSALI: 'Dorsali',
  GAMBE: 'Gambe',
  CORE: 'Core',
  CARDIO: 'Cardio',
};

function ExercisePicker({
  templates,
  onSelect,
  onCustom,
  onClose,
}: {
  templates: ExerciseTemplate[];
  onSelect: (template: ExerciseTemplate) => void;
  onCustom: () => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | 'ALL'>('ALL');

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGroup === 'ALL' || t.muscleGroup === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  // Group templates by muscle group
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.muscleGroup]) {
      acc[template.muscleGroup] = [];
    }
    acc[template.muscleGroup].push(template);
    return acc;
  }, {} as Record<MuscleGroup, ExerciseTemplate[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b">
          <h3 className="text-lg font-bold mb-3">Seleziona Esercizio</h3>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full mb-2"
            placeholder="Cerca esercizio..."
            autoFocus
          />
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setSelectedGroup('ALL')}
              className={`px-2 py-1 text-xs rounded-full ${
                selectedGroup === 'ALL' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Tutti
            </button>
            {(Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]).map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-2 py-1 text-xs rounded-full ${
                  selectedGroup === group ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {MUSCLE_GROUP_LABELS[group]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nessun esercizio nella libreria</p>
              <p className="text-sm mt-1">Aggiungi esercizi dalla sezione Libreria Esercizi</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nessun esercizio trovato</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(Object.entries(groupedTemplates) as [MuscleGroup, ExerciseTemplate[]][])
                .filter(([group]) => MUSCLE_GROUP_LABELS[group]) // Only show valid muscle groups
                .map(([group, exercises]) => (
                <div key={group}>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">{MUSCLE_GROUP_LABELS[group]}</h4>
                  <div className="space-y-1">
                    {exercises.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => onSelect(template)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-100 border border-transparent hover:border-primary-200 transition-colors"
                      >
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-gray-500">
                          {template.muscleGroup === 'CARDIO' ? (
                            <>Cardio{template.defaultDurationMinutes ? ` • ${template.defaultDurationMinutes} min` : ''}</>
                          ) : (
                            <>{template.defaultSets} serie × {template.minReps}-{template.maxReps} rep
                            {template.initialWeight && ` • ${template.initialWeight}kg`}
                            {template.useTwoDumbbells && ' (x2)'}</>
                          )}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex gap-2">
          <button onClick={onClose} className="btn btn-secondary flex-1">
            Annulla
          </button>
          <button onClick={onCustom} className="btn btn-primary flex-1">
            Esercizio Personalizzato
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivateModal({
  planId,
  onActivate,
  onClose,
  isLoading,
}: {
  planId: number;
  onActivate: (startDate?: string, startDayIndex?: number) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [startDate, setStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [startDayIndex, setStartDayIndex] = useState(0);
  const [planDetails, setPlanDetails] = useState<WorkoutPlan | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    workoutPlanApi.getById(planId).then((plan) => {
      setPlanDetails(plan);
      setLoadingDetails(false);
    }).catch(() => {
      setLoadingDetails(false);
    });
  }, [planId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-1">Attiva Piano</h2>
          {planDetails && (
            <p className="text-gray-500 text-sm mb-4">{planDetails.name}</p>
          )}

          {loadingDetails ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={16} />
                    Data di inizio
                  </div>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="input w-full"
                />
              </div>

              {planDetails && planDetails.workoutDays.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giorno del ciclo di partenza
                  </label>
                  <select
                    value={startDayIndex}
                    onChange={(e) => setStartDayIndex(parseInt(e.target.value))}
                    className="input w-full"
                  >
                    {planDetails.workoutDays.map((day, index) => (
                      <option key={day.id || index} value={index}>
                        Giorno {day.dayNumber}: {day.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="btn btn-secondary flex-1">
                  Annulla
                </button>
                <button
                  onClick={() => onActivate(startDate, startDayIndex)}
                  disabled={isLoading}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {isLoading ? 'Attivazione...' : 'Attiva'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlanView({
  plan,
  onClose,
  onEdit,
  onClone,
}: {
  plan: WorkoutPlan;
  onClose: () => void;
  onEdit: () => void;
  onClone: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{plan.name}</h2>
              {plan.description && (
                <p className="text-gray-500 text-sm">{plan.description}</p>
              )}
            </div>
            {plan.isActive && (
              <span className="text-xs px-2 py-1 bg-primary-500 text-white rounded-full">
                Attivo
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-4">
            {plan.workoutsPerWeek}x settimana • {plan.workoutDays.length} giorni nel ciclo
            {plan.trainingTime && ` • Ore ${plan.trainingTime.substring(0, 5)}`}
          </p>

          <div className="space-y-4">
            {plan.workoutDays.map((day, index) => (
              <div key={day.id || index} className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">
                  Giorno {day.dayNumber}: {day.name}
                </h3>
                {day.description && (
                  <p className="text-sm text-gray-500 mb-2">{day.description}</p>
                )}
                <div className="space-y-1">
                  {day.exercises.map((exercise, exIndex) => (
                    <div key={exercise.id || exIndex} className="flex items-center gap-2 text-sm min-w-0">
                      <span className="text-gray-400 flex-shrink-0">{exIndex + 1}.</span>
                      <span className="flex-1 truncate">{exercise.name}</span>
                      {(exercise.muscleGroup === 'CARDIO' || !!exercise.cardioType) ? (
                        <span className="text-orange-500 font-medium">
                          {exercise.durationMinutes ? `${exercise.durationMinutes} min` : 'Cardio'}
                        </span>
                      ) : (
                        <>
                          <span className="text-primary-600 font-medium">
                            {exercise.sets}x{exercise.reps}
                          </span>
                          {exercise.weight && (
                            <span className="text-gray-500">{exercise.weight}kg</span>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4 mt-4 border-t">
            <button onClick={onClose} className="btn btn-secondary flex-1">
              Chiudi
            </button>
            <button onClick={onClone} className="btn btn-secondary flex-1 flex items-center justify-center gap-1">
              <Copy size={16} />
              Clona
            </button>
            <button onClick={onEdit} className="btn btn-primary flex-1">
              Modifica
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
