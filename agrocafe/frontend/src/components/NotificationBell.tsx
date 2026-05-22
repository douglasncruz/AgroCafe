"use client";

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, ShieldAlert, BadgeInfo, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNotifications, AppNotification } from '@/context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fecha o popover se clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getPriorityColor = (priority: string, isRead: boolean) => {
    if (isRead) return "text-slate-400 bg-slate-50 border-slate-100 dark:bg-slate-800/20 dark:border-slate-800";
    switch (priority) {
      case 'CRITICAL': return "text-red-600 bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/30";
      case 'WARNING': return "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30";
      case 'SUCCESS': return "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30";
      case 'INFO':
      default: return "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return <ShieldAlert className="h-5 w-5" />;
      case 'WARNING': return <AlertTriangle className="h-5 w-5" />;
      case 'SUCCESS': return <CheckCircle2 className="h-5 w-5" />;
      case 'INFO':
      default: return <BadgeInfo className="h-5 w-5" />;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors focus:outline-none"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-950 animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 origin-top-right">
          
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Notificações
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-farm-100 text-farm-700 text-xs font-semibold dark:bg-farm-900/30 dark:text-farm-400">
                  {unreadCount} novas
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsRead()}
                className="text-xs font-medium text-farm-600 hover:text-farm-700 dark:text-farm-400 flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Marcar lidas
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center text-slate-500 dark:text-slate-400">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <Bell className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm font-medium">Tudo tranquilo por aqui.</p>
                <p className="text-xs mt-1">Você não tem novas notificações.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.map((notif: AppNotification) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 transition-colors group relative ${notif.is_read ? 'opacity-70 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-slate-50 dark:bg-slate-800/30'}`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full border ${getPriorityColor(notif.priority, notif.is_read)}`}>
                        {getPriorityIcon(notif.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-sm font-bold truncate pr-4 ${notif.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed line-clamp-2 ${notif.is_read ? 'text-slate-500' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>
                          {notif.message}
                        </p>
                        
                        {notif.action_link && (
                          <Link 
                            href={notif.action_link}
                            onClick={() => {
                              if (!notif.is_read) markAsRead(notif.id);
                              setIsOpen(false);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-farm-600 mt-2 hover:underline dark:text-farm-400"
                          >
                            Acessar <ChevronRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Ações Hover */}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 bg-white/90 dark:bg-slate-900/90 rounded-md shadow-sm p-1 backdrop-blur-sm border border-slate-100 dark:border-slate-800">
                      {!notif.is_read && (
                        <button onClick={() => markAsRead(notif.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Marcar como lida">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => deleteNotification(notif.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Excluir">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link 
                href="/dashboard/notifications" 
                onClick={() => setIsOpen(false)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Ver histórico completo
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
