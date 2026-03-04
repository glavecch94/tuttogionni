import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isToday } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Dumbbell, Calendar, Target } from 'lucide-react';
import { workoutApi, eventApi } from '../services/api';
import type { Workout, Event } from '../types';

interface WeeklyViewProps {
  compact?: boolean;
}

export default function WeeklyView({ compact = false }: WeeklyViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const startDateStr = format(weekStart, 'yyyy-MM-dd');
  const endDateStr = format(weekEnd, 'yyyy-MM-dd');

  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts', 'range', startDateStr, endDateStr],
    queryFn: () => workoutApi.getByDateRange(startDateStr, endDateStr),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events', 'range', startDateStr, endDateStr],
    queryFn: () => eventApi.getByDateRange(startDateStr, endDateStr),
  });

  const getItemsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayWorkouts = workouts.filter((w) => w.date === dateStr);
    const dayEvents = events.filter((e) => e.date === dateStr);
    return { workouts: dayWorkouts, events: dayEvents };
  };

  return (
    <div>
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={`font-semibold text-gray-900 ${compact ? 'text-lg' : 'text-2xl lg:text-3xl'}`}>
          Vista Settimanale
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft size={compact ? 20 : 24} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="btn btn-secondary text-sm"
          >
            Oggi
          </button>
          <button
            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight size={compact ? 20 : 24} />
          </button>
        </div>
      </div>

      {/* Week range display */}
      <p className="text-gray-500 mb-4 text-sm">
        {format(weekStart, 'd MMMM', { locale: it })} - {format(weekEnd, 'd MMMM yyyy', { locale: it })}
      </p>

      {/* Desktop view - horizontal calendar */}
      <div className={`hidden ${compact ? 'md:grid' : 'lg:grid'} grid-cols-7 gap-3`}>
        {days.map((day) => {
          const { workouts: dayWorkouts, events: dayEvents } = getItemsForDay(day);
          const hasItems = dayWorkouts.length > 0 || dayEvents.length > 0;

          return (
            <div
              key={day.toISOString()}
              className={`bg-white rounded-xl p-3 shadow-sm border ${compact ? 'min-h-[120px]' : 'min-h-[180px]'} ${isToday(day) ? 'ring-2 ring-primary-500' : ''}`}
            >
              <div className={`text-center mb-2 pb-2 border-b ${isToday(day) ? 'text-primary-600' : ''}`}>
                <p className="text-xs text-gray-500">
                  {format(day, 'EEE', { locale: it })}
                </p>
                <p className={`text-lg font-bold ${isToday(day) ? 'text-primary-600' : ''}`}>
                  {format(day, 'd')}
                </p>
              </div>

              {!hasItems ? (
                <p className="text-xs text-gray-400 text-center">-</p>
              ) : (
                <div className="space-y-1">
                  {dayWorkouts.map((workout) => (
                    <WorkoutItem key={workout.id} workout={workout} compact />
                  ))}
                  {dayEvents.map((event) => (
                    <EventItem key={event.id} event={event} compact />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile view - vertical list */}
      <div className={`${compact ? 'md:hidden' : 'lg:hidden'} space-y-3`}>
        {days.map((day) => {
          const { workouts: dayWorkouts, events: dayEvents } = getItemsForDay(day);
          const hasItems = dayWorkouts.length > 0 || dayEvents.length > 0;

          return (
            <div
              key={day.toISOString()}
              className={`bg-white rounded-xl p-3 shadow-sm border ${isToday(day) ? 'ring-2 ring-primary-500' : ''}`}
            >
              <div className={`flex items-center gap-3 mb-2 pb-2 border-b ${isToday(day) ? 'text-primary-600' : ''}`}>
                <div className={`text-center w-10 ${isToday(day) ? 'text-primary-600' : ''}`}>
                  <p className="text-xs text-gray-500 uppercase">
                    {format(day, 'EEE', { locale: it })}
                  </p>
                  <p className="text-lg font-bold">{format(day, 'd')}</p>
                </div>
                <p className="text-gray-500 text-sm">{format(day, 'MMMM', { locale: it })}</p>
              </div>

              {!hasItems ? (
                <p className="text-sm text-gray-400">Nessuna attività</p>
              ) : (
                <div className="space-y-1">
                  {dayWorkouts.map((workout) => (
                    <WorkoutItem key={workout.id} workout={workout} />
                  ))}
                  {dayEvents.map((event) => (
                    <EventItem key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkoutItem({ workout, compact = false }: { workout: Workout; compact?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg ${
        workout.completed ? 'bg-green-50' : 'bg-blue-50'
      }`}
    >
      <Dumbbell size={compact ? 12 : 14} className="text-blue-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${compact ? 'text-xs' : 'text-sm'} ${workout.completed ? 'line-through text-gray-500' : ''}`}>
          {workout.title}
        </p>
      </div>
    </div>
  );
}

function EventItem({ event, compact = false }: { event: Event; compact?: boolean }) {
  const isWorkoutEvent = event.workoutPlanId != null;
  const isGoalEvent = event.goalId != null;

  const bgClass = event.completed
    ? 'bg-green-50'
    : isWorkoutEvent
      ? 'bg-blue-50'
      : isGoalEvent
        ? 'bg-teal-50'
        : 'bg-purple-50';

  const iconClass = isWorkoutEvent
    ? 'text-blue-600'
    : isGoalEvent
      ? 'text-teal-600'
      : 'text-purple-600';

  const Icon = isWorkoutEvent ? Dumbbell : isGoalEvent ? Target : Calendar;

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${bgClass}`}>
      <Icon size={compact ? 12 : 14} className={`${iconClass} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${compact ? 'text-xs' : 'text-sm'} ${event.completed ? 'line-through text-gray-500' : ''}`}>
          {event.title}
        </p>
      </div>
    </div>
  );
}
