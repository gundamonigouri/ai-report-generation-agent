import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GenerateReport from './pages/GenerateReport';
import Documents from './pages/Documents';
import ReportHistory from './pages/ReportHistory';
import ReportView from './pages/ReportView';
import AdminDashboard from './pages/AdminDashboard';
import LLMOps from './pages/LLMOps';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/generate" element={<GenerateReport />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/history" element={<ReportHistory />} />
        <Route path="/reports/:id" element={<ReportView />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/llm-ops"
          element={
            <ProtectedRoute adminOnly>
              <LLMOps />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
