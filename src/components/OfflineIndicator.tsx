import React from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {WifiOff} from 'lucide-react';
import {useOnlineStatus} from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          role="status"
          initial={{opacity: 0, y: 18, scale: 0.94}}
          animate={{opacity: 1, y: 0, scale: 1}}
          exit={{opacity: 0, y: 14, scale: 0.94}}
          transition={{type: 'spring', stiffness: 380, damping: 28}}
          className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-lg border border-[#233029]/15 bg-[#233029] px-3.5 py-2 text-xs font-medium text-[#F3F1EC] shadow-md"
        >
          <WifiOff className="h-3.5 w-3.5 text-[#E5B24C]" aria-hidden="true" />
          <span>โหมดออฟไลน์ · เล่นต่อได้ตามปกติ</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
