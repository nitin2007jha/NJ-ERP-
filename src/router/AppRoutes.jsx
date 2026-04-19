import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute }      from './RoleRoute';
import { AppShell }       from '@/components/layout/AppShell';

// Lazy-loaded feature modules
import { lazy, Suspense } from 'react';
const Dashboard   = lazy(() => import('@/features/dashboard/Dashboard'));
const Invoice     = lazy(() => import('@/features/invoice/InvoiceModule'));
const Records     = lazy(() => import('@/features/invoice/InvoiceRecords'));
const Inventory   = lazy(() => import('@/features/inventory/InventoryModule'));
const Services    = lazy(() => import('@/features/services/ServicesModule'));
const CRM         = lazy(() => import('@/features/crm/CRMModule'));
const Expenses    = lazy(() => import('@/features/expenses/ExpenseModule'));
const Employees   = lazy(() => import('@/features/employees/EmployeeModule'));
const GST         = lazy(() => import('@/features/gst/GSTModule'));
const Settings    = lazy(() => import('@/features/settings/SettingsModule'));
const Analytics   = lazy(() => import('@/features/analytics/Analytics'));
const Daybook     = lazy(() => import('@/features/daybook/DaybookModule'));

const Loader = () => (
  <div className="flex items-center justify-center h-64 text-brand-500 text-sm font-semibold">
    Loading...
  </div>
);

export function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<Navigate to="/" replace />} />
      <Route path="/signup"   element={<Navigate to="/" replace />} />

      {/* Protected — requires auth */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={
            <Suspense fallback={<Loader />}><Dashboard /></Suspense>
          } />

          <Route path="/invoice" element={
            <RoleRoute permission="canCreateInvoice">
              <Suspense fallback={<Loader />}><Invoice /></Suspense>
            </RoleRoute>
          } />

          <Route path="/records" element={
            <Suspense fallback={<Loader />}><Records /></Suspense>
          } />

          <Route path="/inventory" element={
            <RoleRoute permission="canViewInventory">
              <Suspense fallback={<Loader />}><Inventory /></Suspense>
            </RoleRoute>
          } />

          <Route path="/clients" element={
            <RoleRoute permission="canViewClients">
              <Suspense fallback={<Loader />}><CRM /></Suspense>
            </RoleRoute>
          } />

          <Route path="/expenses" element={
            <RoleRoute permission="canViewExpenses">
              <Suspense fallback={<Loader />}><Expenses /></Suspense>
            </RoleRoute>
          } />

          <Route path="/services" element={
            <RoleRoute permission="canViewInventory">
              <Suspense fallback={<Loader />}><Services /></Suspense>
            </RoleRoute>
          } />

          <Route path="/daybook" element={
            <Suspense fallback={<Loader />}><Daybook /></Suspense>
          } />

                    <Route path="/employees" element={
            <RoleRoute permission="canViewEmployees" ownerOnly>
              <Suspense fallback={<Loader />}><Employees /></Suspense>
            </RoleRoute>
          } />

          <Route path="/gst" element={
            <RoleRoute permission="canViewGST">
              <Suspense fallback={<Loader />}><GST /></Suspense>
            </RoleRoute>
          } />

          <Route path="/analytics" element={
            <RoleRoute permission="canViewAnalytics" requiresFeature="analytics">
              <Suspense fallback={<Loader />}><Analytics /></Suspense>
            </RoleRoute>
          } />

          <Route path="/settings" element={
            <RoleRoute ownerOnly>
              <Suspense fallback={<Loader />}><Settings /></Suspense>
            </RoleRoute>
          } />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
