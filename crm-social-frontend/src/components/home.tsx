import { AppProvider } from '@/context/AppContext';
import { CommandCenter } from '@/components/dashboard/CommandCenter';

function Home() {
  return (
    <AppProvider>
      <CommandCenter />
    </AppProvider>
  );
}

export default Home;
