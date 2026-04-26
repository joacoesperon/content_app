import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StaticAds from './pages/StaticAds';
import ConceptAds from './pages/ConceptAds';
import Gallery from './pages/Gallery';
import Brand from './pages/Brand';
import Avatars from './pages/Avatars';
import Scout from './pages/Scout';
import Carousels from './pages/Carousels';
import Director from './pages/Director';
import Reels from './pages/Reels';
import MetaAds from './pages/MetaAds';
import MetaAdsLayout from './pages/MetaAdsLayout';
import MetaAdsSettings from './pages/MetaAdsSettings';
import MetaAdsHistory from './pages/MetaAdsHistory';
import { JobProvider } from './context/JobContext';
import { CarouselJobsProvider } from './context/CarouselJobsContext';
import { ReelJobsProvider } from './context/ReelJobsContext';

export default function App() {
  return (
    <JobProvider>
      <CarouselJobsProvider>
      <ReelJobsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tools/static_ads" element={<StaticAds />} />
            <Route path="/tools/concept_ads" element={<ConceptAds />} />
            <Route path="/tools/brand" element={<Brand />} />
            <Route path="/tools/avatars" element={<Avatars />} />
            <Route path="/tools/scout" element={<Scout />} />
            <Route path="/tools/carousels" element={<Carousels />} />
            <Route path="/tools/director" element={<Director />} />
            <Route path="/tools/reels" element={<Reels />} />
            <Route path="/tools/meta_ads" element={<MetaAdsLayout />}>
              <Route index element={<MetaAds />} />
              <Route path="settings" element={<MetaAdsSettings />} />
              <Route path="history" element={<MetaAdsHistory />} />
            </Route>
            <Route path="/gallery" element={<Gallery />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ReelJobsProvider>
      </CarouselJobsProvider>
    </JobProvider>
  );
}
