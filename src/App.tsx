import { HashRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import NewCampaignPage from './pages/NewCampaignPage';
import CampaignPage from './pages/CampaignPage';
import CharacterPage from './pages/CharacterPage';
import ProgressionPage from './pages/ProgressionPage';
import AiDmPage from './pages/AiDmPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dm-helper" element={<HomePage />} />
        <Route path="/ai-dm" element={<AiDmPage />} />
        <Route path="/campaign/new" element={<NewCampaignPage />} />
        <Route path="/campaign/:id" element={<CampaignPage />} />
        <Route path="/campaign/:id/character/:charId" element={<CharacterPage />} />
        <Route path="/campaign/:id/progression" element={<ProgressionPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
