# CISBAF Solicita — Estado Atual do Projeto

> Documento de referência do estado atual da aplicação, gerado para servir de base às melhorias futuras.
> Data: 2026-06-23

---

## 1. Visão Geral

O **CISBAF Solicita** é um sistema web para solicitação de **cópias de Boletim de Atendimento do SAMU**. Permite que cidadãos (paciente ou representante) abram um pedido on-line, anexem documentos e acompanhem o andamento por protocolo, enquanto a equipe administrativa avalia, confirma ou cancela cada solicitação por um painel interno.

Domínio público em produção: `https://atendimentocrur.cisbaf.org.br`.

Arquitetura: **monólito integrado** — o backend Django serve a API REST e também entrega o build estático do frontend React na mesma origem.

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Backend | Django + Django REST Framework | Django 5.2.10 / DRF 3.16.1 |
| Autenticação | SimpleJWT (Basic + Session + JWT) | 5.5.1 |
| CORS | django-cors-headers | 4.9.0 |
| Filtros | django-filter | 25.2 |
| Frontend | React + TypeScript + Vite | React 19 / Vite 7 |
| UI | Chakra UI 3 + Framer Motion + react-icons | 3.32 |
| Formulários | react-hook-form + Zod | 7.71 / 4.x |
| Roteamento | react-router-dom | 7.13 |
| Editor de texto | TipTap | 3.19 |
| Banco (produção) | MySQL | via `DATABASE_URL` |
| Banco (configurado em settings) | SQLite | `db.sqlite3` |
| Containerização | Docker multi-stage + docker-compose + nginx | — |

Tamanho do código: ~2.800 linhas de Python (excluindo migrações/venv) e ~5.400 linhas de TypeScript/TSX.

---

## 3. Estrutura do Repositório

```
cisbaf_solicita/
├── django/src/              # Backend
│   ├── app/                 # Projeto Django (settings, urls, wsgi/asgi)
│   ├── authjwt/             # Login/refresh/logout/verify via JWT
│   ├── document_request/    # Núcleo: pedido, status, protocolo, serviços
│   ├── applicant/           # Solicitante (paciente ou representante)
│   ├── applicant_document/  # Documentos anexados pelo solicitante
│   ├── incident/            # Ocorrência que originou o pedido
│   ├── protocol_counter/    # Contador anual de protocolo
│   ├── frontend/            # App que serve o index.html do Vite
│   └── utils/               # Validações (CPF, RG, celular, e-mail) e formatação
├── boletim-vite/            # Frontend
│   └── src/
│       ├── pages/           # Home, SolicitarCopia, Acompanhar, Painel, Login
│       ├── components/      # form/, painel/, ui/, layout
│       ├── hooks/           # useGet, usePost, useGetAuth, usePostAuth, useToast
│       ├── domain/          # Schemas Zod e tipos
│       ├── helpers/         # API, formData, parse de erros, menu
│       └── utils/           # datas, máscaras, camel/snake case
├── Dockerfile               # Build Vite → backend Python (multi-stage)
├── docker-compose.yml
└── nginx/nginx.conf
```

---

## 4. Modelo de Domínio

O fluxo gira em torno de **DocumentRequest** (pedido de documento), que agrega solicitante, ocorrência e histórico de status.

**DocumentRequest** (`pedido_documento`)
- Protocolo único gerado automaticamente por ano (`{ano}-{0000}`), via `ProtocolCounter` com bloqueio transacional (`select_for_update`).
- Finalidades: Óbito, DPVAT, INSS, Seguro, Inventário, Ação Judicial, Outros.
- Regra: finalidade "Outros" exige `other_purpose`; demais finalidades devem deixá-lo vazio.
- Ao criar o pedido, um `DocumentStatus` inicial é gerado automaticamente.

**DocumentStatus**
- Estados: `aguardando` → `confirmado` → `cancelado`.
- Transições controladas: de *aguardando* pode ir para *confirmado* ou *cancelado*; de *confirmado* só para *cancelado*; *cancelado* é terminal.
- Cada mudança registra usuário e comentário (histórico/timeline).

