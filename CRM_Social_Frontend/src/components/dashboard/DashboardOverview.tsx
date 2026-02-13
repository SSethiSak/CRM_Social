import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { Link2, FileText, MessageSquare, TrendingUp, Activity, Heart, Share2, RefreshCw, Loader2, Send, UserPlus, AlertCircle } from 'lucide-react';
import { PlatformIcon, platformGlowColors } from '@/components/shared/PlatformIcon';
import { formatRelativeTime } from '@/lib/formatters';
import type { Platform } from '@/types/social';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  glowColor?: string;
}

function MetricCard({ title, value, subtitle, icon, glowColor = 'shadow-blue-500/20' }: MetricCardProps) {
  return (
    <Card className={`relative bg-slate-900/50 border-slate-800/50 backdrop-blur-sm overflow-hidden group hover:border-slate-700/50 transition-all duration-300 shadow-xl ${glowColor}`}>
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-slate-800/50 text-cyan-400">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardOverview() {
  const { connectedAccounts, posts, comments, refreshComments } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const connectedCount = connectedAccounts.filter(a => a.isConnected).length;
  const totalComments = comments.length;
  const totalPosts = posts.length;
  const successfulPosts = posts.filter(p => 
    Object.values(p.status).some(s => s === 'success')
  ).length;

  const totalLikes = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
  const totalShares = posts.reduce((sum, p) => sum + (p.sharesCount || 0), 0);
  const totalEngagement = totalLikes + totalComments + totalShares;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshComments();
    setIsRefreshing(false);
  };

  const recentActivity = useMemo(() => {
    const activities: { action: string; detail?: string; platform: Platform; time: Date; type: 'post' | 'comment' | 'account' | 'failed' }[] = [];

    // Add post activities
    posts.forEach(post => {
      post.platforms.forEach(platform => {
        const status = post.status[platform];
        if (status === 'success') {
          activities.push({
            action: 'Post published',
            detail: post.content.length > 50 ? post.content.slice(0, 50) + '...' : post.content,
            platform,
            time: post.createdAt,
            type: 'post',
          });
        } else if (status === 'failed') {
          activities.push({
            action: 'Post failed',
            detail: post.content.length > 50 ? post.content.slice(0, 50) + '...' : post.content,
            platform,
            time: post.createdAt,
            type: 'failed',
          });
        }
      });
    });

    // Add comment activities
    comments.forEach(comment => {
      activities.push({
        action: `Comment from ${comment.commenterName}`,
        detail: comment.text.length > 50 ? comment.text.slice(0, 50) + '...' : comment.text,
        platform: comment.platform,
        time: comment.createdAt,
        type: 'comment',
      });
    });

    // Add connected account activities
    connectedAccounts.filter(a => a.isConnected && a.lastActivity).forEach(account => {
      activities.push({
        action: `${account.accountName} connected`,
        platform: account.platform,
        time: account.lastActivity!,
        type: 'account',
      });
    });

    // Sort by time, most recent first
    return activities.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10);
  }, [posts, comments, connectedAccounts]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post': return <Send className="w-4 h-4 text-green-400" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      case 'account': return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActivityDot = (type: string) => {
    switch (type) {
      case 'post': return 'bg-green-400';
      case 'comment': return 'bg-cyan-400';
      case 'account': return 'bg-blue-400';
      case 'failed': return 'bg-red-400';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-slate-400">
            Monitor your social media presence across all platforms
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
          Refresh Engagement
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Connected Accounts"
          value={`${connectedCount}/${connectedAccounts.length}`}
          subtitle="Active connections"
          icon={<Link2 className="w-5 h-5" />}
          glowColor="shadow-xl shadow-blue-500/10"
        />
        <MetricCard
          title="Posts Published"
          value={totalPosts}
          subtitle={`${successfulPosts} successful`}
          icon={<FileText className="w-5 h-5" />}
          glowColor="shadow-xl shadow-cyan-500/10"
        />
        <MetricCard
          title="Reactions"
          value={totalLikes}
          subtitle="Likes & reactions"
          icon={<Heart className="w-5 h-5" />}
          glowColor="shadow-xl shadow-pink-500/10"
        />
        <MetricCard
          title="Comments"
          value={totalComments}
          subtitle="Across all platforms"
          icon={<MessageSquare className="w-5 h-5" />}
          glowColor="shadow-xl shadow-purple-500/10"
        />
        <MetricCard
          title="Total Engagement"
          value={totalEngagement}
          subtitle={`${totalLikes} reactions · ${totalShares} shares`}
          icon={<TrendingUp className="w-5 h-5" />}
          glowColor="shadow-xl shadow-green-500/10"
        />
      </div>

      {/* Platform Status & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Status */}
        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Link2 className="w-5 h-5 text-cyan-400" />
              Platform Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {connectedAccounts.map((account) => (
              <div 
                key={account.id} 
                className={`flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border ${account.isConnected ? 'border-slate-700/50' : 'border-slate-800/30'} transition-all duration-200 ${account.isConnected ? platformGlowColors[account.platform] : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${account.isConnected ? 'bg-slate-700/50' : 'bg-slate-800/50'}`}>
                    <PlatformIcon platform={account.platform} size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{account.accountName}</p>
                    <p className="text-xs text-slate-500">
                      {account.isConnected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${account.isConnected ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-slate-600'}`} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No activity yet. Create a post to get started.
              </div>
            ) : (
              recentActivity.map((activity, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/20 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-slate-800/50">
                    <PlatformIcon platform={activity.platform} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getActivityIcon(activity.type)}
                      <p className="text-sm font-medium text-white">{activity.action}</p>
                    </div>
                    {activity.detail && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{activity.detail}</p>
                    )}
                    <p className="text-xs text-slate-600 mt-0.5">{formatRelativeTime(activity.time)}</p>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getActivityDot(activity.type)}`} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
