import React from 'react';
import {IconProps} from './Icon';
import {
    LayoutDashboardIcon,
    LaptopIcon,
    BarChart3Icon,
    BellIcon,
    FileTextIcon,
    SettingsIcon,
    LogOutIcon,
    DownloadIcon,
    SparklesIcon,
    NetworkIcon,
    BigQueryIcon,
} from '../../icons';

export type ViewId = 'dashboard' | 'devices' | 'ai' | 'analytics' | 'alerts' | 'reports' | 'bigquery' | 'topology' | 'settings';

interface NavItem {
    id: ViewId;
    label: string;
    icon: React.FC<IconProps>;
}

interface SidebarProps {
    activeView: ViewId;
    setActiveView: (view: ViewId) => void;
}

const navItems: NavItem[] = [
    {id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon},
    {id: 'devices', label: 'Devices', icon: LaptopIcon},
    {id: 'analytics', label: 'Analytics', icon: BarChart3Icon},
    {id: 'topology', label: 'Topology', icon: NetworkIcon},
    {id: 'ai', label: 'AI Assistant', icon: SparklesIcon},
    {id: 'alerts', label: 'Alerts', icon: BellIcon},
    {id: 'reports', label: 'Reports', icon: FileTextIcon},
    {id: 'bigquery', label: 'BigQuery', icon: BigQueryIcon},
];

const NavLink: React.FC<{ item: NavItem; activeView: ViewId; setActiveView: (view: ViewId) => void }> = ({
                                                                                                             item,
                                                                                                             activeView,
                                                                                                             setActiveView,
                                                                                                         }) => (
    <button
        onClick={() => setActiveView(item.id)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
            activeView === item.id
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
    >
        <item.icon className="w-5 h-5"/>
        <span>{item.label}</span>
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({activeView, setActiveView}) => {
    return (
        <aside className="w-64 bg-gray-900 text-white flex flex-col p-4 border-r border-gray-800">
            <div className="text-xl font-bold mb-8 px-2">Network monitoring</div>

            <div className="flex flex-col gap-y-4">
                <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                    <DownloadIcon className="w-5 h-5"/>
                    <span>Download</span>
                </button>
                <nav className="flex flex-col gap-y-1 mt-4">
                    {navItems.map((item) => (
                        <NavLink key={item.id} item={item} activeView={activeView} setActiveView={setActiveView}/>
                    ))}
                </nav>
            </div>

            <div className="mt-auto flex flex-col gap-y-1">
                <button
                    onClick={() => setActiveView('settings')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                        activeView === 'settings'
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}>
                    <SettingsIcon className="w-5 h-5"/>
                    <span>Settings</span>
                </button>
                <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
                    <LogOutIcon className="w-5 h-5"/>
                    <span>Log out</span>
                </button>
            </div>
        </aside>
    );
};