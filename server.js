const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Endpoint para extrair imagem de uma URL
app.post('/api/extract-image', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL é obrigatória' });
        }

        console.log('Extraindo imagem de:', url);

        // Faz requisição para obter o HTML da página (segue redirecionamentos automaticamente)
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000,
            maxRedirects: 5
        });

        // Verifica se é Mercado Livre após redirecionamentos
        const finalUrl = response.request.res.responseUrl || url;
        console.log('URL final após redirecionamentos:', finalUrl);

        // Tenta extrair código MLB da URL final
        const mlbPatterns = [
            /MLB[-\s]?(\d+)/i,
            /\/p\/MLB(\d+)/i,
            /\/MLB-?(\d+)-/i,
            /mercadolivre\.com\.br\/.*?-MLB(\d+)/i,
            /mercadolivre\.com\/.*?-MLB(\d+)/i
        ];

        let mlbCode = null;
        for (const pattern of mlbPatterns) {
            const match = finalUrl.match(pattern);
            if (match) {
                mlbCode = match[1];
                console.log('Código MLB encontrado:', mlbCode);
                break;
            }
        }

        // Se encontrou código MLB, usa a API do Mercado Livre
        if (mlbCode) {
            try {
                const apiUrl = `https://api.mercadolibre.com/items/MLB${mlbCode}`;
                console.log('Buscando na API do Mercado Livre:', apiUrl);
                
                const apiResponse = await axios.get(apiUrl, { timeout: 5000 });
                
                if (apiResponse.data && apiResponse.data.pictures && apiResponse.data.pictures[0]) {
                    const imageUrl = apiResponse.data.pictures[0].secure_url || apiResponse.data.pictures[0].url;
                    console.log('Imagem encontrada via API ML:', imageUrl);
                    
                    return res.json({ 
                        success: true, 
                        imageUrl: imageUrl,
                        originalUrl: url,
                        source: 'mercadolivre-api'
                    });
                }
            } catch (apiError) {
                console.log('Erro na API ML, tentando scraping:', apiError.message);
            }
        }

        const html = response.data;
        const $ = cheerio.load(html);

        // Tenta extrair imagem de várias meta tags
        let imageUrl = null;

        // Open Graph
        imageUrl = $('meta[property="og:image"]').attr('content') ||
                   $('meta[property="og:image:secure_url"]').attr('content');

        // Twitter Card
        if (!imageUrl) {
            imageUrl = $('meta[name="twitter:image"]').attr('content') ||
                       $('meta[name="twitter:image:src"]').attr('content');
        }

        // Schema.org
        if (!imageUrl) {
            imageUrl = $('meta[itemprop="image"]').attr('content');
        }

        // Link rel="image_src"
        if (!imageUrl) {
            imageUrl = $('link[rel="image_src"]').attr('href');
        }

        // Fallback: primeira imagem grande na página
        if (!imageUrl) {
            const firstImg = $('img').first().attr('src');
            if (firstImg) {
                imageUrl = firstImg;
            }
        }

        if (!imageUrl) {
            return res.status(404).json({ error: 'Nenhuma imagem encontrada na página' });
        }

        // Corrige URLs relativas
        if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
        } else if (imageUrl.startsWith('/')) {
            const urlObj = new URL(url);
            imageUrl = urlObj.origin + imageUrl;
        } else if (!imageUrl.startsWith('http')) {
            const urlObj = new URL(url);
            imageUrl = urlObj.origin + '/' + imageUrl;
        }

        console.log('Imagem encontrada:', imageUrl);

        res.json({ 
            success: true, 
            imageUrl: imageUrl,
            originalUrl: url,
            source: 'og-tags'
        });

    } catch (error) {
        console.error('Erro ao extrair imagem:', error.message);
        res.status(500).json({ 
            error: 'Erro ao extrair imagem da página',
            details: error.message 
        });
    }
});

// Endpoint de health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
