import React from 'react';
import { StationRouter } from './components/StationRouter';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <StationRouter />
    </div>
  );
};

export default App;
