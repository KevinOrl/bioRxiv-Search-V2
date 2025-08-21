// filepath: c:\Users\Axel\Documents\Repositorios Bases II\Repositorio Grupal\2025-01-IC4302-PO\P2\frontend\src\components\search\FacetFilters.jsx
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const FacetFilters = ({ availableFacets, selectedFacets, onChange }) => {
  // Estado para manejar la visualización de filtros (expandido/colapsado)
  const [expanded, setExpanded] = useState({});

  // Función para manejar selección de facet
  const handleFacetSelection = (field, value) => {
    const currentValues = selectedFacets[field] || [];
    const isSelected = currentValues.includes(value);
    
    // Alternar selección
    const newValues = isSelected
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onChange(field, newValues);
  };

  // Renderizar grupo de facets
  const renderFacetGroup = (field, label, values) => {
    if (!values || values.length === 0) return null;
    
    const isExpanded = expanded[field] !== false; // Por defecto expandido
    
    return (
      <div key={field} className="mb-4">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setExpanded(prev => ({ ...prev, [field]: !isExpanded }))}
        >
          <h3 className="font-medium text-gray-700">{label}</h3>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        
        {isExpanded && (
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {values.map(({ _id, count }) => {
              if (!_id) return null;
              
              const isSelected = (selectedFacets[field] || []).includes(_id);
              
              return (
                <label key={_id} className="flex items-center text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleFacetSelection(field, _id)}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">
                    {_id} <span className="text-gray-400">({count})</span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h2 className="text-lg font-bold mb-4">Filtros</h2>
      
      {renderFacetGroup('entities.label', 'Entidades', availableFacets['entities.label'])}
      {renderFacetGroup('category', 'Categorías', availableFacets['category'])}
      {renderFacetGroup('type', 'Tipos', availableFacets['type'])}
      {renderFacetGroup('author_name', 'Autores', availableFacets['author_name'])}
    </div>
  );
};

FacetFilters.propTypes = {
  availableFacets: PropTypes.object,
  selectedFacets: PropTypes.object,
  onChange: PropTypes.func.isRequired
};

FacetFilters.defaultProps = {
  availableFacets: {},
  selectedFacets: {}
};

export default FacetFilters;