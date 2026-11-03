import React from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { Header } from './components/layout/Header';
import { Toast } from './components/common/Toast';
import { StudioScreen } from './components/studio/StudioScreen';
import { AppsDashboard } from './components/apps/AppsDashboard';
import { ToolBuilder } from './components/builder/ToolBuilder';
import { ToolsScreen } from './components/tools/ToolsScreen';
import { WorkersScreen } from './components/workers/WorkersScreen';
import { CatalogScreen } from './components/catalog/CatalogScreen';
import { LoginScreen } from './components/auth/LoginScreen';

function AdminContent() {
    const { session, isAdmin, screen, msg, setMsg } = useAdmin();

    // 1. If not logged in, show clean Login Screen
    if (!session || !isAdmin) {
        return <LoginScreen />;
    }

    // 2. Active Screen Switcher
    const renderActiveScreen = () => {
        switch (screen) {
            case 'apps':
                return <AppsDashboard />;
            case 'builder':
                return <ToolBuilder />;
            case 'tools':
                return <ToolsScreen />;
            case 'workers':
                return <WorkersScreen />;
            case 'features':
                return <CatalogScreen />;
            case 'task':
            default:
                return <StudioScreen />;
        }
    };

    return (
        <div className="min-h-screen bg-[#07080d] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
            {/* Top Navigation Header */}
            <Header />

            {/* Global Dismissible Notification Toast */}
            {msg && (
                <Toast 
                    message={msg} 
                    onClose={() => setMsg('')} 
                />
            )}

            {/* Main Application Body Container */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-5 sm:py-6">
                {renderActiveScreen()}
            </main>
        </div>
    );
}

export function AdminApp() {
    return (
        <AdminProvider>
            <AdminContent />
        </AdminProvider>
    );
}

export default AdminApp;
