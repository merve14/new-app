import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import TabBar from './components/TabBar';
import MadhabSelection from './components/MadhabSelection';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import MethodPage from './pages/MethodPage';
import QadaPage from './pages/QadaPage';
import ContactPage from './pages/ContactPage';

function AppContent() {
  const { state } = useApp();

  const renderPage = () => {
    switch (state.activeTab) {
      case 'home': return <HomePage />;
      case 'history': return <HistoryPage />;
      case 'method': return <MethodPage />;
      case 'qada': return <QadaPage />;
      case 'contact': return <ContactPage />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <MadhabSelection />
      <main className="max-w-lg mx-auto px-4 pt-6">
        {renderPage()}
      </main>
      <TabBar />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
