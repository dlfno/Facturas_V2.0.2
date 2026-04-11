import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Settings, Scale, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dlg', label: 'DLG', icon: Scale },
  { to: '/smgs', label: 'SMGS', icon: Building2 },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`bg-slate-900 text-white flex flex-col shrink-0 transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      <div className="p-4 border-b border-slate-700 flex items-center justify-between min-h-[72px]">
        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold tracking-tight">Cobranza</h1>
            <p className="text-sm text-slate-400 mt-0.5">Sistema de Gestión</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
            collapsed ? 'mx-auto' : ''
          }`}
          title={collapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={20} />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>
      {!collapsed && (
        <div className="p-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center">DLG & SMGS</p>
        </div>
      )}
    </aside>
  );
}
