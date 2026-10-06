# Seguranca e privacidade

O processo principal e a unica camada com APIs do sistema. A interface local tem `contextIsolation`, `sandbox`, `webSecurity` e `nodeIntegration: false`. O preload expõe somente metodos de negocio com canais IPC fixos. Cada aba externa usa `WebContentsView` com sandbox e sem preload; nao existe `<webview>` com privilegios Node.

## Politica de origem

- Navegacao de site permite apenas HTTP/HTTPS. `javascript:`, `file:`, `data:` e protocolos arbitrarios nao sao enviados a views externas.
- Janelas solicitadas por sites sao negadas no Electron e links permitidos viram novas abas. Pop-ups automaticos podem ser bloqueados.
- Permissoes de sites comecam negadas; excecoes HTTPS sao configuradas explicitamente pelo usuario. Notificacoes podem ser bloqueadas globalmente.
- O renderer local tem uma politica CSP em `index.html`. O build single-file requer scripts e estilos inline; conteudo remoto nao compartilha esta origem nem o preload.

## Dados privados

Particoes privadas nao usam `persist:`. Historico automatico e snapshot de sessao ignoram abas privadas. Ao fechar uma aba privada, a view fecha e seus dados de site sao limpos. Ao fechar uma janela privada, suas particoes efemeras deixam de existir e downloads privados ativos sao cancelados. Arquivos ja salvos continuam no disco por decisao do usuario.

Os controles de privacidade atuam na particao web do navegador. A lista de rastreadores e intencionalmente basica e deve ser atualizada e auditada antes de se apresentar como protecao abrangente. O estado da interface fica local; nao armazene senhas, tokens de servico ou credenciais do banco em configuracoes locais.

## Distribuicao

O workflow cria um instalador, mas o repositorio nao inclui certificado de assinatura. Antes de distribuir publicamente, configure assinatura de codigo Windows, revise dependencias com `npm audit`, politicas Supabase RLS, atualizacoes de Electron e testes manuais de permissao, links, downloads e instalacao/desinstalacao em Windows 10/11.