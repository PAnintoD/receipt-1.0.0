import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import NewReceipt from './pages/NewReceipt';
import History from './pages/History';
import { useReceiptStore } from './store/useReceiptStore';
import { useConfigStore } from './store/useConfigStore';
import { migrateLocalStorageToFirestore } from './services/firestore';

function App() {
  useEffect(() => {
    // Initialize Firestore subscriptions
    const unsubscribeReceipts = useReceiptStore.getState().initializeFirestore();
    const unsubscribeConfig = useConfigStore.getState().initializeFirestore();

    // Migrate localStorage data to Firestore (one-time)
    const migrated = localStorage.getItem('firestore-migrated');
    if (!migrated) {
      migrateLocalStorageToFirestore().then((success) => {
        if (success) {
          localStorage.setItem('firestore-migrated', 'true');
          console.log('Data migrated to Firestore successfully');
        }
      });
    }

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeReceipts?.();
      unsubscribeConfig?.();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="new" element={<NewReceipt />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
