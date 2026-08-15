import { ReactNode, useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: string;
  count?: number;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export default function Tabs({ tabs, defaultTab, onChange, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div className={className}>
      <div className="flex items-center border-b border-secondary-200/70 overflow-x-auto" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-150 cursor-pointer ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-700'
                : 'border-transparent text-foreground-500 hover:text-foreground-700 hover:border-secondary-300'
            }`}
          >
            {tab.icon && <i className={`${tab.icon} text-base`} aria-hidden="true" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-2xs px-1.5 py-0.5 rounded-full font-medium ml-0.5 ${
                activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      <div
        className="pt-4"
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
}