# FoodTruck Pedidos — Deploy no Railway

Este pacote contém todo o código-fonte da aplicação já preparado para ser publicado
no [Railway](https://railway.app) usando **Git + Docker**. Siga os passos abaixo.

---

## Pré-requisitos

- Uma conta no **GitHub** (ou GitLab).
- Uma conta no **Railway**.
- **Git** instalado na sua máquina.

---

## Passo 1 — Enviar o código para o seu repositório Git

Descompacte este pacote numa pasta e, dentro dela, rode:

```bash
git init
git add .
git commit -m "FoodTruck Pedidos - versao inicial"

# crie um repositorio vazio no GitHub e cole a URL dele abaixo:
git remote add origin https://github.com/SEU_USUARIO/foodtruck-pedidos.git
git branch -M main
git push -u origin main
```

> O arquivo `.gitignore` já está configurado para **não** enviar `node_modules`,
> builds e o `.env` (que contém segredos). Nunca versione o `.env`.

---

## Passo 2 — Criar o projeto no Railway

1. Acesse o Railway → **New Project** → **Deploy from GitHub repo**.
2. Autorize o Railway a acessar seu GitHub e selecione o repositório recém-criado.
3. O Railway vai detectar o **Dockerfile** automaticamente e usá-lo para o build.

---

## Passo 3 — Adicionar o banco de dados PostgreSQL

1. Dentro do projeto no Railway, clique em **New** → **Database** → **Add PostgreSQL**.
2. Isso cria um serviço Postgres com a variável `DATABASE_URL` pronta.

---

## Passo 4 — Configurar as variáveis de ambiente

No serviço da **aplicação** (não no banco), abra a aba **Variables** e defina:

| Variável          | Valor                                                                 |
|-------------------|-----------------------------------------------------------------------|
| `DATABASE_URL`    | `${{Postgres.DATABASE_URL}}`  *(referência ao serviço Postgres)*      |
| `NEXTAUTH_SECRET` | um valor aleatório seguro — gere com `openssl rand -base64 32`         |
| `AUTH_SECRET`     | outro valor aleatório seguro (`openssl rand -base64 32`)              |
| `NEXTAUTH_URL`    | a URL pública do app (ex.: `https://seu-app.up.railway.app`)          |

> **Dica:** o valor `${{Postgres.DATABASE_URL}}` é uma *referência* — o Railway
> preenche automaticamente com a string de conexão do banco. Digite exatamente assim.
>
> A `NEXTAUTH_URL` você só conhece depois que o Railway gerar o domínio
> (Passo 6). Pode deixar em branco no primeiro deploy e preencher em seguida,
> fazendo um novo deploy.

Consulte o arquivo `.env.example` para referência das variáveis.

---

## Passo 5 — Gerar o domínio público

Na aba **Settings** do serviço da aplicação → **Networking** → **Generate Domain**.
Copie a URL gerada e use-a na variável `NEXTAUTH_URL` (Passo 4). Faça um novo deploy
depois de ajustar a variável.

---

## Passo 6 — Criação das tabelas e dados iniciais

- **Tabelas:** são criadas automaticamente a cada inicialização — o comando de start
  roda `prisma db push` antes de subir o servidor. Você não precisa fazer nada.
- **Dados iniciais (usuário admin + produtos de exemplo):** rode o *seed* uma vez.
  No Railway, abra o serviço da aplicação → aba **Settings** (ou o menu do deploy) →
  **Run a command**, e execute:

  ```bash
  yarn db:seed
  ```

  Alternativamente, rode localmente apontando para o banco do Railway:

  ```bash
  DATABASE_URL="<a DATABASE_URL do Railway>" yarn db:seed
  ```

---

## Passo 7 — Acessar o sistema

Abra a URL pública do app. O login administrativo fica em `/login`:

- **Usuário:** `admin`
- **Senha:** `admin123`

> ⚠️ **Troque a senha imediatamente** após o primeiro acesso, no menu
> **Configurações** dentro do painel administrativo.

---

## Como funciona a configuração do banco de dados

- O arquivo **`prisma/schema.prisma`** define todas as tabelas e lê a conexão da
  variável `DATABASE_URL` (`datasource db { url = env("DATABASE_URL") }`).
- O **`Dockerfile`** e o **`railway.json`** cuidam de: instalar dependências,
  gerar o Prisma Client, compilar o app, aplicar o schema no banco e iniciar.
- Não há necessidade de editar nada para trocar de banco: basta apontar a
  `DATABASE_URL` para o Postgres desejado.

---

## Estrutura dos arquivos de deploy incluídos

| Arquivo             | Função                                                              |
|---------------------|--------------------------------------------------------------------|
| `Dockerfile`        | Receita de build/execução (Node 20 + OpenSSL + Yarn 4)             |
| `railway.json`      | Configuração do Railway (builder Docker + comando de start)         |
| `.dockerignore`     | Arquivos ignorados na imagem Docker                                 |
| `.gitignore`        | Arquivos que não vão para o Git (inclui `.env`)                     |
| `.env.example`      | Modelo das variáveis de ambiente                                   |
| `prisma/schema.prisma` | Esquema do banco de dados (PostgreSQL)                          |

---

## Resolução de problemas

- **Erro de autenticação / redirecionamento:** confirme que `NEXTAUTH_URL` está com
  a URL pública correta e que `NEXTAUTH_SECRET` e `AUTH_SECRET` estão definidos.
- **App não conecta ao banco:** verifique se `DATABASE_URL` está como
  `${{Postgres.DATABASE_URL}}` e se o serviço Postgres está no mesmo projeto.
- **Login `admin` não funciona:** rode o seed (Passo 6) para criar o usuário admin.
