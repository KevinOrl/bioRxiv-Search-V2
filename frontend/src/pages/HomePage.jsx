import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-6">
          Buscador de Artículos COVID-19
        </h1>
        
        <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
          Explora miles de artículos científicos relacionados con COVID-19 
          utilizando búsqueda avanzada y filtrado por categorías.
        </p>
        
        <div className="mt-10">
          <Link
            to="/search"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Comenzar búsqueda
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;