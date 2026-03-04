export interface User {
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export type WorkoutType =
  | 'STRENGTH'
  | 'CARDIO'
  | 'FLEXIBILITY'
  | 'HIIT'
  | 'YOGA'
  | 'SWIMMING'
  | 'CYCLING'
  | 'RUNNING'
  | 'WALKING'
  | 'SPORTS'
  | 'OTHER';

export interface Workout {
  id?: number;
  title: string;
  description?: string;
  type: WorkoutType;
  date: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  caloriesBurned?: number;
  notes?: string;
  completed: boolean;
}

export type EventCategory =
  | 'WORK'
  | 'PERSONAL'
  | 'HEALTH'
  | 'SOCIAL'
  | 'EDUCATION'
  | 'FINANCE'
  | 'TRAVEL'
  | 'WORKOUT'
  | 'OTHER';

export type RecurrencePattern =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'YEARLY';

export interface Event {
  id?: number;
  title: string;
  description?: string;
  category: EventCategory;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  recurring: boolean;
  recurrencePattern?: RecurrencePattern;
  color?: string;
  completed: boolean;
  skipped?: boolean;
  workoutPlanId?: number;
  workoutDayId?: number;
  workoutPlanName?: string;
  workoutDayName?: string;
  goalId?: number;
  goalName?: string;
}

// Goals
export type GoalCategory =
  | 'SALUTE'
  | 'BENESSERE'
  | 'STUDIO_FORMAZIONE'
  | 'PRODUTTIVITA'
  | 'FINANZA'
  | 'SOCIALE'
  | 'CRESCITA_PERSONALE'
  | 'INTRATTENIMENTO'
  | 'ALTRO';

export type GoalFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface Goal {
  id?: number;
  name: string;
  description?: string;
  category: GoalCategory;
  frequency: GoalFrequency;
  frequencyConfig?: string[];
  scheduledTime?: string;
  color?: string;
  icon?: string;
  active?: boolean;
  preconfiguredKey?: string;
}

// Muscle Groups
export type MuscleGroup = 'PETTO' | 'SPALLE' | 'BICIPITI' | 'TRICIPITI' | 'DORSALI' | 'GAMBE' | 'CORE';

// Exercise Template (Library)
export interface ExerciseTemplate {
  id?: number;
  name: string;
  muscleGroup: MuscleGroup;
  defaultSets: number;
  minReps: number;
  maxReps: number;
  initialWeight?: number;
  useTwoDumbbells?: boolean;
  notes?: string;
}

// Exercise Feedback / Progression
export type Difficulty = 'LIGHT' | 'NEUTRAL' | 'HEAVY';

export interface ExerciseFeedback {
  workoutLogId: number;
  exerciseName: string;
  workoutPlanId: number;
  difficulty: Difficulty;
  weightUsed?: number;
  setsCompleted?: number;
  repsCompleted?: number;
}

// Workout Plans
export interface Exercise {
  id?: number;
  exerciseTemplateId?: number;
  name: string;
  muscleGroup?: MuscleGroup;
  sets: number;
  reps: number;
  minReps?: number;
  maxReps?: number;
  weight?: number;
  useTwoDumbbells?: boolean;
  restSeconds?: number;
  notes?: string;
  exerciseOrder?: number;
}

export interface WorkoutDay {
  id?: number;
  dayNumber: number;
  name: string;
  description?: string;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  id?: number;
  name: string;
  description?: string;
  workoutsPerWeek: number;
  isActive?: boolean;
  currentDayIndex?: number;
  workoutDays: WorkoutDay[];
  trainingDays?: string[];
  trainingTime?: string;
  autoProgression?: boolean;
}

export interface WorkoutLog {
  id: number;
  workoutPlanId: number;
  workoutPlanName: string;
  workoutDayId: number;
  workoutDayName: string;
  workoutDayNumber: number;
  date: string;
  completed: boolean;
  notes?: string;
}

export interface TodayWorkout {
  workoutPlanId: number;
  workoutPlanName: string;
  workoutDayId: number;
  workoutDayNumber: number;
  workoutDayName: string;
  workoutDayDescription?: string;
  exercises: Exercise[];
  alreadyCompletedToday: boolean;
  todayLogId?: number;
  autoProgression?: boolean;
}

export interface UpdatePreviewResponse {
  oldDayCount: number;
  newDayCount: number;
  cycleWillChange: boolean;
  nextDayNumber: number;
  lastCompletedDayName: string | null;
  lastCompletedDate: string | null;
  planIsActive: boolean;
}

// Media Tracking
export type MediaStatus = 'TO_CONSUME' | 'IN_PROGRESS' | 'COMPLETED';

export interface MediaItem {
  id?: number;
  title: string;
  mediaType: string;
  status: MediaStatus;
  rating?: number;
  notes?: string;
  favorite?: boolean;
}
