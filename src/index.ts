import express, { Request, Response, Router } from 'express';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs-extra';
import JSZip from 'jszip';
import path from 'path';
import sequelize from './database';
import { DownloadHistorico } from './models/download-historico';
import { Usuario } from './models/usuario';
import jwt from 'jsonwebtoken';
import ytdl from 'ytdl-core';
import { downloadVideo } from './models/download-video';


export const app = express();
const PORT = 3000;
const downloadDir = './temp';

// Sincronizar com o banco de dados
sequelize.sync().then(() => {
  console.log('Banco de dados e tabela downloads criado.');
});

// Configuração básica para permitir a origem do frontend
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));

app.use(cors(), (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  next();
});

// Rota para registrar um novo usuário
// app.post('/register', async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     const hashedPassword = await Usuario.hashPassword(password);
//     const user = await Usuario.create({ username, password: hashedPassword });
//     res.status(201).json({ message: 'Usuário criado com sucesso', userId: user.id });
//   } catch (error) {
//     res.status(500).json({ error: 'Erro ao criar o usuário' });
//   }
// });

// Rota para login de usuário
// app.post('/login', async (req: Request, res: Response) => {
//   const { username, password } = req.body;

//   const user = await Usuario.findOne({ where: { username } });
//   if (!user || !(await user.comparePassword(password))) {
//     res.status(401).json({ error: 'Usuário ou senha inválidos' });
//     return;
//   }

//   const token = jwt.sign({ id: user.id }, 'seu_segredo_aqui', { expiresIn: '1h' });
//   res.json({ token });
// });

// Middleware para autenticação
// const authenticateJWT = (req: Request, res: Response, next: any) => {
//   const token = req.header('Authorization')?.split(' ')[1];

//   if (!token) {
//     res.sendStatus(403);
//     return;
//   }

//   jwt.verify(token, 'seu_segredo_aqui', (err, user) => {
//     if (err) {
//       res.sendStatus(403);
//       return;
//     }
//     // req.user = user;
//     next();
//   });
// };

// Rota principal para enviar URL e iniciar o download
const router = Router();

const routes = Router();

router.post('/download', async (req: Request, res: Response) => {
  const { url } = req?.body;

  if (!ytdl.validateURL(url)) {
    res.status(400).json({ error: 'URL inválida' });
    return
  }

  const videoId = ytdl.getURLVideoID(url);

  res.header('Content-Disposition', `attachment; filename="${videoId}.mp4"`);

  console.log('url aqui', url)

  try {
    const filePath = await downloadVideo(url);
    console.log('filePath:', filePath);

    // Retorna o caminho relativo
    const relativeFilePath = path.relative(__dirname, filePath).replace(/\\/g, '/');

    //Salvar historico
    // try {
    //   const download = await DownloadHistorico.create({
    //     relativeFilePath,
    //     status: 'completed',
    //   });

    //   res.status(201).json(download);
    // } catch (error) {
    //   res.status(500).json({ error: 'Erro ao salvar o download' });
    // }

    res.status(200).json({ message: 'Download concluído com sucesso', filePath: relativeFilePath });
  } catch (error) {
    console.error('Erro ao baixar o vídeo:', error);
    res.status(500).json({ error: 'Erro ao baixar o vídeo' });
  }

  // try {
  //   ytdl(url, { filter: format => format.container === 'mp4' })
  //     .pipe(res)
  //     .on('finish', async () => {
  //       console.log('Download completo');

  //     })
  //     .on('error', (error) => {
  //       console.error('Erro durante o download:', error);
  //       res.status(500).json({ error: 'Erro durante o download' });
  //     });
  // } catch (error) {
  //   console.error('Erro ao baixar o arquivo:', error);
  //   res.status(500).json({ message: 'Erro ao baixar o arquivo.' });
  // }
})

routes.use('/', router);

app.use(routes);

// Rota para baixar o ZIP gerado
// app.get('/download/zip', (req: Request, res: Response) => {
//   const zipPath = path.join(downloadDir, 'download.zip');

//   // Verificar se o arquivo existe antes de tentar enviá-lo
//   if (fs.existsSync(zipPath)) {
//     res.download(zipPath, 'download.zip', () => {
//       // Após o download, limpar a pasta temporária
//       fs.emptyDirSync(downloadDir);
//     });
//   } else {
//     res.status(404).json({ message: 'Arquivo ZIP não encontrado.' });
//   }
// });

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});



// Garantir que a pasta temporária existe
// await fs.ensureDir(downloadDir);

// try {
//   // Passo 1: Baixar cada arquivo e salvar na pasta temporária
//   // const downloadPromises = urls.map(async (url, index) => {
//   //   const fileName = `file${index + 1}${path.extname(url)}`;
//   //   const filePath = path.join(downloadDir, fileName);

//   //   // Baixar o arquivo e salvar
//   //   const response = await axios.get(url, { responseType: 'arraybuffer' });
//   //   await fs.writeFile(filePath, response.data);
//   //   return filePath;
//   // });

//   // Aguardar o download de todos os arquivos
//   // const files = await Promise.all(downloadPromises);

//   // Passo 2: Criar um ZIP dos arquivos baixados
//   const zip = new JSZip();
//   for (const file of files) {
//     const fileData = await fs.readFile(file);
//     // Salvar no banco de dados
//     try {
//       const download = await DownloadHistorico.create({
//         file,
//         status: 'completed', // ou 'failed' dependendo do resultado do download
//       });

//       res.status(201).json(download);
//     } catch (error) {
//       res.status(500).json({ error: 'Erro ao salvar o download' });
//     }
//     zip.file(path.basename(file), fileData);
//   }

//   const zipData = await zip.generateAsync({ type: 'nodebuffer' });

//   // Salvar o ZIP e fornecer o link para download
//   const zipPath = path.join(downloadDir, 'download.zip');
//   await fs.writeFile(zipPath, zipData);

//   res.status(200).json({ message: 'Arquivos compactados com sucesso!', downloadLink: `http://localhost:${PORT}/download/zip` });
// } catch (error) {
//   console.error('Erro ao baixar os arquivos:', error);
//   res.status(500).json({ message: 'Erro ao baixar os arquivos.' });
// }