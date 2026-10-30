// Servidor estático mínimo, sem dependências: `npm start` → http://localhost:5173
// Necessário porque o projeto usa módulos ES, que o navegador não carrega via file://
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT) || 5173;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    let file = resolve(join(ROOT, normalize(decodeURIComponent(pathname))));

    // Nunca sair da pasta do projeto (path traversal).
    if (file !== ROOT && !file.startsWith(ROOT + sep)) { res.writeHead(403).end('Proibido'); return; }

    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');

    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Não encontrado');
  }
}).listen(PORT, () => console.log(`Sentinela rodando em http://localhost:${PORT}  (Ctrl+C para parar)`));
