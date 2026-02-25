
import React from 'react';
import { auth } from '../src/lib/firebase';

const DiagnosticPage = () => {
    const configStatus = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'Present' : 'MISSING',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'Present' : 'MISSING',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'Present' : 'MISSING',
    };

    return (
        <div className="p-10">
            <h1>Diagnostic Check</h1>
            <pre data-testid="config-status">{JSON.stringify(configStatus, null, 2)}</pre>
            <hr />
            <h2>Auth Status</h2>
            <p>Current User: {auth.currentUser ? auth.currentUser.email : 'None'}</p>
        </div>
    );
};

export default DiagnosticPage;
