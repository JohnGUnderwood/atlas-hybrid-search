import Home from '../components/home';
import { AppProvider } from '../context/AppContext';
import { ToastProvider } from '@leafygreen-ui/toast';

export default function App(){
  return (
    <AppProvider>
      <ToastProvider>
        <Home/>
      </ToastProvider>
    </AppProvider>
  )
}