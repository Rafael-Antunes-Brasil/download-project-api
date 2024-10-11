"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const jszip_1 = __importDefault(require("jszip"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = 3000;
const downloadDir = './temp';
// Middleware para processar JSON
app.use(express_1.default.json());
// Rota principal para enviar URLs e iniciar o download
app.post('/download', async (req, res) => {
    const { urls } = req.body;
    // Verificar se as URLs foram fornecidas corretamente
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
        res.status(400).json({ message: 'Forneça uma lista de URLs para download.' });
        return;
    }
    // Garantir que a pasta temporária existe
    await fs_extra_1.default.ensureDir(downloadDir);
    try {
        // Passo 1: Baixar cada arquivo e salvar na pasta temporária
        const downloadPromises = urls.map(async (url, index) => {
            const fileName = `file${index + 1}${path_1.default.extname(url)}`;
            const filePath = path_1.default.join(downloadDir, fileName);
            // Baixar o arquivo e salvar
            const response = await axios_1.default.get(url, { responseType: 'arraybuffer' });
            await fs_extra_1.default.writeFile(filePath, response.data);
            return filePath;
        });
        // Aguardar o download de todos os arquivos
        const files = await Promise.all(downloadPromises);
        // Passo 2: Criar um ZIP dos arquivos baixados
        const zip = new jszip_1.default();
        for (const file of files) {
            const fileData = await fs_extra_1.default.readFile(file);
            zip.file(path_1.default.basename(file), fileData);
        }
        const zipData = await zip.generateAsync({ type: 'nodebuffer' });
        // Salvar o ZIP e fornecer o link para download
        const zipPath = path_1.default.join(downloadDir, 'download.zip');
        await fs_extra_1.default.writeFile(zipPath, zipData);
        res.status(200).json({ message: 'Arquivos compactados com sucesso!', downloadLink: `http://localhost:${PORT}/download/zip` });
    }
    catch (error) {
        console.error('Erro ao baixar os arquivos:', error);
        res.status(500).json({ message: 'Erro ao baixar os arquivos.' });
    }
});
// Rota para baixar o ZIP gerado
app.get('/download/zip', (req, res) => {
    const zipPath = path_1.default.join(downloadDir, 'download.zip');
    // Verificar se o arquivo existe antes de tentar enviá-lo
    if (fs_extra_1.default.existsSync(zipPath)) {
        res.download(zipPath, 'download.zip', () => {
            // Após o download, limpar a pasta temporária
            fs_extra_1.default.emptyDirSync(downloadDir);
        });
    }
    else {
        res.status(404).json({ message: 'Arquivo ZIP não encontrado.' });
    }
});
// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
