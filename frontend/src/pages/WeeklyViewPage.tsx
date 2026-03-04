import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isToday } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Dumbbell, Calendar } from 'lucide-react';
import { workoutApi, eventApi } from '../services/api';
import type { Workout, Event } from '../types';

export default function WeeklyViewPage() {
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
    <div className="pb-20 lg:pb-0">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Vista Settimanale</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft size={24} />
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
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Week range display */}
      <p className="text-gray-500 mb-6 text-center lg:text-left">
        {format(weekStart, 'd MMMM', { locale: it })} - {format(weekEnd, 'd MMMM yyyy', { locale: it })}
      </p>

      {/* Desktop view - horizontal calendar */}
      <div className="hidden lg:grid grid-cols-7 gap-4">
        {days.map((day) => {
          const { workouts: dayWorkouts, events: dayEvents } = getItemsForDay(day);
          const hasItems = dayWorkouts.length > 0 || dayEvents.length > 0;

          return (
            <div
              key={day.toISOString()}
              className={`card min-h-[200px] ${isToday(day) ? 'ring-2 ring-primary-500' : ''}`}
            >
              <div className={`text-center mb-3 pb-2 border-b ${isToday(day) ? 'text-primary-600' : ''}`}>
                <p className="text-sm text-gray-500">
                  {format(day, 'EEEE', { locale: it })}
                </p>
                <p className={`text-2xl font-bold ${isToday(day) ? 'text-primary-600' : ''}`}>
                  {format(day, 'd')}
                </p>
              </div>

              {!hasItems ? (
                <p className="text-sm text-gray-400 text-center">Nessuna attività</p>
              ) : (
                <div className="space-y-2">
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
      <div className="lg:hidden space-y-4">
        {days.map((day) => {
          const { workouts: dayWorkouts, events: dayEvents } = getItemsForDay(day);
          const hasItems = dayWorkouts.length > 0 || dayEvents.length > 0;

          return (
            <div
              key={day.toISOString()}
              className={`card ${isToday(day) ? 'ring-2 ring-primary-500' : ''}`}
            >
              <div className={`flex items-center gap-3 mb-3 pb-2 border-b ${isToday(day) ? 'text-primary-600' : ''}`}>
                <div className={`text-center w-12 ${isToday(day) ? 'text-primary-600' : ''}`}>
                  <p className="text-xs text-gray-500 uppercase">
                    {format(day, 'EEE', { locale: it })}
                  </p>
                  <p className="text-xl font-bold">{format(day, 'd')}</p>
                </div>
                <p className="text-gray-500">{format(day, 'MMMM', { locale: it })}</p>
              </div>

              {!hasItems ? (
                <p className="text-sm text-gray-400">Nessuna attività programmata</p>
              ) : (
                <div className="space-y-2">
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
      <Dumbbell size={compact ? 14 : 16} className="text-blue-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${compact ? 'text-xs' : 'text-sm'} ${workout.completed ? 'line-through text-gray-500' : ''}`}>
          {workout.title}
        </p>
        {workout.startTime && !compact && (
          <p className="text-xs text-gray-500">{workout.startTime}</p>
        )}
      </div>
    </div>
  );
}

function EventItem({ event, compact = false }: { event: Event; compact?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg ${
        event.completed ? 'bg-green-50' : 'bg-purple-50'
      }`}
    >
      <Calendar size={compact ? 14 : 16} className="text-purple-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${compact ? 'text-xs' : 'text-sm'} ${event.completed ? 'line-through text-gray-500' : ''}`}>
          {event.title}
        </p>
        {event.startTime && !compact && (
          <p className="text-xs text-gray-500">{event.startTime}</p>
        )}
      </div>
    </div>
  );
}
