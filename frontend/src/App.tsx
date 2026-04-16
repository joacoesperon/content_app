import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StaticAds from './pages/StaticAds';
import ConceptAds from './pages/ConceptAds';
import Gallery from './pages/Gallery';
import Brand from './pages/Brand';
import Avatars from './pages/Avatars';
import { JobProvider } from './context/JobContext';

export default function App() {
  return (
    <JobProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tools/static_ads" element={<StaticAds />} />
            <Route path="/tools/concept_ads" element={<ConceptAds />} />
            <Route path="/tools/brand" element={<Brand />} />
            <Route path="/tools/avatars" element={<Avatars />} />
            <Route path="/gallery" element={<Gallery />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </JobProvider>
  );
}
