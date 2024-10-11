import fs from 'fs';
import path from 'path';
import ytdl, { Agent, videoFormat, videoInfo } from '@distube/ytdl-core';

interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
}

let cookies: Cookie[] = [];
try {
  cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf-8')) as Cookie[];
} catch (err) {
  console.error('Erro ao carregar os cookies:', (err as Error).message);
}

const dataFile: string = path.join(__dirname, 'quantidade-videos.json');

// Função para carregar a quantidade de vídeos
function loadQuantidadeVideos(): number {
  if (fs.existsSync(dataFile)) {
    const data = fs.readFileSync(dataFile, 'utf-8');
    return JSON.parse(data).quantidadeVideos as number;
  } else {
    return 0;
  }
}

// Função para salvar a quantidade de vídeos
function saveQuantidadeVideos(quantidade: number): void {
  const data = { quantidadeVideos: quantidade };
  fs.writeFileSync(dataFile, JSON.stringify(data), 'utf-8');
}

// Criar o agente com cookies
const agent: Agent = ytdl.createAgent(cookies);

// Função para download de vídeos
async function downloadVideo(url: string): Promise<string> {
  if (!url || typeof url !== 'string') {
    throw new Error('URL inválida!');
  }

  try {
    const info: videoInfo = await ytdl.getInfo(url, { agent });

    // Selecionar o formato desejado
    const format: videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'videoandaudio' });
    // console.log('Formato encontrado:', format);

    const title: string = info.videoDetails.title
      .replace(/[<>:"\/\\|?*#]+/g, '') // Remover caracteres inválidos
      .replace(/[\u{1F600}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ''); // Remover emojis e caracteres especiais

    const output: string = path.join(__dirname, 'videos', `${title}.mp4`);

    // Cria a pasta se não existir
    if (!fs.existsSync(path.join(__dirname, 'videos'))) {
      fs.mkdirSync(path.join(__dirname, 'videos'));
    }

    // Retorna uma promessa que resolve quando o vídeo é baixado
    return new Promise((resolve, reject) => {
      ytdl(url, { format, agent })
        .pipe(fs.createWriteStream(output))
        .on('finish', () => {
          console.log(`Download concluído: ${output}`);

          let quantidade: number = loadQuantidadeVideos();
          quantidade += 1;
          saveQuantidadeVideos(quantidade);
          console.log(`Quantidade de vídeos baixados: ${quantidade}`);

          resolve(output);
        })
        .on('error', (err) => {
          console.error(`Erro durante o download: ${(err as Error).message}`);
          if (fs.existsSync(output)) {
            fs.unlinkSync(output); // Remove o arquivo corrompido
          }
          reject(err);
        });
    });

  } catch (err) {
    console.error(`Erro ao obter informações do vídeo: ${(err as Error).message}`);
    throw err;
  }
}

// Exportar as funções para uso em outros módulos
export { downloadVideo, loadQuantidadeVideos };
