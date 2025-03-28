// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// La clé API Anthropic stockée en sécurité comme variable d'environnement
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Point d'entrée pour le proxy API Anthropic
app.post('/api/generate', async (req, res) => {
  try {
    // Extraction des données de la requête
    const { model, prompt, systemPrompt } = req.body;
    
    // Valider les entrées
    if (!model || !prompt) {
      return res.status(400).json({ error: 'Le modèle et le prompt sont requis' });
    }
    
    // Vérifier que la clé API est configurée
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Clé API non configurée sur le serveur' });
    }
    
    // Appel à l'API Anthropic
    const response = await axios.post('https://api.anthropic.com/v1/messages', 
      {
        model: model,
        max_tokens: 4000,
        system: systemPrompt || "Tu es un assistant d'écriture professionnel expert qui aide à développer des romans.",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    // Retourner la réponse au client
    res.json(response.data);
    
  } catch (error) {
    console.error('Erreur lors de l\'appel à l\'API:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erreur lors de la génération du contenu',
      details: error.response?.data || error.message
    });
  }
});

// Route pour servir l'application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`État de la clé API: ${ANTHROPIC_API_KEY ? 'Configurée' : 'Non configurée'}`);
});
