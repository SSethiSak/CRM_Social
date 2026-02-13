import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { PlatformIcon } from '@/components/shared/PlatformIcon';
import { formatRelativeTime, truncateText } from '@/lib/formatters';
import { CalendarDays, ChevronLeft, ChevronRight, Heart, MessageSquare, Share2, ExternalLink } from 'lucide-react';
import type { Post } from '@/types/social';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function isToday(date: Date) {
  return isSameDay(date, new Date());
}

export function ContentCalendar() {
  const { posts } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Group posts by date string for quick lookup
  const postsByDate = useMemo(() => {
    const map: Record<string, Post[]> = {};
    posts.forEach(post => {
      const key = `${post.createdAt.getFullYear()}-${post.createdAt.getMonth()}-${post.createdAt.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(post);
    });
    return map;
  }, [posts]);

  const getPostsForDate = (date: Date): Post[] => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return postsByDate[key] || [];
  };

  const navigateMonth = (direction: -1 | 1) => {
    setCurrentDate(new Date(year, month + direction, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Build calendar grid
  const calendarDays: (Date | null)[] = [];
  // Leading empty cells
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d));
  }

  const selectedPosts = selectedDate ? getPostsForDate(selectedDate) : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Content Calendar
        </h1>
        <p className="text-slate-400">
          View your publishing history across all platforms
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
            {/* Month navigation */}
            <CardHeader className="border-b border-slate-800/50">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth(-1)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800/50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-white text-xl">
                    {MONTH_NAMES[month]} {year}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:text-white text-xs"
                  >
                    Today
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth(1)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800/50"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const dayPosts = getPostsForDate(date);
                  const hasPosts = dayPosts.length > 0;
                  const isSelected = selectedDate && isSameDay(date, selectedDate);
                  const isTodayDate = isToday(date);

                  // Collect unique platforms posted on this day
                  const platforms = [...new Set(dayPosts.flatMap(p => p.platforms))];
                  const hasSuccess = dayPosts.some(p => Object.values(p.status).some(s => s === 'success'));
                  const hasFailed = dayPosts.some(p => Object.values(p.status).some(s => s === 'failed'));

                  return (
                    <button
                      key={date.getDate()}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        'aspect-square rounded-lg p-1 flex flex-col items-center justify-start gap-0.5 transition-all duration-200 relative',
                        isSelected
                          ? 'bg-blue-500/20 border border-blue-500/50 ring-1 ring-blue-500/30'
                          : 'hover:bg-slate-800/50 border border-transparent',
                        isTodayDate && !isSelected && 'border-cyan-500/30',
                      )}
                    >
                      <span className={cn(
                        'text-sm font-medium',
                        isTodayDate ? 'text-cyan-400' : 'text-slate-300',
                        isSelected && 'text-white',
                      )}>
                        {date.getDate()}
                      </span>

                      {/* Platform dots */}
                      {hasPosts && (
                        <div className="flex items-center gap-0.5 flex-wrap justify-center">
                          {platforms.slice(0, 3).map(platform => (
                            <div key={platform} className="w-3.5 h-3.5">
                              <PlatformIcon platform={platform} size={14} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Post count badge */}
                      {dayPosts.length > 0 && (
                        <span className={cn(
                          'text-[10px] font-medium px-1 rounded-full',
                          hasSuccess && !hasFailed && 'bg-green-500/20 text-green-400',
                          hasFailed && !hasSuccess && 'bg-red-500/20 text-red-400',
                          hasSuccess && hasFailed && 'bg-yellow-500/20 text-yellow-400',
                        )}>
                          {dayPosts.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  Published
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  Failed
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  Today
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Day Detail */}
        <div>
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm sticky top-8">
            <CardHeader className="border-b border-slate-800/50">
              <CardTitle className="text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-cyan-400" />
                {selectedDate ? (
                  <span>
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                ) : (
                  <span>Select a day</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!selectedDate ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Click on a day to see posts
                </div>
              ) : selectedPosts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No posts on this day
                </div>
              ) : (
                <div className="divide-y divide-slate-800/50">
                  {selectedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map(post => (
                    <div key={post.id} className="p-4 space-y-3">
                      {/* Post content */}
                      <p className="text-white text-sm">
                        {truncateText(post.content, 120)}
                      </p>

                      {/* Image thumbnail */}
                      {post.imageUrl && (
                        <img
                          src={post.imageUrl}
                          alt=""
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      )}

                      {/* Platforms & status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.platforms.map(platform => {
                          const status = post.status[platform];
                          return (
                            <div
                              key={platform}
                              className={cn(
                                'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
                                status === 'success' && 'bg-green-500/10 text-green-400',
                                status === 'failed' && 'bg-red-500/10 text-red-400',
                                status === 'pending' && 'bg-yellow-500/10 text-yellow-400',
                              )}
                            >
                              <PlatformIcon platform={platform} size={12} />
                              {status}
                            </div>
                          );
                        })}
                      </div>

                      {/* Engagement */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-pink-400">
                          <Heart className="w-3 h-3" />
                          {post.likesCount}
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <MessageSquare className="w-3 h-3" />
                          {post.commentCount}
                        </div>
                        <div className="flex items-center gap-1 text-blue-400">
                          <Share2 className="w-3 h-3" />
                          {post.sharesCount}
                        </div>
                        <span className="text-slate-600 ml-auto">
                          {post.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* View links */}
                      {post.postUrls && Object.entries(post.postUrls).length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {Object.entries(post.postUrls).map(([platform, url]) => (
                            <Button
                              key={platform}
                              variant="ghost"
                              size="sm"
                              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 text-xs h-7 px-2"
                              onClick={() => window.open(url, '_blank')}
                            >
                              <PlatformIcon platform={platform as any} size={12} />
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
