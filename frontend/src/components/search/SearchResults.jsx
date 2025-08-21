import React from 'react';
import PropTypes from 'prop-types';

const SearchResults = ({ 
  results, 
  loading, 
  pagination, 
  onPageChange, 
  onViewDocument 
}) => {
  // Renderizar mensaje de carga
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si no hay resultados
  if (!results || results.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <p className="text-gray-500">No se encontraron resultados.</p>
      </div>
    );
  }

  // Renderizar highlights desde la API de Atlas Search
  const renderHighlights = (highlights) => {
    if (!highlights || !Array.isArray(highlights)) return null;

    return (
      <div className="mt-2 text-left">
        {highlights.map((highlight, i) => (
          <div key={i} className="mb-2">
            <p className="text-xs text-gray-500 mb-1">
              {highlight.path === 'rel_title' ? 'Título' : 'Resumen'}:
            </p>
            <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ 
              __html: highlight.texts.map(t => 
                t.type === 'hit' 
                  ? `<mark class="bg-yellow-200">${t.value}</mark>` 
                  : t.value
              ).join('')
            }} />
          </div>
        ))}
      </div>
    );
  };

  // Renderizar paginación
  const renderPagination = () => {
    const { total, page, limit, pages } = pagination;
    
    if (total === 0) return null;
    
    // Calcular páginas a mostrar
    let pageButtons = [];
    const maxButtons = 5;
    
    let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
    let endPage = Math.min(pages, startPage + maxButtons - 1);
    
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    // Añadir botón "Anterior"
    pageButtons.push(
      <button
        key="prev"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Anterior
      </button>
    );
    
    // Añadir botones de página
    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            i === page
              ? 'bg-blue-600 text-white border border-blue-600'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Añadir botón "Siguiente"
    pageButtons.push(
      <button
        key="next"
        onClick={() => onPageChange(Math.min(pages, page + 1))}
        disabled={page === pages}
        className="px-3 py-1 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Siguiente
      </button>
    );
    
    return (
      <div className="flex flex-col items-center mt-6">
        <div className="text-sm text-gray-500 mb-3">
          Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total} resultados
        </div>
        <div className="flex space-x-2">
          {pageButtons}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Resultados ({pagination.total})</h2>
        
        {/* Lista de resultados */}
        <div className="space-y-6">
          {results.map((result) => (
            <div 
              key={result._id} 
              className="border-b border-gray-200 pb-4 last:border-b-0 text-left"
            >
              <h3 className="text-lg font-semibold text-blue-600 hover:underline cursor-pointer" 
                  onClick={() => onViewDocument(result._id)}>
                {result.rel_title || 'Sin título'}
              </h3>
              
              <div className="mt-1 text-sm">
                {result.author_name && (
                  <p className="text-gray-600">
                    <span className="font-medium">Autor:</span> {result.author_name}
                  </p>
                )}
                
                {result.category && (
                  <p className="text-gray-600">
                    <span className="font-medium">Categoría:</span> {result.category}
                  </p>
                )}
                
                {result.rel_date && (
                  <p className="text-gray-600">
                    <span className="font-medium">Fecha:</span> {result.rel_date}
                  </p>
                )}
                
                {result.rel_doi && (
                  <p className="text-gray-600">
                    <span className="font-medium">DOI:</span> {result.rel_doi}
                  </p>
                )}
              </div>
              
              {/* Mostrar extracto del resumen */}
              {result.rel_abs && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                  {result.rel_abs.substring(0, 200)}...
                </p>
              )}
              
              {/* Mostrar highlights */}
              {result.highlights && renderHighlights(result.highlights)}
              
              {/* Mostrar entidades */}
              {result.entities && result.entities.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">Entidades:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.entities.slice(0, 5).map((entity, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        {entity.label}: {entity.text}
                      </span>
                    ))}
                    {result.entities.length > 5 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        +{result.entities.length - 5} más
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <button
                onClick={() => onViewDocument(result._id)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver artículo completo →
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Paginación */}
      {renderPagination()}
    </div>
  );
};

SearchResults.propTypes = {
  results: PropTypes.array,
  loading: PropTypes.bool.isRequired,
  pagination: PropTypes.shape({
    total: PropTypes.number,
    page: PropTypes.number,
    limit: PropTypes.number,
    pages: PropTypes.number
  }),
  onPageChange: PropTypes.func.isRequired,
  onViewDocument: PropTypes.func.isRequired
};

SearchResults.defaultProps = {
  results: [],
  pagination: { total: 0, page: 1, limit: 10, pages: 0 }
};

export default SearchResults;