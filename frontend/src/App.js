import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AegisDashboard from '@/components/aegis/AegisDashboard';

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<AegisDashboard />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;