**Applicant** (`solicitante`)
- Tipo: Paciente ou Representante.
- Regras: representante deve informar grau de parentesco (familiar, cônjuge, procurador); paciente não pode informar. Em pedidos de óbito, o solicitante não pode ser o próprio paciente.
- CPF, RG e celular são normalizados para apenas dígitos; validações automáticas no `save`.

**Incident** (ocorrência)
- Data, hora, nome do paciente, município (lista fixa da Baixada Fluminense/RJ), bairro, endereço, local de atendimento.
- Regra: se o local for "Outro", a descrição é obrigatória.

**ApplicantDocument**
- Tipos: documento com foto do paciente/solicitante, certidão de casamento/união, procuração, certidão de óbito.
- Arquivos enviados para `media/applicants/documents/%Y/%m/`.

**DocumentRectification** (`retificacao_documento`) — *adicionado em 2026-07-09*
- Protocolo de retificação aberto sobre um `DocumentRequest` já **confirmado**, quando o solicitante identifica uma informação incorreta ao retirar o documento presencialmente.
- Abertura pública (`document/rectifications/create/`): exige o protocolo do pedido e o CPF do solicitante, que é conferido contra o `Applicant.cpf` cadastrado. Só é aceita se o pedido estiver confirmado e não houver outra retificação em andamento (`DocumentRequest.has_open_rectification()`).
- Histórico próprio via `DocumentRectificationStatus` (append-only, mesmo padrão de `DocumentStatus`): `solicitada` → `agendada` → `concluida`/`cancelada`.
- Aparece embutida na resposta de `document/requests/` (público) e `document/admin/requests/` (painel), mesclada à linha do tempo do pedido no frontend.

---

## 5. API (rotas principais)

```
auth/login    auth/refresh    auth/logout    auth/verify    auth/user      (JWT)
document/create/                          # criação pública do pedido
document/requests/        (público)       # consulta por protocolo (acompanhar)
document/admin/requests/  (privado)       # listagem/detalhe para o painel
document/status/                          # registrar mudança de status
document/rectifications/create/           # abertura pública de retificação (protocolo + CPF)
document/rectifications/status/           # atualização de status da retificação (uso administrativo)
```

Paginação padrão DRF: `PAGE_SIZE = 5`. JWT: access 30 min, refresh 7 dias.

Roteamento: todas as rotas de API vêm antes do *catch-all* `^.*$` que serve o `index.html` do frontend (necessário porque front e back compartilham origem).

---

## 6. Frontend (páginas)

- **Home** — entrada e navegação.
- **SolicitarCopia** — formulário multi-etapas (stepper): solicitante → ocorrência → anexos, com validação Zod e progresso.
- **Acompanhar / Retificar** — consulta pública do andamento por protocolo, com timeline unificada de status e retificações. Quando o pedido está `confirmado`, exibe "Solicitar Retificação", que abre um modal de confirmação de identidade por CPF (`RectificationModal`) antes de criar o protocolo de retificação.
- **Painel** — área administrativa protegida (`PrivateRoute`): tabela de pedidos, filtros dinâmicos, busca, abas por status ("Aguardando", "Retificações" e "Buscar" — as duas primeiras com contagem no rótulo, ex. `Aguardando (10)`), detalhe, respostas automáticas e visualização de anexos. A aba "Retificações" reaproveita `document/requests/?status=retificando` (pseudo-valor que filtra pedidos com retificação em aberto). No drawer de resposta, se o pedido tem retificação em aberto, só os controles da retificação (Agendar/Concluir/Cancelar) aparecem — a decisão normal (Aprovar/Rejeitar) fica oculta até a retificação ser resolvida.
- **Login** — autenticação JWT, com `AuthContext` e `LoadingContext`.

---

## 7. Integrações

- **Notificação WhatsApp**: ao criar pedido, `services.py` envia POST para um serviço interno (`http://192.168.1.10:8001/notification`) avisando o administrador (número fixo no código) com o link de acompanhamento. Timeout de 3s e falhas são silenciadas.

---

## 8. Deploy / Infraestrutura

