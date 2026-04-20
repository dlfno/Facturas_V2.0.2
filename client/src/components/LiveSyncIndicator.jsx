import { RefreshCw } from 'lucide-react';
import { useSyncStatus } from '../LiveUpdatesContext';

export default function LiveSyncIndicator() {
  const syncing = useSyncStatus();
  if (!syncing) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-full shadow-lg">
      <RefreshCw size={12} className="animate-spin" />
      Actualizando…
    </div>
  );
}
