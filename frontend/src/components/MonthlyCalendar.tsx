import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Dumbbell, Calendar, Target } from 'lucide-react';
import { eventApi } from '../services/api';
import type { Event } from '../types';

export default function MonthlyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: events = [] } = useQuery({
    queryKey: ['events', 'monthly', year, month],
    queryFn: () => eventApi.getMonthly(year, month),
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  const getEventsForDay = (date: Date): Event[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter((e) => e.date === dateStr);
  };

  return (
    <div>
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Calendario</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
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
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Month display */}
      <p className="text-xl font-semibold text-gray-700 mb-4 text-center lg:text-left">
        {format(currentDate, 'MMMM yyyy', { locale: it })}
      </p>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {weekDays.map((day) => (
            <div key={day} className="p-2 lg:p-3 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const workoutEvents = dayEvents.filter((e) => e.workoutPlanId != null);
            const goalEvents = dayEvents.filter((e) => e.workoutPlanId == null && e.goalId != null);
            const otherEvents = dayEvents.filter((e) => e.workoutPlanId == null && e.goalId == null);

            return (
              <div
                key={idx}
                className={`min-h-[80px] lg:min-h-[120px] p-1 lg:p-2 border-b border-r ${
                  !isCurrentMonth ? 'bg-gray-50' : ''
                } ${isToday(day) ? 'bg-primary-50' : ''}`}
              >
                <div
                  className={`text-sm lg:text-base font-medium mb-1 ${
                    isToday(day)
                      ? 'text-white bg-primary-500 w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center'
                      : !isCurrentMonth
                        ? 'text-gray-400'
                        : 'text-gray-700'
                  }`}
                >
                  {format(day, 'd')}
                </div>

                <div className="space-y-1">
                  {/* Workout events */}
                  {workoutEvents.slice(0, 2).map((event) => (
                    <EventBadge key={event.id} event={event} />
                  ))}

                  {/* Goal events */}
                  {goalEvents.slice(0, 2).map((event) => (
                    <EventBadge key={event.id} event={event} />
                  ))}

                  {/* Other events */}
                  {otherEvents.slice(0, 2).map((event) => (
                    <EventBadge key={event.id} event={event} />
                  ))}

                  {/* More indicator */}
                  {dayEvents.length > 4 && (
                    <div className="text-xs text-gray-500 pl-1">
                      +{dayEvents.length - 4} altri
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center lg:justify-start">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span>Allenamento</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 rounded bg-teal-500"></div>
          <span>Obiettivo</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 rounded bg-purple-500"></div>
          <span>Evento</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span>Completato</span>
        </div>
      </div>
    </div>
  );
}

function EventBadge({ event }: { event: Event }) {
  const isWorkout = event.workoutPlanId != null;
  const isGoal = event.goalId != null;

  const colorClass = event.completed
    ? 'bg-green-100 text-green-700'
    : isWorkout
      ? 'bg-blue-100 text-blue-700'
      : isGoal
        ? 'bg-teal-100 text-teal-700'
        : 'bg-purple-100 text-purple-700';

  const Icon = isWorkout ? Dumbbell : isGoal ? Target : Calendar;

  return (
    <div
      className={`text-xs truncate px-1 py-0.5 rounded flex items-center gap-1 ${colorClass}`}
      title={event.title}
    >
      <Icon size={10} className="flex-shrink-0" />
      <span className="truncate hidden lg:inline">{event.title}</span>
    </div>
  );
}
