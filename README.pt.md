# n8n-nodes-oryksa

[![English](https://img.shields.io/badge/English-30363d?style=for-the-badge)](README.md) [![Português](https://img.shields.io/badge/Portugu%C3%AAs-0891b2?style=for-the-badge)](README.pt.md) [![Español](https://img.shields.io/badge/Espa%C3%B1ol-30363d?style=for-the-badge)](README.es.md) [![Français](https://img.shields.io/badge/Fran%C3%A7ais-30363d?style=for-the-badge)](README.fr.md)

Este é um node da comunidade n8n. Permite usar a [ORYKSA](https://oryksa.com) nos teus workflows do n8n.

A ORYKSA é um assistente de IA para o teu negócio. Com este node, um workflow pode usar a ORYKSA como o seu modelo de IA, perguntar ao teu próprio assistente ORYKSA (que conhece o teu negócio), deixá-lo agir por ti com a tua aprovação, criar imagens, transformar áudio em texto e texto em voz, e arrancar quando algo acontece na ORYKSA.

Tudo é pago com as interações do teu plano ORYKSA. Não há crédito separado nem outra chave de fornecedor de IA para gerir.

[Instalação](#instalação) · [Credenciais](#credenciais) · [Operações](#operações) · [Exemplos](#exemplos) · [Extrato de utilização](#extrato-de-utilização) · [Compatibilidade](#compatibilidade) · [Recursos](#recursos) · [Autor](#autor)

## Instalação

Segue o [guia de instalação](https://docs.n8n.io/integrations/community-nodes/installation/) na documentação dos community nodes do n8n e instala `n8n-nodes-oryksa`.

### Instalação manual a partir de um ficheiro de pacote

Enquanto o pacote não estiver no npm, podes instalar o ficheiro `.tgz` à mão. Na pasta onde o n8n guarda os community nodes (`~/.n8n/nodes`, cria-a se não existir) executa:

```bash
npm install --omit=dev --legacy-peer-deps --ignore-scripts --package-lock=false ./n8n-nodes-oryksa-0.1.2.tgz
```

Depois reinicia o n8n. As opções importam: sem elas o npm tenta instalar e compilar os pacotes do próprio n8n, que o n8n já tem.

O n8n só carrega community nodes não verificados quando `N8N_UNVERIFIED_PACKAGES_ENABLED` é `true`. É o valor por omissão hoje; o n8n anunciou que passará a `false`, por isso define-o tu se os nodes não aparecerem.

## Credenciais

1. Inicia sessão em [developer.oryksa.com](https://developer.oryksa.com) e abre **API keys**.
2. Cria uma chave. Começa por `oryk_live_`.
3. No n8n, cria uma credencial **ORYKSA API** e cola a chave.

O n8n testa a chave quando a guardas.

## Operações

### Node ORYKSA

| Resource | Operation | O que faz | Custo |
| --- | --- | --- | --- |
| Model | Message a Model | Envia um prompt à ORYKSA como modelo de IA geral, no lugar de outro fornecedor de IA. Suporta prompt de sistema, saída em JSON, temperatura e limite de tokens. | 1 interação por resposta |
| Assistant | Ask | Pergunta ao teu próprio assistente ORYKSA. Responde com o conhecimento e os dados do teu negócio. Nunca age. | 1 interação por resposta |
| Assistant | Do | Pede ao teu assistente que faça algo. O que fica dentro da tua conta (um contacto, uma tarefa, uma nota) é feito logo. Tudo o que é enviado a outra pessoa, e qualquer alteração de definições, espera por uma aprovação. | 1 interação por resposta, mais o custo da ação |
| Assistant | Approve | Executa o que um **Do** anterior deixou à espera. O ID da aprovação vem na saída do **Do**. | O custo da ação aprovada |
| Image | Create | Cria uma imagem a partir de uma descrição, no tamanho exato que escolheres, e devolve o seu endereço e o ficheiro. | 10 interações |
| Audio | Transcribe | Transforma uma gravação em texto, com o início e o fim de cada palavra. | 1 interação por minuto iniciado |
| Audio | Generate Speech | Lê um texto em voz alta com a voz da tua conta ORYKSA e devolve um mp3. | 1 interação por cada 500 caracteres iniciados |
| Customer Agent | Send Message | Envia uma mensagem ao agente ORYKSA que atende os teus clientes e devolve a sua resposta. | 1 interação por resposta |
| Knowledge | Get Status, Add FAQ, Learn Website | Lê e amplia o que o teu agente sabe. | Ver a referência da API |
| Conversation | Get, Get Many | Lê as conversas dos teus clientes com o teu agente. | Ver a referência da API |

O **Do** nunca aprova por si. Um workflow tem de chamar **Approve** com o ID da aprovação, normalmente depois de uma pessoa ter dito sim (por exemplo com um node Wait e um formulário). Uma aprovação é válida durante 60 minutos.

### Node ORYKSA Trigger

Arranca o workflow quando algo acontece na tua conta ORYKSA: uma mensagem foi respondida, uma marcação foi criada, o conhecimento foi atualizado, o limite de interações foi atingido.

O node regista um webhook na ORYKSA quando o workflow é ativado e remove-o quando o workflow é desativado. Cada evento é assinado, e o node verifica a assinatura antes de arrancar o workflow.

## Exemplos

### 1. Usar a ORYKSA como o modelo de um workflow

1. Adiciona um node **ORYKSA**. Resource **Model**, operation **Message a Model**.
2. Escreve as instruções em **System Prompt** e o texto em **Message**, por exemplo `{{ $json.text }}`.
3. A resposta vem em `choices[0].message.content`.

### 2. Responder a um e-mail de cliente com a tua aprovação

1. Um trigger dá-te o e-mail (por exemplo o **Gmail Trigger**).
2. Node **ORYKSA**, resource **Assistant**, operation **Do**. Message: `Reply to this email.` Input: o texto do e-mail.
3. A saída tem `status: needs_approval`, o texto que será enviado e `approval.id`.
4. Um node **Wait** com um formulário mostra-te o texto e pergunta sim ou não.
5. Se sim: node **ORYKSA**, resource **Assistant**, operation **Approve**, com `{{ $json.approval.id }}`. O e-mail é enviado.

### 3. Legendas para um vídeo

1. Obtém o áudio do vídeo como ficheiro binário.
2. Node **ORYKSA**, resource **Audio**, operation **Transcribe**. Deixa **Word Times** ligado.
3. A saída tem `text` e `words`, cada palavra com `start` e `end` em segundos. Constrói as legendas a partir delas.

## Extrato de utilização

O node diz à ORYKSA de que workflow vem cada pedido (o nome e o ID do workflow, e o ID da execução). O teu extrato de utilização da ORYKSA mostra então as interações em **n8n**, com o nome do workflow, e soma-as por workflow. É apenas uma etiqueta: não dá nenhuma permissão e não altera nenhum preço.

## Compatibilidade

Construído e verificado com as ferramentas de nodes do n8n (`@n8n/node-cli`). Precisa de uma versão do n8n que suporte community nodes com `n8nNodesApiVersion` 1. Sem dependências externas.

## Recursos

- [Documentação dos community nodes do n8n](https://docs.n8n.io/integrations/#community-nodes)
- [Referência da API da ORYKSA](https://developer.oryksa.com)
- [ORYKSA](https://oryksa.com)

## Autor

Weslley Harakawa ([@weslleyharakawa](https://github.com/weslleyharakawa))

## Licença

[MIT](LICENSE.md)