- **Dockerfile multi-stage**: etapa 1 builda o Vite (Node 22); etapa 2 (Python 3.12-slim) copia o backend e injeta o `dist/` em `static/frontend`.
- **docker-compose**: serviço único `application` na porta 8000, com volumes para `dist/` e código Django (hot-reload em dev).
- **nginx**: reverse proxy (configuração em `nginx/nginx.conf`).
- Comando atual de produção: `runserver` (servidor de desenvolvimento do Django).

---

## 9. Riscos e Pontos de Atenção

Itens que merecem prioridade antes/durante as melhorias:

1. **Segurança de configuração**
   - `DEBUG = True` e `ALLOWED_HOSTS = ["*"]` no settings versionado.
   - `DJANGO_SECRET_KEY` e credenciais de banco (`DATABASE_URL` com usuário/senha) commitados no `.env` versionado. **Recomenda-se rotacionar a secret/senha e remover do versionamento.**
   - `DATABASE_URL` aponta para MySQL, mas `settings.py` usa SQLite fixo — divergência de ambiente a resolver (idealmente via `dj-database-url`/variável de ambiente).

2. **Servidor de produção**
   - `runserver` não deve ser usado em produção. Migrar para Gunicorn/Uvicorn + WhatNoise/arquivos estáticos servidos pelo nginx.

3. **Autenticação**
   - `BasicAuthentication` habilitado junto ao JWT amplia a superfície; avaliar restringir a JWT.
   - Endpoint `document/create/` é público — confirmar se há rate limit/captcha contra abuso.

4. **Valores hardcoded**
   - Número de WhatsApp do admin, URLs internas (`192.168.1.10`) e domínio de acompanhamento fixos no código — mover para configuração.
   - `settings.ts` do frontend alterna URL de API por flag manual (`buildForDjango`) — propenso a erro; usar variáveis de ambiente do Vite.

5. **Cobertura de testes**
   - Backend tem testes em `document_request` (model, views, conversão JSON, detalhe). Frontend tem apenas `schema.test.ts`. Cobertura limitada nas regras de negócio mais sensíveis (transições de status, óbito, parentesco).

6. **Higiene de repositório**
   - `staticfiles/` e `db.sqlite3` aparecem versionados/sem ignore — confirmar `.gitignore`.
   - Múltiplas branches ativas (`master`, `master_dev`, `dev_docker`, `options_for_url`) sem padrão claro de fluxo.

---

## 10. Oportunidades de Melhoria (backlog sugerido)

Agrupadas por área, como ponto de partida para evoluir com o Claude:

**Segurança & Configuração**
- Externalizar settings sensíveis; `DEBUG=False`, `ALLOWED_HOSTS` explícito por ambiente.
- Rotacionar secret/senha de banco e removê-las do histórico do git.
- Padronizar banco por ambiente (SQLite local / MySQL produção via env).

**Produção**
- Substituir `runserver` por Gunicorn + nginx servindo estáticos; pipeline de `collectstatic`.
- Healthcheck e logging estruturado.

**Qualidade**
- Ampliar testes das regras de negócio (status, óbito, parentesco, documentos obrigatórios) e do fluxo do frontend.
- CI (lint + testes) por PR.

**Produto / UX**
- Notificação ao solicitante (não só ao admin) sobre mudanças de status.
- Histórico/auditoria mais rica no painel.
- Tornar a integração de WhatsApp configurável e resiliente (fila/retry).

**Arquitetura (alinhado ao Business Brain)**
- Definir convenção de branches e versionamento.
- Documentar contrato da API (OpenAPI/Swagger via drf-spectacular).
- Preparar pontos de extensão para múltiplas unidades/marcas, caso o sistema seja replicado.

---

## 11. Como Rodar (resumo)

```bash
# Backend (dev)
cd django/src && python manage.py runserver 0.0.0.0:8000

# Frontend (dev)
cd boletim-vite && npm install && npm run dev

# Stack completa
docker compose up --build
```

---

*Documento vivo — atualizar conforme decisões arquiteturais forem registradas.*
