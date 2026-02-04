import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { ConnectedAccountsPanel } from '@/components/dashboard/ConnectedAccountsPanel';
import { ContentCreationForm } from '@/components/dashboard/ContentCreationForm';
import { CommentsFeed } from '@/components/dashboard/CommentsFeed';
import { RecentPostsList } from '@/components/dashboard/RecentPostsList';

export function CommandCenter() {
  const { isAuthenticated } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview />;
      case 'accounts':
        return <ConnectedAccountsPanel />;
      case 'create':
        return <ContentCreationForm />;
      case 'comments':
        return <CommentsFeed />;
      case 'posts':
        return <RecentPostsList />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
}
