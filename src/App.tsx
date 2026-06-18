import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { theme } from './theme';
import { SimulationPage } from './pages/SimulationPage';

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <SimulationPage />
    </MantineProvider>
  );
}
