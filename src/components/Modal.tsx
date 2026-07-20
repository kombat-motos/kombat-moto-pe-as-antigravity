import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  bodyClassName?: string;
  fullScreen?: boolean;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = "max-w-lg",
  bodyClassName = "p-6 max-h-[80vh] overflow-y-auto",
  fullScreen = false
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${fullScreen ? 'p-0' : 'p-4'}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative bg-white w-full ${fullScreen ? 'h-full max-w-none rounded-none flex flex-col' : `${maxWidth} rounded-3xl`} shadow-2xl overflow-hidden`}
        >
          <div className={`flex items-center justify-between p-6 border-b border-slate-400 dark:border-slate-700 shrink-0 ${fullScreen ? 'bg-white dark:bg-slate-800' : ''}`}>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors dark:hover:bg-slate-700">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
          <div className={`${bodyClassName} ${fullScreen ? 'flex-1 overflow-hidden' : ''}`}>
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default Modal;
