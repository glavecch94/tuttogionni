import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, Pencil, X, BookOpen, Film, Tv, Tag, Heart, Star,
} from 'lucide-react';
import { mediaApi } from '../services/api';
import type { MediaItem, MediaStatus } from '../types';

const PREDEFINED_TYPES = [
  { value: 'BOOK', label: 'Libri', icon: BookOpen },
  { value: 'MOVIE', label: 'Film', icon: Film },
  { value: 'TV_SERIES', label: 'Serie TV', icon: Tv },
];

const STATUS_OPTIONS: { value: MediaStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tutti' },
  { value: 'TO_CONSUME', label: 'Da vedere/leggere' },
  { value: 'IN_PROGRESS', label: 'In corso' },
  { value: 'COMPLETED', label: 'Completati' },
];

const STATUS_BADGES: Record<MediaStatus, { label: string; className: string }> = {
  TO_CONSUME: { label: 'Da fare', className: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'In corso', className: 'bg-yellow-100 text-yellow-700' },
  COMPLETED: { label: 'Completato', className: 'bg-green-100 text-green-700' },
};

function getTypeIcon(mediaType: string) {
  const found = PREDEFINED_TYPES.find((t) => t.value === mediaType);
  return found ? found.icon : Tag;
}

function getTypeLabel(mediaType: string) {
  const found = PREDEFINED_TYPES.find((t) => t.value === mediaType);
  return found ? found.label : mediaType;
}

export default function RaccoltaPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<MediaStatus | 'ALL'>('ALL');
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['media'],
    queryFn: mediaApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: mediaApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] }),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: mediaApi.toggleFavorite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] }),
  });

  // Derive custom types from data
  const customTypes = useMemo(() => {
    const predefinedValues = PREDEFINED_TYPES.map((t) => t.value);
    const allTypes = new Set(items.map((i) => i.mediaType));
    return Array.from(allTypes).filter((t) => !predefinedValues.includes(t));
  }, [items]);

  const allTypeFilters = [
    { value: 'ALL', label: 'Tutti' },
    ...PREDEFINED_TYPES.map((t) => ({ value: t.value, label: t.label })),
    ...customTypes.map((t) => ({ value: t, label: t })),
  ];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== 'ALL' && item.mediaType !== typeFilter) return false;
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      return true;
    });
  }, [items, typeFilter, statusFilter]);

  const handleAddCustomType = () => {
    const trimmed = newTypeName.trim();
    if (trimmed) {
      setTypeFilter(trimmed);
      setShowAddType(false);
      setNewTypeName('');
      // Open form with this type pre-selected
      setEditingItem(null);
      setShowForm(true);
    }
  };

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Raccolta</h1>
          <p className="text-gray-500 text-sm mt-1">Traccia libri, film, serie TV e altro</p>
        </div>
        <button
          onClick={() => { setEditingItem(null); setShowForm(true); }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Aggiungi</span>
        </button>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap gap-2 mt-4 mb-3">
        {allTypeFilters.map((t) => (
          <button
            key={t.value}
            onClick={() => setTypeFilter(t.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              typeFilter === t.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
        {!showAddType ? (
          <button
            onClick={() => setShowAddType(true)}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
            title="Aggiungi tipo"
          >
            <Plus size={16} />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomType()}
              placeholder="Nuovo tipo..."
              className="px-3 py-1 rounded-full text-sm border border-gray-300 focus:outline-none focus:border-primary-400 w-32"
              autoFocus
            />
            <button
              onClick={handleAddCustomType}
              disabled={!newTypeName.trim()}
              className="p-1 text-primary-500 hover:text-primary-700 disabled:text-gray-300"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => { setShowAddType(false); setNewTypeName(''); }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s.value
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Items List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8 card">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-3">
            {items.length === 0 ? 'Nessun elemento nella raccolta' : 'Nessun risultato per i filtri selezionati'}
          </p>
          {items.length === 0 && (
            <button
              onClick={() => { setEditingItem(null); setShowForm(true); }}
              className="btn btn-primary"
            >
              Aggiungi il primo elemento
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const TypeIcon = getTypeIcon(item.mediaType);
            const badge = STATUS_BADGES[item.status];
            return (
              <div key={item.id} className="card flex items-center gap-3">
                <TypeIcon size={20} className="text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setEditingItem(item); setShowForm(true); }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium truncate">{item.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{getTypeLabel(item.mediaType)}</span>
                    {item.rating != null && item.rating > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-yellow-500">
                        <Star size={12} className="fill-current" />
                        {item.rating}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => item.id && toggleFavoriteMutation.mutate(item.id)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <Heart
                      size={16}
                      className={item.favorite ? 'text-red-500 fill-current' : 'text-gray-300'}
                    />
                  </button>
                  <button
                    onClick={() => { setEditingItem(item); setShowForm(true); }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => item.id && deleteMutation.mutate(item.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <MediaFormModal
          item={editingItem}
          defaultType={typeFilter !== 'ALL' ? typeFilter : undefined}
          customTypes={customTypes}
          onClose={() => { setShowForm(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
}

// ---------- MediaFormModal ----------
function MediaFormModal({
  item,
  defaultType,
  customTypes,
  onClose,
}: {
  item: MediaItem | null;
  defaultType?: string;
  customTypes: string[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!item;

  const [formData, setFormData] = useState<MediaItem>(
    item
      ? { ...item }
      : {
          title: '',
          mediaType: defaultType || 'BOOK',
          status: 'TO_CONSUME',
          rating: undefined,
          notes: '',
          favorite: false,
        }
  );

  const [customType, setCustomType] = useState('');
  const [showCustomType, setShowCustomType] = useState(false);

  const createMutation = useMutation({
    mutationFn: mediaApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MediaItem }) => mediaApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = showCustomType && customType.trim()
      ? { ...formData, mediaType: customType.trim() }
      : formData;

    if (isEdit && item?.id) {
      updateMutation.mutate({ id: item.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const allSelectTypes = [
    ...PREDEFINED_TYPES.map((t) => ({ value: t.value, label: t.label })),
    ...customTypes.map((t) => ({ value: t, label: t })),
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {isEdit ? 'Modifica elemento' : 'Nuovo elemento'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
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

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              {!showCustomType ? (
                <div className="space-y-2">
                  <select
                    value={formData.mediaType}
                    onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                    className="input"
                  >
                    {allSelectTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCustomType(true)}
                    className="text-sm text-primary-500 hover:text-primary-700"
                  >
                    + Tipo personalizzato
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="input"
                    placeholder="es. Podcast, Manga..."
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => { setShowCustomType(false); setCustomType(''); }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Usa tipo predefinito
                  </button>
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MediaStatus })}
                className="input"
              >
                <option value="TO_CONSUME">Da vedere/leggere</option>
                <option value="IN_PROGRESS">In corso</option>
                <option value="COMPLETED">Completato</option>
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valutazione</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        rating: formData.rating === star ? undefined : star,
                      })
                    }
                    className="p-1"
                  >
                    <Star
                      size={24}
                      className={
                        formData.rating != null && star <= formData.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }
                    />
                  </button>
                ))}
                {formData.rating != null && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: undefined })}
                    className="ml-2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    Rimuovi
                  </button>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input"
                rows={3}
                placeholder="Opzionale"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
                Annulla
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {isLoading ? 'Salvataggio...' : isEdit ? 'Salva' : 'Aggiungi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
