import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Plus, Trash2, CheckCircle, Circle } from 'lucide-react';
import { workoutApi } from '../services/api';
import type { Workout, WorkoutType } from '../types';

const workoutTypes: { value: WorkoutType; label: string }[] = [
  { value: 'STRENGTH', label: 'Forza' },
  { value: 'CARDIO', label: 'Cardio' },
  { value: 'FLEXIBILITY', label: 'Flessibilità' },
  { value: 'HIIT', label: 'HIIT' },
  { value: 'YOGA', label: 'Yoga' },
  { value: 'SWIMMING', label: 'Nuoto' },
  { value: 'CYCLING', label: 'Ciclismo' },
  { value: 'RUNNING', label: 'Corsa' },
  { value: 'WALKING', label: 'Camminata' },
  { value: 'SPORTS', label: 'Sport' },
  { value: 'OTHER', label: 'Altro' },
];

export default function WorkoutsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const queryClient = useQueryClient();

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: workoutApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: workoutApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, workout }: { id: number; workout: Workout }) =>
      workoutApi.update(id, workout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      setEditingWorkout(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: workoutApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: workoutApi.toggleComplete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });

  return (
    <div className="pb-20 lg:pb-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Allenamenti</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Nuovo</span>
        </button>
      </div>

      {/* Form Modal */}
      {(showForm || editingWorkout) && (
        <WorkoutForm
          workout={editingWorkout}
          onSubmit={(workout) => {
            if (editingWorkout?.id) {
              updateMutation.mutate({ id: editingWorkout.id, workout });
            } else {
              createMutation.mutate(workout);
            }
          }}
          onClose={() => {
            setShowForm(false);
            setEditingWorkout(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Workouts List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Nessun allenamento registrato</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary mt-4"
          >
            Aggiungi il primo allenamento
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <div
              key={workout.id}
              className={`card flex items-center gap-4 ${
                workout.completed ? 'bg-green-50' : ''
              }`}
            >
              <button
                onClick={() => workout.id && toggleMutation.mutate(workout.id)}
                className="flex-shrink-0"
              >
                {workout.completed ? (
                  <CheckCircle className="text-green-600" size={24} />
                ) : (
                  <Circle className="text-gray-400" size={24} />
                )}
              </button>

              <div
                className="flex-1 cursor-pointer"
                onClick={() => setEditingWorkout(workout)}
              >
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium ${workout.completed ? 'line-through text-gray-500' : ''}`}>
                    {workout.title}
                  </h3>
                  <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
                    {workoutTypes.find((t) => t.value === workout.type)?.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {format(new Date(workout.date), 'EEEE d MMMM', { locale: it })}
                  {workout.startTime && ` • ${workout.startTime}`}
                </p>
              </div>

              <button
                onClick={() => workout.id && deleteMutation.mutate(workout.id)}
                className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkoutForm({
  workout,
  onSubmit,
  onClose,
  isLoading,
}: {
  workout: Workout | null;
  onSubmit: (workout: Workout) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Workout>(
    workout || {
      title: '',
      type: 'STRENGTH',
      date: format(new Date(), 'yyyy-MM-dd'),
      completed: false,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {workout ? 'Modifica Allenamento' : 'Nuovo Allenamento'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titolo
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as WorkoutType })}
                className="input"
              >
                {workoutTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data
              </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ora inizio
                </label>
                <input
                  type="time"
                  value={formData.startTime || ''}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ora fine
                </label>
                <input
                  type="time"
                  value={formData.endTime || ''}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isLoading}
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
