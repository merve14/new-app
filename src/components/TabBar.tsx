import React from 'react';
import { TABS, TabId } from '../types';
import { useApp } from '../context/AppContext';

export default function TabBar() {
  const { state, dispatch } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-rose-100/50 z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center py-2">
        {TABS.map(tab => {
          const isActive = state.activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => dispatch({ type: 'SET_TAB', payload: tab.id as TabId })}
              className={`flex flex-col items-center py-1 px-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-rose-400 scale-105'
                  : 'text-gray-400 hover:text-gray-500'
              }`}
            >
              <span className="text-xl mb-0.5">{tab.icon}</span>
              <span className={`text-[10px] font-medium ${isActive ? 'text-rose-400' : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-rose-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
