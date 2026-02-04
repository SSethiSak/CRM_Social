import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';
import { Link2, FileText, MessageSquare, TrendingUp, Activity } from 'lucide-react';
import { PlatformIcon, platformGlowColors } from '@/components/shared/PlatformIcon';
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
  const { connectedAccounts, posts, comments } = useApp();

  const connectedCount = connectedAccounts.filter(a => a.isConnected).length;
  const totalComments = comments.length;
  const totalPosts = posts.length;
  const successfulPosts = posts.filter(p => 
    Object.values(p.status).some(s => s === 'success')
  ).length;

  const recentActivity = [
    { action: 'Post published', platform: 'facebook' as Platform, time: '2h ago' },
    { action: 'New comment', platform: 'instagram' as Platform, time: '3h ago' },
    { action: 'Account connected', platform: 'linkedin' as Platform, time: '1d ago' },
    { action: 'Post published', platform: 'instagram' as Platform, time: '1d ago' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Dashboard Overview
        </h1>
        <p className="text-slate-400">
          Monitor your social media presence across all platforms
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          title="Comments Collected"
          value={totalComments}
          subtitle="Across all platforms"
          icon={<MessageSquare className="w-5 h-5" />}
          glowColor="shadow-xl shadow-purple-500/10"
        />
        <MetricCard
          title="Engagement Rate"
          value="12.4%"
          subtitle="+2.3% from last week"
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
            {recentActivity.map((activity, index) => (
              <div 
                key={index} 
                className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/20 hover:bg-slate-800/40 transition-colors"
              >
                <div className="p-2 rounded-lg bg-slate-800/50">
                  <PlatformIcon platform={activity.platform} size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{activity.action}</p>
                  <p className="text-xs text-slate-500">{activity.time}</p>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
