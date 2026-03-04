import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Play, Pause, ChevronRight, Dumbbell, Calendar } from 'lucide-react';
import { workoutPlanApi } from '../services/api';
import type { WorkoutPlan, WorkoutDay, Exercise } from '../types';

const DAYS_OF_WEEK = [
  { key: 'MONDAY', label: 'L', fullLabel: 'Lunedì' },
  { key: 'TUESDAY', label: 'M', fullLabel: 'Martedì' },
  { key: 'WEDNESDAY', label: 'M', fullLabel: 'Mercoledì' },
  { key: 'THURSDAY', label: 'G', fullLabel: 'Giovedì' },
  { key: 'FRIDAY', label: 'V', fullLabel: 'Venerdì' },
  { key: 'SATURDAY', label: 'S', fullLabel: 'Sabato' },
  { key: 'SUNDAY', label: 'D', fullLabel: 'Domenica' },
];

export default function WorkoutPlansPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<WorkoutPlan | null>(null);
  const [activatingPlanId, setActivatingPlanId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['workoutPlans'],
    queryFn: workoutPlanApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: workoutPlanApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, plan }: { id: number; plan: WorkoutPlan }) =>
      workoutPlanApi.update(id, plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
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
      setActivatingPlanId(null);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: workoutPlanApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
      queryClient.invalidateQueries({ queryKey: ['todayWorkout'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const handleViewPlan = async (planId: number) => {
    const plan = await workoutPlanApi.getById(planId);
    setViewingPlan(plan);
  };

  return (
    <div className="pb-20 lg:pb-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Piani di Allenamento</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Nuovo Piano</span>
        </button>
      </div>

      {/* Form Modal */}
      {(showForm || editingPlan) && (
        <PlanForm
          plan={editingPlan}
          onSubmit={(plan) => {
            if (editingPlan?.id) {
              updateMutation.mutate({ id: editingPlan.id, plan });
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

      {/* Plans List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12">
          <Dumbbell size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nessun piano di allenamento</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary mt-4">
            Crea il primo piano
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`card ${plan.isActive ? 'ring-2 ring-primary-500 bg-primary-50' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => plan.id && handleViewPlan(plan.id)}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    {plan.isActive && (
                      <span className="text-xs px-2 py-1 bg-primary-500 text-white rounded-full">
                        Attivo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {plan.workoutsPerWeek}x settimana • {plan.workoutDays?.length || 0} giorni
                  </p>
                  {plan.trainingDays && plan.trainingDays.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {DAYS_OF_WEEK.map((day) => (
                        <span
                          key={day.key}
                          className={`w-5 h-5 text-xs rounded flex items-center justify-center ${
                            plan.trainingDays?.includes(day.key)
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                          title={day.fullLabel}
                        >
                          {day.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {plan.description && (
                    <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {plan.isActive ? (
                    <button
                      onClick={() => plan.id && deactivateMutation.mutate(plan.id)}
                      className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg"
                      title="Disattiva"
                    >
                      <Pause size={20} />
                    </button>
                  ) : (
                    <button
                      onClick={() => plan.id && setActivatingPlanId(plan.id)}
                      className="p-2 text-green-500 hover:bg-green-50 rounded-lg"
                      title="Attiva"
                    >
                      <Play size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => plan.id && handleViewPlan(plan.id)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <button
                    onClick={() => plan.id && deleteMutation.mutate(plan.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
  onSubmit: (plan: WorkoutPlan) => void;
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
      autoProgression: false,
    }
  );

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
    const newDays = [...formData.workoutDays];
    newDays[dayIndex].exercises.push({
      name: '',
      sets: 3,
      reps: 10,
    });
    setFormData({ ...formData, workoutDays: newDays });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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

            {/* Auto Progression Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Progressione automatica
                </label>
                <p className="text-xs text-gray-500">
                  Incrementa reps/peso dopo sessioni consecutive facili o medie
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={formData.autoProgression || false}
                onClick={() => setFormData({ ...formData, autoProgression: !formData.autoProgression })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.autoProgression ? 'bg-primary-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.autoProgression ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
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
                      <div key={exIndex} className="flex items-center gap-2 bg-white p-2 rounded-lg">
                        <input
                          type="text"
                          value={exercise.name}
                          onChange={(e) => updateExercise(dayIndex, exIndex, { ...exercise, name: e.target.value })}
                          className="input flex-1 text-sm"
                          placeholder="Esercizio"
                          required
                        />
                        <input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(dayIndex, exIndex, { ...exercise, sets: parseInt(e.target.value) || 1 })}
                          className="input w-16 text-sm text-center"
                          min="1"
                          title="Serie"
                        />
                        <span className="text-gray-400">x</span>
                        <input
                          type="number"
                          value={exercise.reps}
                          onChange={(e) => updateExercise(dayIndex, exIndex, { ...exercise, reps: parseInt(e.target.value) || 1 })}
                          className="input w-16 text-sm text-center"
                          min="1"
                          title="Ripetizioni"
                        />
                        <button
                          type="button"
                          onClick={() => removeExercise(dayIndex, exIndex)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
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
                disabled={isLoading || formData.workoutDays.length === 0}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {isLoading ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </form>
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
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
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
}: {
  plan: WorkoutPlan;
  onClose: () => void;
  onEdit: () => void;
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
                    <div key={exercise.id || exIndex} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">{exIndex + 1}.</span>
                      <span className="flex-1">{exercise.name}</span>
                      <span className="text-primary-600 font-medium">
                        {exercise.sets}x{exercise.reps}
                      </span>
                      {exercise.weight && (
                        <span className="text-gray-500">{exercise.weight}kg</span>
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
            <button onClick={onEdit} className="btn btn-primary flex-1">
              Modifica
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
/* TESTBUILD123 */
