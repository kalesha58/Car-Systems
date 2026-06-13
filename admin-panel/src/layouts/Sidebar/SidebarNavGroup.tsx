import { Tooltip } from '@components/Tooltip/Tooltip';
import { useSidebarStore } from '@store/sidebarStore';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import { INavGroup, isNavLinkActive } from './sidebarNavConfig';

interface ISidebarNavGroupProps {
  group: INavGroup;
  isSidebarOpen: boolean;
  primaryColor: string;
  secondaryColor: string;
  isMobile: boolean;
  onNavigate: () => void;
}

export const SidebarNavGroup = ({
  group,
  isSidebarOpen,
  primaryColor,
  secondaryColor,
  isMobile,
  onNavigate,
}: ISidebarNavGroupProps) => {
  const location = useLocation();
  const { expandedGroups, toggleGroup, setGroupExpanded } = useSidebarStore();
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isExpanded = expandedGroups[group.id] ?? false;
  const isGroupActive = group.items.some((item) => isNavLinkActive(location.pathname, item));
  const GroupIcon = group.icon;

  useEffect(() => {
    if (isGroupActive) {
      setGroupExpanded(group.id, true);
    }
  }, [group.id, isGroupActive, setGroupExpanded]);

  useEffect(() => {
    if (!flyoutOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        flyoutRef.current &&
        !flyoutRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setFlyoutOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [flyoutOpen]);

  useEffect(() => {
    setFlyoutOpen(false);
  }, [location.pathname, isSidebarOpen]);

  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    `group relative flex items-center gap-3 px-3 py-2 rounded-xl no-underline transition-all duration-200 ${
      isActive
        ? 'text-white shadow-lg'
        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-700/50'
    }`;

  const linkStyle = (isActive: boolean) =>
    isActive
      ? {
          background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
          boxShadow: `0 10px 15px -3px ${primaryColor}30, 0 4px 6px -2px ${primaryColor}20`,
        }
      : undefined;

  const renderNavLink = (item: INavGroup['items'][number], indented = false) => {
    const ItemIcon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.end}
        onClick={() => {
          onNavigate();
          setFlyoutOpen(false);
        }}
        className={linkClassName}
        style={({ isActive }) => linkStyle(isActive)}
      >
        {({ isActive }) => (
          <>
            <ItemIcon
              size={indented ? 18 : 20}
              className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}
            />
            {(isSidebarOpen || flyoutOpen) && (
              <span className="text-sm font-medium flex-1 truncate">{item.label}</span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  if (!isSidebarOpen) {
    return (
      <div className="relative">
        <Tooltip text={group.label} position="right">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setFlyoutOpen((open) => !open)}
            className={`w-full flex items-center justify-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
              isGroupActive || flyoutOpen
                ? 'text-white shadow-lg'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-700/50'
            }`}
            style={
              isGroupActive || flyoutOpen
                ? {
                    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                    boxShadow: `0 10px 15px -3px ${primaryColor}30, 0 4px 6px -2px ${primaryColor}20`,
                  }
                : undefined
            }
            aria-label={group.label}
            aria-expanded={flyoutOpen}
          >
            <GroupIcon size={20} />
          </button>
        </Tooltip>

        <AnimatePresence>
          {flyoutOpen && (
            <motion.div
              ref={flyoutRef}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="fixed z-[1001] min-w-[200px] py-2 px-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xl"
              style={{
                left: isMobile ? 288 : 88,
                top: triggerRef.current?.getBoundingClientRect().top ?? 0,
              }}
            >
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 m-0">
                {group.label}
              </p>
              <div className="space-y-1">{group.items.map((item) => renderNavLink(item))}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => toggleGroup(group.id)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
          isGroupActive
            ? 'bg-slate-100/90 dark:bg-slate-700/60 text-slate-900 dark:text-slate-100'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-700/40'
        }`}
        aria-expanded={isExpanded}
      >
        <GroupIcon size={18} className="flex-shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wide flex-1 text-left truncate">
          {group.label}
        </span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pl-2 ml-2 border-l border-slate-200/80 dark:border-slate-700/80">
              {group.items.map((item) => renderNavLink(item, true))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
