import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { CheckCircle, SkipForward } from 'lucide-react';
import { eventApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import WeeklyView from '../components/WeeklyView';

export default function DashboardPage() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: weeklyEvents = [] } = useQuery({
    queryKey: ['events', 'weekly'],
    queryFn: () => eventApi.getWeekly(),
  });

  // Filter events for today, excluding workout events, sorted by time
  const todayEvents = weeklyEvents
    .filter((e) => e.date === today && e.workoutPlanId == null)
    .sort((a, b) => {
      // Events with startTime come first, sorted by time
      if (a.startTime && b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      if (a.startTime) return -1;
      if (b.startTime) return 1;
      return 0;
    });

  return (
    <div className="pb-20 lg:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Ciao, {user?.name}!
        </h1>
        <p className="text-gray-500 mt-1">
          {format(new Date(), "EEEE d MMMM yyyy", { locale: it })}
        </p>
      </div>

      {/* Today's Events */}
      {todayEvents.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Impegni di oggi</h2>
          <div className="space-y-2">
            {todayEvents.map((event) => (
              <div
                key={event.id}
                className={`p-3 rounded-lg border ${
                  event.skipped
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : event.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium truncate ${
                      event.skipped
                        ? 'line-through text-gray-400'
                        : event.completed
                          ? 'line-through text-gray-500'
                          : ''
                    }`}>
                      {event.title}
                    </p>
                    {event.skipped ? (
                      <p className="text-xs text-gray-400">Saltato</p>
                    ) : event.startTime ? (
                      <p className="text-sm text-gray-500">
                        {event.startTime.substring(0, 5)}
                        {event.endTime && ` - ${event.endTime.substring(0, 5)}`}
                      </p>
                    ) : null}
                  </div>
                  {event.skipped ? (
                    <SkipForward className="text-gray-400" size={20} />
                  ) : event.completed ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly View */}
      <div className="card">
        <WeeklyView compact />
      </div>
    </div>
  );
}
