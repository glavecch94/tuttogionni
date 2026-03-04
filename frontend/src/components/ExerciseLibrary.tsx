import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import { exerciseTemplateApi } from '../services/api';
import type { ExerciseTemplate, MuscleGroup } from '../types';

const MUSCLE_GROUPS: { key: MuscleGroup; label: string }[] = [
  { key: 'PETTO', label: 'Petto' },
  { key: 'SPALLE', label: 'Spalle' },
  { key: 'BICIPITI', label: 'Bicipiti' },
  { key: 'TRICIPITI', label: 'Tricipiti' },
  { key: 'DORSALI', label: 'Dorsali' },
  { key: 'GAMBE', label: 'Gambe' },
  { key: 'CORE', label: 'Core' },
];

export default function ExerciseLibrary() {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseTemplate | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<MuscleGroup>>(new Set(MUSCLE_GROUPS.map(g => g.key)));

  const { data: groupedExercises = {} as Record<MuscleGroup, ExerciseTemplate[]>, isLoading } = useQuery({
    queryKey: ['exerciseTemplates', 'grouped'],
    queryFn: exerciseTemplateApi.getGrouped,
  });

  const createMutation = useMutation({
    mutationFn: exerciseTemplateApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exerciseTemplates'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, template }: { id: number; template: ExerciseTemplate }) =>
      exerciseTemplateApi.update(id, template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exerciseTemplates'] });
      setEditingExercise(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: exerciseTemplateApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exerciseTemplates'] });
    },
  });

  const toggleGroup = (group: MuscleGroup) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const totalExercises = Object.values(groupedExercises).flat().length;

  return (
    <div className="card">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Dumbbell size={20} className="text-primary-600" />
          Libreria Esercizi
          <span className="text-sm font-normal text-gray-500">({totalExercises})</span>
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
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isExpanded && (
      <div className="mt-4">

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : totalExercises === 0 ? (
        <div className="text-center py-8">
          <Dumbbell size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nessun esercizio nella libreria</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary mt-3">
            Aggiungi il primo esercizio
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {MUSCLE_GROUPS.map((group) => {
            const exercises = groupedExercises[group.key] || [];
            if (exercises.length === 0) return null;

            const isGroupExpanded = expandedGroups.has(group.key);

            return (
              <div key={group.key} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium">{group.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{exercises.length}</span>
                    {isGroupExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {isGroupExpanded && (
                  <div className="divide-y">
                    {exercises.map((exercise: ExerciseTemplate) => (
                      <div
                        key={exercise.id}
                        className="p-3 flex items-center justify-between hover:bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{exercise.name}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {exercise.defaultSets} serie × {exercise.minReps}-{exercise.maxReps} rep
                            {exercise.initialWeight && ` • ${exercise.initialWeight}kg`}
                            {exercise.useTwoDumbbells && ' (x2)'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => setEditingExercise(exercise)}
                            className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => exercise.id && deleteMutation.mutate(exercise.id)}
                            className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>
      )}

      {/* Form Modal */}
      {(showForm || editingExercise) && (
        <ExerciseForm
          exercise={editingExercise}
          onSubmit={(template) => {
            if (editingExercise?.id) {
              updateMutation.mutate({ id: editingExercise.id, template });
            } else {
              createMutation.mutate(template);
            }
          }}
          onClose={() => {
            setShowForm(false);
            setEditingExercise(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

function ExerciseForm({
  exercise,
  onSubmit,
  onClose,
  isLoading,
}: {
  exercise: ExerciseTemplate | null;
  onSubmit: (template: ExerciseTemplate) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<ExerciseTemplate>(
    exercise || {
      name: '',
      muscleGroup: 'PETTO',
      defaultSets: 3,
      minReps: 8,
      maxReps: 12,
      useTwoDumbbells: false,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {exercise ? 'Modifica Esercizio' : 'Nuovo Esercizio'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome esercizio
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="es. Panca piana"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gruppo muscolare
              </label>
              <select
                value={formData.muscleGroup}
                onChange={(e) => setFormData({ ...formData, muscleGroup: e.target.value as MuscleGroup })}
                className="input"
                required
              >
                {MUSCLE_GROUPS.map((group) => (
                  <option key={group.key} value={group.key}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serie
                </label>
                <input
                  type="number"
                  value={formData.defaultSets}
                  onChange={(e) => setFormData({ ...formData, defaultSets: parseInt(e.target.value) || 1 })}
                  className="input text-center"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rep min
                </label>
                <input
                  type="number"
                  value={formData.minReps}
                  onChange={(e) => setFormData({ ...formData, minReps: parseInt(e.target.value) || 1 })}
                  className="input text-center"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rep max
                </label>
                <input
                  type="number"
                  value={formData.maxReps}
                  onChange={(e) => setFormData({ ...formData, maxReps: parseInt(e.target.value) || 1 })}
                  className="input text-center"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso iniziale (kg)
                </label>
                <input
                  type="number"
                  value={formData.initialWeight || ''}
                  onChange={(e) => setFormData({ ...formData, initialWeight: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="input"
                  step="0.5"
                  placeholder="Opzionale"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.useTwoDumbbells || false}
                    onChange={(e) => setFormData({ ...formData, useTwoDumbbells: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Due manubri (x2)</span>
                </label>
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
                rows={2}
                placeholder="Note opzionali sull'esecuzione"
              />
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
                {isLoading ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
