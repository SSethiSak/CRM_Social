import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { PlatformIcon } from '@/components/shared/PlatformIcon';
import { formatRelativeTime, truncateText } from '@/lib/formatters';
import { RefreshCw, MessageSquare, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function CommentsFeed() {
  const { comments, refreshComments } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshComments();
    setIsRefreshing(false);
  };

  const sortedComments = [...comments].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Comments Feed
          </h1>
          <p className="text-slate-400">
            View and monitor comments from all connected platforms
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:text-white"
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['facebook', 'instagram', 'linkedin'] as const).map((platform) => {
          const count = comments.filter(c => c.platform === platform).length;
          return (
            <Card key={platform} className="bg-slate-900/30 border-slate-800/30 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800/50">
                  <PlatformIcon platform={platform} size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-xs text-slate-500">comments</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comments List */}
      <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-800/50">
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            Recent Comments
            <span className="text-sm font-normal text-slate-500 ml-2">
              ({comments.length} total)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedComments.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No comments yet. Comments will appear here once your posts start getting engagement.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {sortedComments.map((comment, index) => (
                <div 
                  key={comment.id}
                  className={cn(
                    'flex items-start gap-4 p-4 hover:bg-slate-800/20 transition-colors',
                    index === 0 && 'bg-cyan-500/5'
                  )}
                >
                  {/* Avatar */}
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={comment.commenterAvatar} alt={comment.commenterName} />
                    <AvatarFallback className="bg-slate-700 text-white">
                      {comment.commenterName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{comment.commenterName}</span>
                      <div className="p-1 rounded bg-slate-800/50">
                        <PlatformIcon platform={comment.platform} size={14} />
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                      {index === 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm">
                      {truncateText(comment.text, 150)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
