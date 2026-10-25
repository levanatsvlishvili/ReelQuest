import React, { useState } from 'react';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { LoginView } from './components/LoginView';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { ChallengeScheduler } from './components/ChallengeScheduler';
import { GameHistory } from './components/GameHistory';
import { UserManagement } from './components/UserManagement';
import { LeaderboardModeration } from './components/LeaderboardModeration';
import { CinemaGraphConsole } from './components/CinemaGraphConsole';
import { SystemInfo } from './components/SystemInfo';
import { Activity } from 'lucide-react';

function AdminDashboardInner() {
  const { adminUser, loading } = useAdminAuth();
  const [currentTab, setCurrentTab] = useState('overview');
  const [historyUserFilter, setHistoryUserFilter] = useState('ALL');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090e]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Activity className="h-8 w-8 animate-spin text-gold" />
          <span className="text-xs font-bold uppercase tracking-widest text-gold/80">
            Verifying Administrative Credentials...
          </span>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return <LoginView />;
  }

  const handleSelectTab = (tabId) => {
    if (tabId === 'history') {
      setHistoryUserFilter('ALL');
    }
    setCurrentTab(tabId);
  };

  const handleInspectUserHistory = (userId) => {
    setHistoryUserFilter(userId);
    setCurrentTab('history');
  };

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'overview':
        return <DashboardOverview key={refreshKey} onNavigateTab={handleSelectTab} />;
      case 'scheduler':
        return <ChallengeScheduler key={refreshKey} />;
      case 'history':
        return <GameHistory key={`${refreshKey}-${historyUserFilter}`} initialUserId={historyUserFilter} />;
      case 'users':
        return <UserManagement key={refreshKey} onInspectUserHistory={handleInspectUserHistory} />;
      case 'moderation':
        return <LeaderboardModeration key={refreshKey} />;
      case 'graph':
        return <CinemaGraphConsole key={refreshKey} />;
      case 'system':
        return <SystemInfo key={refreshKey} />;
      default:
        return <DashboardOverview key={refreshKey} onNavigateTab={handleSelectTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          onOpenMobile={() => setMobileSidebarOpen(true)}
          onRefresh={() => setRefreshKey((k) => k + 1)}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <AdminDashboardInner />
    </AdminAuthProvider>
  );
}
