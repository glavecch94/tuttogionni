import axios from 'axios';
import type { AuthResponse, LoginRequest, RegisterRequest, Workout, Event, WorkoutPlan, WorkoutLog, TodayWorkout, UpdatePreviewResponse, ExerciseTemplate, MuscleGroup, Goal, ExerciseFeedback, MediaItem } from '../types';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },
};

// Workouts
export const workoutApi = {
  getAll: async (): Promise<Workout[]> => {
    const response = await api.get<Workout[]>('/workouts');
    return response.data;
  },
  getById: async (id: number): Promise<Workout> => {
    const response = await api.get<Workout>(`/workouts/${id}`);
    return response.data;
  },
  getWeekly: async (date?: string): Promise<Workout[]> => {
    const params = date ? { date } : {};
    const response = await api.get<Workout[]>('/workouts/weekly', { params });
    return response.data;
  },
  getByDateRange: async (startDate: string, endDate: string): Promise<Workout[]> => {
    const response = await api.get<Workout[]>('/workouts/range', {
      params: { startDate, endDate },
    });
    return response.data;
  },
  create: async (workout: Workout): Promise<Workout> => {
    const response = await api.post<Workout>('/workouts', workout);
    return response.data;
  },
  update: async (id: number, workout: Workout): Promise<Workout> => {
    const response = await api.put<Workout>(`/workouts/${id}`, workout);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/workouts/${id}`);
  },
  toggleComplete: async (id: number): Promise<Workout> => {
    const response = await api.patch<Workout>(`/workouts/${id}/toggle-complete`);
    return response.data;
  },
};

// Events
export const eventApi = {
  getAll: async (): Promise<Event[]> => {
    const response = await api.get<Event[]>('/events');
    return response.data;
  },
  getById: async (id: number): Promise<Event> => {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },
  getWeekly: async (date?: string): Promise<Event[]> => {
    const params = date ? { date } : {};
    const response = await api.get<Event[]>('/events/weekly', { params });
    return response.data;
  },
  getByDateRange: async (startDate: string, endDate: string): Promise<Event[]> => {
    const response = await api.get<Event[]>('/events/range', {
      params: { startDate, endDate },
    });
    return response.data;
  },
  getMonthly: async (year: number, month: number): Promise<Event[]> => {
    const response = await api.get<Event[]>('/events/monthly', {
      params: { year, month },
    });
    return response.data;
  },
  create: async (event: Event): Promise<Event> => {
    const response = await api.post<Event>('/events', event);
    return response.data;
  },
  update: async (id: number, event: Event): Promise<Event> => {
    const response = await api.put<Event>(`/events/${id}`, event);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/events/${id}`);
  },
  toggleComplete: async (id: number): Promise<Event> => {
    const response = await api.patch<Event>(`/events/${id}/toggle-complete`);
    return response.data;
  },
  skipEvent: async (id: number): Promise<Event> => {
    const response = await api.patch<Event>(`/events/${id}/skip`);
    return response.data;
  },
  rescheduleEvent: async (id: number, newDate: string, newTime?: string): Promise<Event> => {
    const params: Record<string, string> = { newDate };
    if (newTime) params.newTime = newTime;
    const response = await api.patch<Event>(`/events/${id}/reschedule`, null, { params });
    return response.data;
  },
};

