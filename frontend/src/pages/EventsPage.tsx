import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Plus, Trash2, CheckCircle, Circle, Target, Calendar,
  ChevronDown, ChevronRight, Power, Pencil, X, Clock, SkipForward, CalendarClock,
} from 'lucide-react';
import { goalApi, eventApi } from '../services/api';
import type { Goal, GoalCategory, GoalFrequency, Event, EventCategory } from '../types';
import {
  preconfiguredGoals,
  goalCategoryLabels,
  goalCategoryColors,
  goalFrequencyLabels,
  dayOfWeekLabels,
  type PreconfiguredGoal,
} from '../data/preconfiguredGoals';

const ALL_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const eventCategories: { value: EventCategory; label: string }[] = [
  { value: 'WORK', label: 'Lavoro' },
  { value: 'PERSONAL', label: 'Personale' },
  { value: 'HEALTH', label: 'Salute' },
  { value: 'SOCIAL', label: 'Sociale' },
  { value: 'EDUCATION', label: 'Formazione' },
  { value: 'FINANCE', label: 'Finanza' },
  { value: 'TRAVEL', label: 'Viaggio' },
  { value: 'OTHER', label: 'Altro' },
];

export default function EventsPage() {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [skipModalEventId, setSkipModalEventId] = useState<number | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: goalApi.getAll,
  });

  const { data: todayEvents = [] } = useQuery({
    queryKey: ['events', 'weekly'],
    queryFn: () => eventApi.getWeekly(),
    select: (data) => data.filter((e) => e.date === today),
  });

  const toggleEventMutation = useMutation({
    mutationFn: eventApi.toggleComplete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: goalApi.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: goalApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: goalApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: eventApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowEventForm(false);
    },
  });

  const skipEventMutation = useMutation({
    mutationFn: eventApi.skipEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setSkipModalEventId(null);
    },
  });

  const rescheduleEventMutation = useMutation({
    mutationFn: ({ id, date, time }: { id: number; date: string; time?: string }) =>
      eventApi.rescheduleEvent(id, date, time || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setSkipModalEventId(null);
      setShowReschedule(false);
      setRescheduleDate('');
      setRescheduleTime('');
    },
  });

  // Today's goal events (not workout, has goalId)
  const todayGoalEvents = todayEvents
    .filter((e) => e.goalId != null)
    .sort((a, b) => {
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      if (a.startTime) return -1;
      if (b.startTime) return 1;
      return 0;
    });

  const activeGoals = goals.filter((g) => g.active);
  const inactiveGoals = goals.filter((g) => !g.active);

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Obiettivi</h1>
          <p className="text-gray-500 text-sm mt-1">Gestisci i tuoi obiettivi e crea eventi rapidi</p>
        </div>
        <button
          onClick={() => setShowAddGoal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Nuovo</span>
        </button>
      </div>

      {/* Today's Goal Events */}
      {todayGoalEvents.length > 0 && (
        <div className="card mb-6 mt-4">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Target size={20} className="text-teal-600" />
            Obiettivi di oggi
          </h2>
          <div className="space-y-2">
            {todayGoalEvents.map((event) => (
              <div
                key={event.id}
                className={`p-3 rounded-lg border flex items-center gap-3 ${
                  event.skipped
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : event.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-teal-50 border-teal-200'
                }`}
              >
                <button
                  onClick={() => event.id && !event.skipped && toggleEventMutation.mutate(event.id)}
                  className="flex-shrink-0"
                  disabled={!!event.skipped}
                >
                  {event.skipped ? (
                    <SkipForward className="text-gray-400" size={22} />
                  ) : event.completed ? (
                    <CheckCircle className="text-green-600" size={22} />
                  ) : (
                    <Circle className="text-teal-400" size={22} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    event.skipped
                      ? 'line-through text-gray-400'
                      : event.completed
                        ? 'line-through text-gray-500'
                        : ''
                  }`}>
                    {event.title}
                  </p>
                  {event.skipped && (
                    <p className="text-xs text-gray-400">Saltato</p>
                  )}
                  {event.startTime && !event.skipped && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock size={12} />
                      {event.startTime.substring(0, 5)}
                    </p>
                  )}
                </div>
                {!event.completed && !event.skipped && (
                  <button
                    onClick={() => {
                      setSkipModalEventId(event.id!);
                      setShowReschedule(false);
                      setRescheduleDate('');
                      setRescheduleTime('');
                    }}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg"
                    title="Salta"
                  >
                    <SkipForward size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Goals */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">I miei obiettivi</h2>

        {goalsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-8 card">
            <Target size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-3">Nessun obiettivo creato</p>
            <button
              onClick={() => setShowAddGoal(true)}
              className="btn btn-primary"
            >
              Aggiungi il primo obiettivo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <div className="space-y-2">
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onToggleActive={() => goal.id && deactivateMutation.mutate(goal.id)}
                    onEdit={() => setEditingGoal(goal)}
                    onDelete={() => goal.id && deleteGoalMutation.mutate(goal.id)}
                  />
                ))}
              </div>
            )}

            {/* Inactive Goals */}
            {inactiveGoals.length > 0 && (
              <div className="space-y-2">
                {activeGoals.length > 0 && (
                  <p className="text-sm text-gray-400 mt-4 mb-2">Inattivi</p>
                )}
                {inactiveGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onToggleActive={() => goal.id && activateMutation.mutate(goal.id)}
                    onEdit={() => setEditingGoal(goal)}
                    onDelete={() => goal.id && deleteGoalMutation.mutate(goal.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Events Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar size={20} className="text-purple-600" />
            Eventi rapidi
          </h2>
          <button
            onClick={() => setShowEventForm(true)}
            className="btn btn-secondary flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Evento
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Crea appuntamenti e impegni manuali nel calendario
        </p>
      </div>

      {/* Add Goal Modal */}
      {showAddGoal && (
        <AddGoalModal
          onClose={() => setShowAddGoal(false)}
        />
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <GoalConfigModal
          goal={editingGoal}
          onClose={() => setEditingGoal(null)}
          isEdit
        />
      )}

      {/* Quick Event Form */}
      {showEventForm && (
        <QuickEventForm
          onSubmit={(event) => createEventMutation.mutate(event)}
          onClose={() => setShowEventForm(false)}
          isLoading={createEventMutation.isPending}
        />
      )}

      {/* Skip/Reschedule Modal */}
      {skipModalEventId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            {!showReschedule ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Salta obiettivo</h2>
                  <button onClick={() => setSkipModalEventId(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => skipEventMutation.mutate(skipModalEventId)}
                    disabled={skipEventMutation.isPending}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 flex items-center gap-3 transition-colors"
                  >
                    <SkipForward size={20} className="text-orange-500" />
                    <div className="text-left">
                      <p className="font-medium">Salta per oggi</p>
                      <p className="text-sm text-gray-500">Non verrà conteggiato come completato</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowReschedule(true)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                  >
                    <CalendarClock size={20} className="text-blue-500" />
                    <div className="text-left">
                      <p className="font-medium">Riprogramma</p>
                      <p className="text-sm text-gray-500">Sposta a un&apos;altra data e ora</p>
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Riprogramma</h2>
                  <button onClick={() => setSkipModalEventId(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nuova data</label>
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="input"
                      min={today}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nuovo orario (opzionale)</label>
                    <input
                      type="time"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowReschedule(false)}
                      className="btn btn-secondary flex-1"
                    >
                      Indietro
                    </button>
                    <button
                      onClick={() => {
                        if (rescheduleDate) {
                          rescheduleEventMutation.mutate({
                            id: skipModalEventId,
                            date: rescheduleDate,
                            time: rescheduleTime || undefined,
                          });
                        }
                      }}
                      disabled={!rescheduleDate || rescheduleEventMutation.isPending}
                      className="btn btn-primary flex-1 disabled:opacity-50"
                    >
                      {rescheduleEventMutation.isPending ? 'Salvataggio...' : 'Conferma'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- GoalCard ----------
function GoalCard({
  goal,
  onToggleActive,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const frequencyText = getFrequencyText(goal);

  return (
    <div
      className={`card flex items-center gap-3 ${!goal.active ? 'opacity-60' : ''}`}
    >
      <button
        onClick={onToggleActive}
        className="flex-shrink-0"
        title={goal.active ? 'Disattiva' : 'Attiva'}
      >
        <Power
          size={20}
          className={goal.active ? 'text-teal-600' : 'text-gray-400'}
        />
      </button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <div className="flex items-center gap-2 flex-wrap">
          {goal.icon && <span className="text-sm">{goal.icon}</span>}
          <h3 className="font-medium truncate">{goal.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${goalCategoryColors[goal.category]}`}>
            {goalCategoryLabels[goal.category]}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{frequencyText}</p>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function getFrequencyText(goal: Goal): string {
  const freq = goalFrequencyLabels[goal.frequency] || goal.frequency;
  if (goal.frequency === 'WEEKLY' || goal.frequency === 'BIWEEKLY') {
    if (goal.frequencyConfig && goal.frequencyConfig.length > 0) {
      const days = goal.frequencyConfig.map((d) => dayOfWeekLabels[d] || d).join(', ');
      return `${freq} - ${days}`;
    }
  }
  if (goal.frequency === 'MONTHLY' && goal.frequencyConfig && goal.frequencyConfig.length > 0) {
    return `${freq} - giorno ${goal.frequencyConfig.join(', ')}`;
  }
  if (goal.scheduledTime) {
    return `${freq} alle ${goal.scheduledTime.substring(0, 5)}`;
  }
  return freq;
}

// ---------- AddGoalModal ----------
function AddGoalModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [selectedGoal, setSelectedGoal] = useState<PreconfiguredGoal | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Group preconfigured goals by category
  const grouped = preconfiguredGoals.reduce<Record<string, PreconfiguredGoal[]>>((acc, g) => {
    if (!acc[g.category]) acc[g.category] = [];
    acc[g.category].push(g);
    return acc;
  }, {});

  if (selectedGoal) {
    return (
      <GoalConfigModal
        preconfigured={selectedGoal}
        onClose={onClose}
      />
    );
  }

  if (showCustom) {
    return <GoalConfigModal onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Aggiungi obiettivo</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-2">
            {Object.entries(grouped).map(([category, goals]) => (
              <div key={category} className="border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                >
                  <span className="font-medium">
                    {goalCategoryLabels[category as GoalCategory] || category}
                  </span>
                  {expandedCategory === category ? (
                    <ChevronDown size={20} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-400" />
                  )}
                </button>

                {expandedCategory === category && (
                  <div className="border-t divide-y">
                    {goals.map((goal) => (
                        <button
                          key={goal.key}
                          onClick={() => setSelectedGoal(goal)}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50"
                        >
                          <span className="text-xl flex-shrink-0">{goal.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{goal.name}</p>
                            <p className="text-xs text-gray-500">
                              {goalFrequencyLabels[goal.frequency]}
                            </p>
                          </div>
                        </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Custom goal option */}
          <button
            onClick={() => setShowCustom(true)}
            className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-primary-400 hover:text-primary-600 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Obiettivo personalizzato
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- GoalConfigModal ----------
function GoalConfigModal({
  preconfigured,
  goal,
  onClose,
  isEdit = false,
}: {
  preconfigured?: PreconfiguredGoal;
  goal?: Goal;
  onClose: () => void;
  isEdit?: boolean;
}) {
  const queryClient = useQueryClient();

  const initialData: Goal = goal
    ? { ...goal }
    : preconfigured
      ? {
          name: preconfigured.name,
          description: preconfigured.description || '',
          category: preconfigured.category,
          frequency: preconfigured.frequency,
          frequencyConfig: preconfigured.frequencyConfig || [],
          color: preconfigured.color,
          icon: preconfigured.icon,
          active: true,
          preconfiguredKey: preconfigured.key,
        }
      : {
          name: '',
          description: '',
          category: 'ALTRO' as GoalCategory,
          frequency: 'DAILY' as GoalFrequency,
          frequencyConfig: [],
          color: '#14B8A6',
          icon: '',
          active: true,
        };

  const [formData, setFormData] = useState<Goal>(initialData);

  const createMutation = useMutation({
    mutationFn: goalApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Goal }) => goalApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && goal?.id) {
      updateMutation.mutate({ id: goal.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleDay = (day: string) => {
    const current = formData.frequencyConfig || [];
    if (current.includes(day)) {
      setFormData({ ...formData, frequencyConfig: current.filter((d) => d !== day) });
    } else {
      setFormData({ ...formData, frequencyConfig: [...current, day] });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const showDayPicker = formData.frequency === 'WEEKLY' || formData.frequency === 'BIWEEKLY';
  const showMonthDayPicker = formData.frequency === 'MONTHLY';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {isEdit ? 'Modifica obiettivo' : preconfigured ? preconfigured.name : 'Nuovo obiettivo'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>

            {!preconfigured && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as GoalCategory })}
                  className="input"
                >
                  {Object.entries(goalCategoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequenza</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as GoalFrequency, frequencyConfig: [] })}
                className="input"
              >
                {Object.entries(goalFrequencyLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Day picker for WEEKLY/BIWEEKLY */}
            {showDayPicker && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giorni della settimana</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        (formData.frequencyConfig || []).includes(day)
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {dayOfWeekLabels[day]?.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Month day picker */}
            {showMonthDayPicker && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giorno del mese</label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={(formData.frequencyConfig || [])[0] || ''}
                  onChange={(e) => setFormData({ ...formData, frequencyConfig: e.target.value ? [e.target.value] : [] })}
                  className="input"
                  placeholder="es. 15"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orario</label>
              <input
                type="time"
                value={formData.scheduledTime || ''}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value || undefined })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={2}
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active ?? true}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Attiva subito</span>
              </label>
              <p className="text-xs text-gray-500 ml-6">Se attivato, gli eventi verranno generati automaticamente nel calendario</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
                Annulla
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {isLoading ? 'Salvataggio...' : isEdit ? 'Salva' : 'Crea obiettivo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ---------- QuickEventForm ----------
function QuickEventForm({
  onSubmit,
  onClose,
  isLoading,
}: {
  onSubmit: (event: Event) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Event>({
    title: '',
    category: 'PERSONAL',
    date: format(new Date(), 'yyyy-MM-dd'),
    recurring: false,
    completed: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Nuovo Evento</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as EventCategory })}
                className="input"
              >
                {eventCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ora inizio</label>
                <input
                  type="time"
                  value={formData.startTime || ''}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ora fine</label>
                <input
                  type="time"
                  value={formData.endTime || ''}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Luogo</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input"
                placeholder="Opzionale"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
                Annulla
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {isLoading ? 'Salvataggio...' : 'Crea evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
