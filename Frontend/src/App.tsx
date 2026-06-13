import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AdminLayout from './components/layout/AdminLayout';
import LandingPage from './pages/LandingPage';
import EventTypesPage from './pages/EventTypesPage';
import AvailabilityPage from './pages/AvailabilityPage';
import MeetingsPage from './pages/MeetingsPage';
import BookingPage from './pages/BookingPage';
import ConfirmationPage from './pages/ConfirmationPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#1e293b',
            color: '#fff',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Admin routes with sidebar layout */}
        <Route element={<AdminLayout />}>
          <Route path="event-types" element={<EventTypesPage />} />
          <Route path="availability" element={<AvailabilityPage />} />
          <Route path="meetings" element={<MeetingsPage />} />
        </Route>

        {/* Public booking routes — no sidebar */}
        <Route path="/book/:slug" element={<BookingPage />} />
        <Route path="/booking/confirmation/:token" element={<ConfirmationPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