// Goals
export const goalApi = {
  getAll: async (): Promise<Goal[]> => {
    const response = await api.get<Goal[]>('/goals');
    return response.data;
  },
  getById: async (id: number): Promise<Goal> => {
    const response = await api.get<Goal>(`/goals/${id}`);
    return response.data;
  },
  create: async (goal: Goal): Promise<Goal> => {
    const response = await api.post<Goal>('/goals', goal);
    return response.data;
  },
  update: async (id: number, goal: Goal): Promise<Goal> => {
    const response = await api.put<Goal>(`/goals/${id}`, goal);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/goals/${id}`);
  },
  activate: async (id: number): Promise<Goal> => {
    const response = await api.post<Goal>(`/goals/${id}/activate`);
    return response.data;
  },
  deactivate: async (id: number): Promise<Goal> => {
    const response = await api.post<Goal>(`/goals/${id}/deactivate`);
    return response.data;
  },
};

// Workout Plans
export const workoutPlanApi = {
  getAll: async (): Promise<WorkoutPlan[]> => {
    const response = await api.get<WorkoutPlan[]>('/workout-plans');
    return response.data;
  },
  getById: async (id: number): Promise<WorkoutPlan> => {
    const response = await api.get<WorkoutPlan>(`/workout-plans/${id}`);
    return response.data;
  },
  getActive: async (): Promise<WorkoutPlan | null> => {
    try {
      const response = await api.get<WorkoutPlan>('/workout-plans/active');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 204) {
        return null;
      }
      throw error;
    }
  },
  create: async (plan: WorkoutPlan): Promise<WorkoutPlan> => {
    const response = await api.post<WorkoutPlan>('/workout-plans', plan);
    return response.data;
  },
  update: async (id: number, plan: WorkoutPlan, resetCycle?: boolean, effectiveDate?: string): Promise<WorkoutPlan> => {
    const params: Record<string, string | boolean> = {};
    if (resetCycle !== undefined) params.resetCycle = resetCycle;
    if (effectiveDate) params.effectiveDate = effectiveDate;
    const response = await api.put<WorkoutPlan>(`/workout-plans/${id}`, plan, { params });
    return response.data;
  },
  getUpdatePreview: async (id: number, plan: WorkoutPlan): Promise<UpdatePreviewResponse> => {
    const response = await api.post<UpdatePreviewResponse>(`/workout-plans/${id}/update-preview`, plan);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/workout-plans/${id}`);
  },
  activate: async (id: number, startDate?: string, startDayIndex?: number): Promise<WorkoutPlan> => {
    const params: Record<string, string | number> = {};
    if (startDate) params.startDate = startDate;
    if (startDayIndex !== undefined) params.startDayIndex = startDayIndex;
    const response = await api.post<WorkoutPlan>(`/workout-plans/${id}/activate`, null, { params });
    return response.data;
  },
  deactivate: async (id: number): Promise<void> => {
    await api.post(`/workout-plans/${id}/deactivate`);
  },
  getTodayWorkout: async (): Promise<TodayWorkout | null> => {
    try {
      const response = await api.get<TodayWorkout>('/workout-plans/today');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 204) {
        return null;
      }
      throw error;
    }
  },
  startTodayWorkout: async (): Promise<WorkoutLog> => {
    const response = await api.post<WorkoutLog>('/workout-plans/today/start');
    return response.data;
  },
  completeWorkout: async (logId: number, notes?: string): Promise<WorkoutLog> => {
    const response = await api.post<WorkoutLog>(`/workout-plans/logs/${logId}/complete`, { notes });
    return response.data;
  },
  getHistory: async (planId?: number): Promise<WorkoutLog[]> => {
    const params = planId ? { planId } : {};
    const response = await api.get<WorkoutLog[]>('/workout-plans/history', { params });
    return response.data;
  },
  regenerateEvents: async (id: number): Promise<void> => {
    await api.post(`/workout-plans/${id}/regenerate-events`);
  },
  clone: async (id: number): Promise<WorkoutPlan> => {
    const response = await api.post<WorkoutPlan>(`/workout-plans/${id}/clone`);
    return response.data;
  },
  submitFeedback: async (feedback: ExerciseFeedback): Promise<void> => {
    await api.post('/workout-plans/feedback', feedback);
  },
  nextWorkoutToday: async (dayIndex?: number): Promise<WorkoutLog> => {
    const response = await api.post<WorkoutLog>('/workout-plans/today/next', null, {
      params: dayIndex !== undefined ? { dayIndex } : {},
    });
    return response.data;
  },
  skipTodayWorkout: async (): Promise<void> => {
    await api.post('/workout-plans/today/skip');
  },
};

// Media
export const mediaApi = {
  getAll: async (): Promise<MediaItem[]> => {
    const response = await api.get<MediaItem[]>('/media');
    return response.data;
  },
  getById: async (id: number): Promise<MediaItem> => {
    const response = await api.get<MediaItem>(`/media/${id}`);
    return response.data;
  },
  create: async (item: MediaItem): Promise<MediaItem> => {
    const response = await api.post<MediaItem>('/media', item);
    return response.data;
  },
  update: async (id: number, item: MediaItem): Promise<MediaItem> => {
    const response = await api.put<MediaItem>(`/media/${id}`, item);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/media/${id}`);
  },
  toggleFavorite: async (id: number): Promise<MediaItem> => {
    const response = await api.patch<MediaItem>(`/media/${id}/favorite`);
    return response.data;
  },
};

// Exercise Templates (Library)
export const exerciseTemplateApi = {
  getAll: async (): Promise<ExerciseTemplate[]> => {
    const response = await api.get<ExerciseTemplate[]>('/exercise-templates');
    return response.data;
  },
  getGrouped: async (): Promise<Record<MuscleGroup, ExerciseTemplate[]>> => {
    const response = await api.get<Record<MuscleGroup, ExerciseTemplate[]>>('/exercise-templates/grouped');
    return response.data;
  },
  getByMuscleGroup: async (muscleGroup: MuscleGroup): Promise<ExerciseTemplate[]> => {
    const response = await api.get<ExerciseTemplate[]>(`/exercise-templates/muscle-group/${muscleGroup}`);
    return response.data;
  },
  getById: async (id: number): Promise<ExerciseTemplate> => {
    const response = await api.get<ExerciseTemplate>(`/exercise-templates/${id}`);
    return response.data;
  },
  create: async (template: ExerciseTemplate): Promise<ExerciseTemplate> => {
    const response = await api.post<ExerciseTemplate>('/exercise-templates', template);
    return response.data;
  },
  update: async (id: number, template: ExerciseTemplate): Promise<ExerciseTemplate> => {
    const response = await api.put<ExerciseTemplate>(`/exercise-templates/${id}`, template);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/exercise-templates/${id}`);
  },
  getMuscleGroups: async (): Promise<MuscleGroup[]> => {
    const response = await api.get<MuscleGroup[]>('/exercise-templates/muscle-groups');
    return response.data;
  },
};
