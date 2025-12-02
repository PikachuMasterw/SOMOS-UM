require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// SUA CHAVE GEMINI - SEGURA NO .env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Health check
app.get('/', (req, res) => {
    res.json({ 
        message: '🚀 Servidor João IA - Somos Um',
        status: 'online',
        version: '1.0.0'
    });
});

// Endpoint principal do João IA
app.post('/api/joao-chat', async (req, res) => {
    try {
        const { message, conversationId, history } = req.body;
        
        console.log('📩 Mensagem recebida:', message);
        
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        
        const prompt = `Você é o "João", assistente virtual da plataforma "Somos Um" dedicada ao ensino da História e Cultura Afro-Brasileira (Lei 10.639/2003).

CONTEXTO:
- Plataforma: Somos Um
- Foco: Educação, cultura afro-brasileira, Lei 10.639/2003
- Público: Educadores, estudantes, comunidade
- Seções: Educador, Estudante, Comunidade, Biblioteca, Calendário

HISTÓRICO:
${history ? history.slice(-5).map(msg => 
    `${msg.isUser ? 'Usuário' : 'João'}: ${msg.text}`
).join('\n') : 'Nenhum histórico'}

PERGUNTA ATUAL: ${message}

INSTRUÇÕES:
- Responda como João (amigável, profissional, em português brasileiro)
- Foque em educação e cultura afro-brasileira
- Seja conciso (máximo 150 palavras)
- Ofereça ajuda com educador, estudante, comunidade, biblioteca, calendário
- Se não souber, seja honesto e sugira outros tópicos

RESPOSTA:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ Resposta Gemini:', text.substring(0, 100) + '...');

        res.json({
            reply: text,
            suggestions: ['Educador', 'Estudante', 'Biblioteca', 'Calendário']
        });

    } catch (error) {
        console.error('❌ Erro Gemini:', error);
        res.status(500).json({
            reply: 'Desculpe, estou com problemas técnicos no momento. Você pode tentar novamente ou usar as respostas locais.'
        });
    }
});

// Endpoint para buscar eventos
app.post('/api/joao-events', async (req, res) => {
    try {
        const { query } = req.body;
        
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const prompt = `Para a plataforma "Somos Um" (cultura afro-brasileira), liste eventos/datas importantes baseado nesta pergunta: "${query}". 
        
        Retorne APENAS JSON válido no formato:
        {
            "eventos": [
                {
                    "data": "YYYY-MM-DD", 
                    "titulo": "Nome do evento",
                    "descricao": "Descrição breve",
                    "tipo": "cultural|historico|feriado"
                }
            ]
        }
        
        Inclua apenas eventos relevantes para cultura afro-brasileira.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Extrair JSON da resposta
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const eventosData = JSON.parse(jsonMatch[0]);
            res.json(eventosData);
        } else {
            res.json({ eventos: [] });
        }

    } catch (error) {
        console.error('❌ Erro eventos:', error);
        res.json({ eventos: [] });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor João IA rodando: http://localhost:${PORT}`);
    console.log(`🔒 Gemini API Key: ${GEMINI_API_KEY ? '✅ Configurada' : '❌ Faltando'}`);
});