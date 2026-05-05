import { FluentProvider } from '@fluentui/react-components';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { foundryDarkTheme } from './lib/theme';
import { useAuth } from './hooks/useAuth';
import { GatePage } from './pages/GatePage';

function AuthGate() {
  const { user, loading, authError } = useAuth();

  if (loading) return null;
  if (!user) return <GatePage authError={authError} />;

  return <RouterProvider router={router} />;
}

export function App() {
  return (
    <FluentProvider theme={foundryDarkTheme}>
      <AuthGate />
    </FluentProvider>
  );
}
