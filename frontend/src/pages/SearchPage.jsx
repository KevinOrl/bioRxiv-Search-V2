import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { services } from '../services/api';
import Header from '../components/layout/Header';
import SearchBar from '../components/search/SearchBar';
import SearchResults from '../components/search/SearchResults';
import FacetFilters from '../components/search/FacetFilters';

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
  const [facets, setFacets] = useState({});
  const [availableFacets, setAvailableFacets] = useState({});
  const navigate = useNavigate();

  // Extraer parámetros de búsqueda
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  
  // Extraer facets de la URL
  const extractFacetsFromURL = () => {
    const facetFields = ['entities', 'author_name', 'author_inst', 'category', 'type', 'rel_date'];
    const extractedFacets = {};
    
    facetFields.forEach(field => {
      const values = searchParams.getAll(field);
      if (values.length > 0) {
        extractedFacets[field] = values;
      }
    });
    
    return extractedFacets;
  };

  // Realizar búsqueda
  const performSearch = async () => {
    if (!query) {
      setResults([]);
      setPagination({ total: 0, page: 1, limit: 10, pages: 0 });
      return;
    }
    
    setLoading(true);
    
    try {
      const params = { q: query, page };
      
      // Añadir facets a la consulta
      Object.entries(facets).forEach(([key, values]) => {
        if (values && values.length > 0) {
          params[key] = values;
        }
      });
      
      const response = await services.documents.search(params);
      setResults(response.data.results);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error en búsqueda:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar facets disponibles
  const loadAvailableFacets = async () => {
    try {
      const response = await services.documents.getFacets();
      setAvailableFacets(response.data);
    } catch (error) {
      console.error('Error al cargar facets:', error);
    }
  };

  // Manejar cambio de búsqueda
  const handleSearch = (searchQuery) => {
    setSearchParams({ q: searchQuery, page: '1' });
  };

  // Manejar cambio de página
  const handlePageChange = (newPage) => {
    setSearchParams({ ...Object.fromEntries(searchParams), page: newPage.toString() });
  };

  // Manejar cambio de facets
  const handleFacetChange = (field, values) => {
    const newFacets = { ...facets, [field]: values };
    
    if (!values || values.length === 0) {
      delete newFacets[field];
    }
    
    setFacets(newFacets);
    
    // Actualizar URL
    const newParams = new URLSearchParams(searchParams);
    
    newParams.delete(field);
    if (values && values.length > 0) {
      values.forEach(value => newParams.append(field, value));
    }
    
    // Resetear página a 1 cuando cambian los filtros
    newParams.set('page', '1');
    
    setSearchParams(newParams);
  };

  // Ver detalle de documento
  const handleViewDocument = (documentId) => {
    navigate(`/document/${documentId}`);
  };

  // Efectos para cargar datos
  useEffect(() => {
    loadAvailableFacets();
  }, []);

  useEffect(() => {
    // Extraer facets de la URL cuando cambia
    setFacets(extractFacetsFromURL());
  }, [searchParams]);

  useEffect(() => {
    performSearch();
  }, [query, page, facets]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Búsqueda de Artículos COVID-19
        </h1>
        
        <div className="mb-6">
          <SearchBar initialValue={query} onSearch={handleSearch} />
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filtros laterales */}
          <aside className="w-full md:w-1/4">
            <FacetFilters 
              availableFacets={availableFacets}
              selectedFacets={facets}
              onChange={handleFacetChange}
            />
          </aside>
          
          {/* Resultados de búsqueda */}
          <div className="w-full md:w-3/4">
            <SearchResults 
              results={results}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onViewDocument={handleViewDocument}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default SearchPage;