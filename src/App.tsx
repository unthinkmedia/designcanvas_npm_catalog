import { FluentProvider, webDarkTheme } from '@fluentui/react-components';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export function App() {
  return (
    <FluentProvider theme={webDarkTheme}>
      <RouterProvider router={router} />
    </FluentProvider>
  );
}
