import { ToastProvider } from './toast.jsx';
import MainApp from './MainApp.jsx';
import ResellerCustomerApp from './ResellerCustomerApp.jsx';
import Reseller from './components/Reseller.jsx';
import CursorGrid from './components/CursorGrid.jsx';
import { isResellerCustomerSite } from './lib/site';

// A single entry point. The reseller portal lives on /reseller, the rest of
// the routes pick between the full veiled.gg experience and the stripped
// autoadv.cc flow based on the hostname.
export default function App() {
  const isResellerPortal = window.location.pathname.replace(/\/+$/, '') === '/reseller';
  const isResellerCustomer = !isResellerPortal && isResellerCustomerSite();

  let body;
  if (isResellerPortal) {
    body = <Reseller />;
  } else if (isResellerCustomer) {
    body = <ResellerCustomerApp />;
  } else {
    body = <MainApp />;
  }

  return (
    <ToastProvider>
      <CursorGrid />
      {body}
    </ToastProvider>
  );
}
