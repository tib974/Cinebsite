import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';

export default function App() {
  return (
    <>
      <Header />
      <main id="contenu" className="container">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}