const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Buscar documentos usando Atlas Search
const searchDocuments = async (query, facets = {}, page = 1, limit = 10) => {
  try {
    const db = mongoose.connection.db;
    
    // Construir pipeline de agregación
    const pipeline = [];
    
    // Agregar búsqueda si hay query
    if (query) {
      pipeline.push({
        $search: {
          index: "documents_search",
          text: {
            query: query,
            path: ["rel_title", "rel_abs"],
            fuzzy: { maxEdits: 1 }
          },
          highlight: {
            path: ["rel_title", "rel_abs"]
          }
        }
      });
      
      // Proyectar highlights
      pipeline.push({
        $project: {
          rel_title: 1,
          rel_abs: 1,
          author_name: 1,
          author_inst: 1,
          category: 1,
          type: 1,
          rel_date: 1,
          entities: 1,
          rel_doi: 1,
          highlights: { $meta: "searchHighlights" }
        }
      });
    }
    
    // Aplicar filtros de facets
    const facetFilters = [];
    for (const [field, values] of Object.entries(facets)) {
      if (Array.isArray(values) && values.length > 0) {
        facetFilters.push({ [field]: { $in: values } });
      }
    }
    
    if (facetFilters.length > 0) {
      pipeline.push({ $match: { $and: facetFilters } });
    }
    
    // Pipeline para conteo total
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: "total" });
    
    // Aplicar paginación
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: limit });
    
    // Ejecutar consultas
    const [results, countResult] = await Promise.all([
      db.collection("documents").aggregate(pipeline).toArray(),
      db.collection("documents").aggregate(countPipeline).toArray()
    ]);
    
    const total = countResult.length > 0 ? countResult[0].total : 0;
    
    return {
      results,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error en searchDocuments:', error);
    throw error;
  }
};

// Obtener facets disponibles
const getFacets = async () => {
  try {
    const db = mongoose.connection.db;
    console.log("Conexion a DB:", db);
    const pipeline = [
      {
        $facet: {
          "entities": [
            { $unwind: "$entities" },
            { $group: { _id: "$entities.label", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
          ],
          "category": [
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
          ],
          "type": [
            { $group: { _id: "$type", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          "author_name": [
            { $group: { _id: "$author_name", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
          ]
        }
      }
    ];
    
    const result = await db.collection("documents").aggregate(pipeline).toArray();
    return result[0] || {};
  } catch (error) {
    console.error('Error en getFacets:', error);
    throw error;
  }
};

// Obtener documento por ID
const getDocumentById = async (id) => {
  try {
    const db = mongoose.connection.db;
    let query = {};
    
    // Intentar convertir a ObjectId si es posible
    try {
      query = { _id: new ObjectId(id) };
    } catch (e) {
      // Si no es un ObjectId, buscar por rel_doi
      query = { rel_doi: id };
    }
    
    const document = await db.collection("documents").findOne(query);
    return document;
  } catch (error) {
    console.error('Error en getDocumentById:', error);
    throw error;
  }
};

module.exports = {
  searchDocuments,
  getFacets,
  getDocumentById
};