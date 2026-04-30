import { createHashRouter } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { PackageDetail } from '@/pages/PackageDetail';
import { Dashboard } from '@/pages/Dashboard';
import { Admin } from '@/pages/Admin';

export const router = createHashRouter([
  { path: '/', element: <Home /> },
  { path: '/package/:name', element: <PackageDetail /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/admin', element: <Admin /> },
]);
