# Forge Browser

Navegador gamer da Forge Studios. A V1 usa Electron/Chromium para paginas externas e React + TypeScript para a interface do navegador. O primeiro alvo de distribuicao e Windows 10/11 (x64).

> A visualizacao servida pelo Vite no navegador comum permite explorar as paginas internas. Sites externos abrem em outra guia nessa visualizacao. Navegacao integrada, sessoes privadas, downloads e controles do Chromium exigem Electron.

## Requisitos

- Windows 10 ou 11 x64 para desenvolver e gerar o instalador NSIS.
- Node.js 22 ou superior e npm.
- Conexao com a internet para instalar Electron e, opcionalmente, acessar sites externos.

## Desenvolvimento

```powershell
npm install
powershell -ExecutionPolicy Bypass -File scripts/dev-desktop.ps1
```

O script gera o icone, inicia Vite na porta 5173 e abre o Electron. Para executar em dois terminais manualmente:

```powershell
# Terminal 1
node scripts/generate-icon.cjs
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort

# Terminal 2
npx electron electron/main.cjs
```

`npm run dev` sozinho inicia apenas a visualizacao web. A porta do servidor pode ser alterada por `FORGE_DEV_URL` no processo Electron.

Teste rapido da normalizacao de enderecos: `node --test tests/navigation.test.cjs`. A checagem de tipos usada no workflow e `npx tsc --noEmit`.

## Instalador Windows

```powershell
npm install
powershell -ExecutionPolicy Bypass -File scripts/build-windows.ps1
```

O script executa o build da interface e o electron-builder/NSIS. Saida esperada: `release/Forge Browser Setup.exe`. O instalador assistido permite escolher a pasta de instalacao, instala um atalho no menu Iniciar, pergunta se deve criar um atalho na area de trabalho e inclui desinstalacao. Os arquivos e dependencias de execucao do Electron sao empacotados no instalador. Para distribuicao publica, assine o executavel com um certificado de codigo da Forge Studios.

O comando `npm run build` da raiz gera somente `dist/` (interface). Para gerar o instalador manualmente, depois de `node scripts/generate-icon.cjs` e `npm run build`, execute `node scripts/prepare-desktop.cjs` e `npx electron-builder --projectDir build/desktop-stage --win nsis --x64 --publish never` em Windows. O preparo cria um manifesto de execucao minimo em `build/desktop-stage/`, sem alterar o `package.json` de desenvolvimento nem empacotar dependencias de build.

Uma release publicada no GitHub dispara `.github/workflows/windows-release.yml`, que compila o instalador em `windows-latest`, salva o artifact e o anexa a release. `workflow_dispatch` tambem permite testar o empacotamento sem publicar.

## Estrutura

```text
electron/                 Processo principal, preload, navegacao e armazenamento nativo
src/App.tsx               Estado do navegador e composicao da janela
src/components/           Marca e controles reutilizaveis
src/pages/                Home, Hub, biblioteca, perfil, modo gamer e configuracoes
src/services/             Conta Supabase opcional, Game Center e estado local
src/styles/               Chrome, paginas e responsividade
src/types/                Contratos tipados da ponte IPC
src/utils/                Normalizacao e rotas internas
public/icons/             Arte original Forge
public/wallpapers/        Wallpaper da nova aba
scripts/                  Desenvolvimento, build Windows, staging e geracao do icone ICO
build/                    Customizacao do instalador NSIS
.github/workflows/        Build de release Windows
docs/                     Arquitetura e limites de seguranca
electron-builder.yml      Configuracao do instalador
.env.example              Variaveis opcionais, sem credenciais secretas
```

Veja [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) e [docs/SECURITY.md](docs/SECURITY.md).

## Dependencias principais

- `electron`: Chromium, janelas, sessoes e downloads nativos.
- `react`, `react-dom`, `typescript`, `vite`, `tailwindcss`: interface.
- `lucide-react`: icones da interface.
- `@supabase/supabase-js`: autenticacao opcional quando configurada.
- `electron-builder`: pacote Windows NSIS.
- `jpeg-js`, `pngjs`: converter a arte original em PNG/ICO para Windows.

## Variaveis de ambiente

Copie `.env.example` para `.env` apenas se for conectar a conta Forge:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
FORGE_RELEASES_REPO=
```

As duas variaveis `VITE_` sao opcionais para o navegador e sao incluidas no bundle do renderer: use somente a chave publica/publishable (anon) do Supabase. **Nunca coloque `service_role`, senha do banco, chave privada ou segredo em `.env` com prefixo `VITE_`.** Configure RLS e politicas de Auth no Supabase antes de habilitar contas. Sem essas variaveis, a interface de conta explica que o servico nao esta conectado e navegar nao exige login.

`FORGE_RELEASES_REPO` e opcional para o processo Electron em desenvolvimento. No aplicativo instalado, configure `owner/repository` em Configuracoes > Sistema. A verificacao faz uma consulta real ao endpoint publico de latest release do GitHub. Sem repositorio configurado, ela exibe indisponibilidade; nao simula resultados.

## Funcional na V1

- Navegacao HTTP/HTTPS em `WebContentsView` isolado, URLs, pesquisas, voltar, avancar, atualizar, indicador de carregamento e paginas de erro.
- Abas: criar, fechar, reabrir, fixar, duplicar, arrastar/reordenar e abrir abas privadas; janela privada independente.
- Pagina inicial Forge, atalhos editaveis, barra lateral retratil/posicionavel e temas, wallpapers, transparencia, sons opcionais e barra de favoritos.
- Favoritos com nome, URL, pastas, movimentacao entre pastas, busca e remocao; historico por periodo com busca e limpeza.
- Downloads nativos com pasta, tamanho, progresso, velocidade, pausa, continuacao quando o servidor suporta, cancelamento, abrir e mostrar na pasta.
- Privacidade: sessoes efemeras no modo privado; bloqueio basico de rastreadores conhecidos, pop-ups e notificacoes; permissoes explicitas por origem HTTPS; limpeza de cookies, cache e armazenamento.
- Forge Gamer Mode com RAM, CPU e processos obtidos dos processos Electron, contagem real de abas e downloads e bloqueio de notificacoes.
- Forge Player com tentativa de Picture-in-Picture e controles HTML5 para videos da aba, quando permitidos pelo site.
- Configuracoes salvas localmente e verificacao **real** de releases GitHub quando configurada.

## Preparado para depois

- Forge Hub, Game Center, noticias, jogos, loja e conquistas possuem rotas e interfaces proprias, mas **nao exibem feeds, produtos ou estatisticas inventados**. O Game Center pode abrir um destino HTTPS configurado manualmente; comunicacao nativa entre aplicativos depende de um contrato futuro.
- Perfil e Auth podem usar Supabase com URL/chave publica. XP, conquistas, jogos e sincronizacao de favoritos dependem de tabelas, politicas RLS e APIs reais ainda nao definidas.
- A verificacao de releases abre a release para instalacao manual. Download/aplicacao automatica de updates, assinatura de codigo e canais de update sao trabalhos futuros.
- A arquitetura separa UI, Electron e servicos para portar a interface; macOS, Android e iOS nao sao builds desta V1. Mobile exigira outro shell nativo e outro ciclo de distribuicao.

## Limitacoes conscientes

O bloqueador de rastreadores usa uma lista pequena de dominios conhecidos, nao um filtro completo. O mini player depende de suporte do site a HTML5/Picture-in-Picture. A retomada de downloads depende de suporte a Range, Last-Modified e ETag no servidor. Modo privado nao apaga arquivos que voce baixou. O Gamer Mode nao limita processos nem promete otimizacoes do sistema. O aplicativo nao se define como navegador padrao automaticamente: o botao abre a tela de aplicativos padrao do Windows.

Mantenha funcionalidades existentes ao evoluir a V1; adicione contratos novos sem expor Node.js a paginas externas.