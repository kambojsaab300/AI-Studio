import React from 'react';
import { CatalogViewer } from './CatalogViewer';
import { PromptManager } from './PromptManager';

export function CatalogScreen() {
    return (
        <div className="space-y-6">
            <CatalogViewer />
            <PromptManager />
        </div>
    );
}

export default CatalogScreen;
