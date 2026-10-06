# Arquitetura da V1

## Fluxo de navegacao

1. `src/App.tsx` interpreta `forge://` como pagina interna e envia outros enderecos pela API estreita de `electron/preload.cjs`.
2. `electron/navigation.cjs` valida URLs HTTP/HTTPS e transforma termos em pesquisas no mecanismo selecionado.
3. `electron/main.cjs` cria um `WebContentsView` por aba externa. Apenas a view da aba ativa fica visivel e ocupa o retangulo medido pela interface React.
4. Eventos de navegacao, titulo, seguranca e erro retornam por IPC para atualizar a barra e registrar historico local.

Conteudo remoto nao recebe preload, Node.js, IPC, nem acesso direto ao DOM da interface. O processo principal valida remetentes IPC e argumentos importantes. Rotas internas nunca sao carregadas em views remotas.

## Estado

- Favoritos, pastas, links rapidos, historico e aparencia: armazenamento local da interface em uma versao de esquema `forge.v1`.
- Configuracoes com efeitos nativos e registros de downloads: JSON atomico no `userData` do Electron.
- Cookies e armazenamento de paginas: particao Chromium `persist:forge-web`.
- Janela privada: particoes de sessao sem prefixo `persist:` e shell separado.
- Aba privada em janela comum: particao efemera por aba; historico automatico nao e gravado.
- A ultima sessao de abas normais pode ser restaurada; abas privadas nao entram no snapshot.

## Integracoes

- `src/services/forgeAccount.ts`: Auth Supabase opcional. Precisa apenas da URL e chave publica. Nunca recebe a chave de servico.
- `src/services/gameCenter.ts`: contrato local para um destino HTTPS configurado pelo usuario. Nao assume API do Game Center.
- `electron/updates.cjs`: consulta GitHub Releases somente quando um repositorio publico esta configurado. Instalar a atualizacao continua manual.
- `scripts/prepare-desktop.cjs`, `electron-builder.yml` e `build/installer.nsh`: manifesto de execucao gerado separadamente e pacote Windows NSIS com escolha de atalho de area de trabalho.

## Evolucao

Para sincronizacao futura, mantenha o armazenamento local como fallback e crie adaptadores em `src/services/`. Para outros sistemas desktop, adapte empacotamento e chrome nativo sem alterar a validacao das URLs. Para mobile, reutilize componentes e tipos, mas implemente uma camada nativa propria; Electron nao e um shell mobile.