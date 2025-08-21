import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { services } from '../services/api';
import Header from '../components/layout/Header';

const DocumentPage = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const response = await services.documents.getById(id);
        setDocument(response.data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar el documento:', err);
        setError('No se pudo cargar el documento solicitado.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDocument();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-700">{error || 'Documento no encontrado.'}</p>
            <div className="mt-6">
              <Link
                to="/search"
                className="text-blue-600 hover:underline"
              >
                ← Volver a la búsqueda
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          {/* Botón para volver */}
          <div className="mb-6">
            <Link
              to="/search"
              className="inline-flex items-center text-blue-600 hover:underline"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Volver a la búsqueda
            </Link>
          </div>
          
          {/* Título */}
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{document.rel_title}</h1>
          
          {/* Detalles del documento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-700">
                <span className="font-semibold">Autor:</span> {document.author_name}
              </p>
              {document.author_inst && (
                <p className="text-gray-700">
                  <span className="font-semibold">Institución:</span> {Array.isArray(document.author_inst) ? document.author_inst.join(', ') : document.author_inst}
                </p>
              )}
              <p className="text-gray-700">
                <span className="font-semibold">Categoría:</span> {document.category}
              </p>
            </div>
            <div>
              <p className="text-gray-700">
                <span className="font-semibold">Tipo:</span> {document.type}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Fecha:</span> {document.rel_date}
              </p>
              {document.rel_doi && (
                <p className="text-gray-700">
                  <span className="font-semibold">DOI:</span> 
                  <a 
                    href={`https://doi.org/${document.rel_doi}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    {document.rel_doi}
                  </a>
                </p>
              )}
            </div>
          </div>
          
          {/* Resumen */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Resumen</h2>
            <p className="text-gray-700 whitespace-pre-line">{document.rel_abs}</p>
          </div>
          
          {/* Entidades */}
          {document.entities && document.entities.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Entidades</h2>
              <div className="flex flex-wrap gap-2">
                {document.entities.map((entity, idx) => (
                  <span 
                    key={idx} 
                    className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full"
                  >
                    <span className="font-medium">{entity.label}:</span> {entity.text}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPage;