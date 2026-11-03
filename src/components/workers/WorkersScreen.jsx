import React from 'react';
import { WorkerFleet } from './WorkerFleet';
import { SystemSettings } from './SystemSettings';

export function WorkersScreen() {
    return (
        <div className="space-y-6">
            <WorkerFleet />
            <SystemSettings />
        </div>
    );
}

export default WorkersScreen;
