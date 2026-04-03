import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import NewCampaignPage from './pages/NewCampaignPage';
import CampaignPage from './pages/CampaignPage';
import CharacterPage from './pages/CharacterPage';
import ProgressionPage from './pages/ProgressionPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/campaign/new" element={<NewCampaignPage />} />
        <Route path="/campaign/:id" element={<CampaignPage />} />
        <Route path="/campaign/:id/character/:charId" element={<CharacterPage />} />
        <Route path="/campaign/:id/progression" element={<ProgressionPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
