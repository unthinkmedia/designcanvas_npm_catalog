import { FluentProvider } from '@fluentui/react-components';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { foundryDarkTheme } from './lib/theme';

export function App() {
  return (
    <FluentProvider theme={foundryDarkTheme}>
      <RouterProvider router={router} />
    </FluentProvider>
  );
}
