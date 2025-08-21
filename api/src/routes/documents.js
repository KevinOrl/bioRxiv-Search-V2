const express = require('express');
const { searchDocuments, getFacets, getDocumentById } = require('../services/mongodb');
const { saveSearchHistory, getUserSearchHistory } = require('../services/firestore');

const router = express.Router();

// Buscar documentos
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const facets = {};
    
    // Extraer facets de la consulta
    ['entities', 'author_name', 'author_inst', 'category', 'type', 'rel_date'].forEach(field => {
      if (req.query[field]) {
        facets[field] = Array.isArray(req.query[field]) 
          ? req.query[field] 
          : [req.query[field]];
      }
    });
    
    // Realizar búsqueda
    const results = await searchDocuments(q, facets, parseInt(page), parseInt(limit));
    
    // Guardar búsqueda en historial si hay query
    if (q && req.user?.uid) {
      await saveSearchHistory(req.user.uid, q);
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ error: 'Error en búsqueda de documentos' });
  }
});

// Obtener facets disponibles
router.get('/facets', async (req, res) => {
  try {
    const facets = await getFacets();
    res.json(facets);
  } catch (error) {
    console.error('Error al obtener facets:', error);
    res.status(500).json({ error: 'Error al obtener facets' });
  }
});

// Obtener documento por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const document = await getDocumentById(id);
    
    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    
    res.json(document);
  } catch (error) {
    console.error('Error al obtener documento:', error);
    res.status(500).json({ error: 'Error al obtener documento' });
  }
});

// Obtener historial de búsqueda del usuario
router.get('/history/search', async (req, res) => {
  try {
    if (!req.user?.uid) {
      return res.status(400).json({ error: 'Usuario no identificado' });
    }
    
    const { limit = 10 } = req.query;
    const history = await getUserSearchHistory(req.user.uid, parseInt(limit));
    
    res.json(history);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener historial de búsqueda' });
  }
});

module.exports = router;