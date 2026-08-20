# Banco de Treinamentos NR

Sistema de gestão de treinamentos de Segurança do Trabalho por Norma Regulamentadora (NR), com backend em **Node.js + Express** e persistência em **MongoDB**. Pronto para publicar no **GitHub** e implantar no **Render**.

## Funcionalidades

- Banco de treinamentos em **cards**, com filtros por setor, status (Em dia / Em atenção / Vencido) e NR
- Banco de conteúdos por NR: conteúdo programático e **responsáveis técnicos** (múltiplos instrutores, cada um com nome, número de registro, conteúdo ministrado e data)
- Cadastro de treinamento por funcionário: setor, função, NR, data, carga horária, validade (anual/bienal/trienal/personalizada com cálculo automático), local, dias de treinamento, conteúdo programático, instrutores e certificado em PDF anexado
- **Lista de presença** com preenchimento automático dos colaboradores em atenção/vencidos ao selecionar a NR
- Ao salvar a lista de presença, o sistema **gera automaticamente** os **comprovantes de entrega** e os **certificados** (frente e verso) de todos os participantes em um único documento pronto para impressão/PDF
- Certificado com **conteúdo programático no verso**, junto da relação de instrutores por conteúdo/data
- **Logomarca** da empresa configurável, aplicada ao cabeçalho do sistema e aos documentos impressos
- Setores e responsáveis por setor
- Dois modos de acesso:
  - **Administrador** (protegido por senha): acesso completo
  - **Consulta**: acesso apenas ao Painel e ao Banco de Treinamentos com filtros (somente leitura)

## Stack técnica

- Node.js + Express (API REST)
- MongoDB + Mongoose
- Frontend estático (HTML, CSS e JavaScript puros — sem build step)

## Estrutura do projeto

```
nr-training-system/
├── server.js              # ponto de entrada do servidor Express
├── seed.js                 # script para popular setores e NRs padrão
├── seedData.js              # dados padrão (setores e NRs)
├── package.json
├── render.yaml               # blueprint de deploy no Render
├── .env.example
├── models/                   # schemas Mongoose
│   ├── Setor.js
│   ├── NRType.js
│   ├── Treinamento.js
│   └── Config.js
├── routes/                   # rotas REST
│   ├── auth.js
│   ├── setores.js
│   ├── nrtypes.js
│   ├── treinamentos.js
│   └── config.js
├── middleware/
│   └── adminAuth.js
└── public/                   # frontend estático servido pelo Express
    ├── index.html
    ├── css/style.css
    └── js/app.js
```

## 1. Rodando localmente

### Pré-requisitos
- Node.js 18 ou superior
- Uma conexão MongoDB (Atlas na nuvem, gratuito, ou MongoDB local)

### Passos

```bash
# instalar dependências
npm install

# copiar o arquivo de ambiente e preencher os valores
cp .env.example .env
```

Edite o `.env`:

```
MONGODB_URI=coloque_aqui_a_string_de_conexao_do_mongodb
ADMIN_PASSWORD=escolha_uma_senha_forte
PORT=3000
```

```bash
# (opcional) popular o banco com setores e NRs padrão
node seed.js

# iniciar o servidor
npm start
```

Acesse **http://localhost:3000**.

## 2. Criando o banco no MongoDB Atlas (gratuito)

1. Crie uma conta em https://www.mongodb.com/cloud/atlas/register
2. Crie um **cluster gratuito (M0)**
3. Em **Database Access**, crie um usuário com senha
4. Em **Network Access**, libere o acesso (`0.0.0.0/0` para simplificar, ou o IP do Render)
5. Em **Database → Connect → Drivers**, copie a *connection string*, algo como:
   ```
   mongodb+srv://usuario:senha@cluster0.xxxxx.mongodb.net/nr-treinamentos?retryWrites=true&w=majority
   ```
6. Use essa string como `MONGODB_URI`

## 3. Publicando no GitHub

```bash
git init
git add .
git commit -m "Sistema de banco de treinamentos NR"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

> O arquivo `.gitignore` já garante que `node_modules/` e `.env` não sejam enviados ao repositório.

## 4. Implantando no Render

### Opção A — usando o `render.yaml` (Blueprint)
1. Faça o push do projeto para o GitHub (passo anterior)
2. No Render, clique em **New → Blueprint** e aponte para o repositório
3. O Render vai ler o `render.yaml` automaticamente
4. Defina as variáveis de ambiente solicitadas: `MONGODB_URI` e `ADMIN_PASSWORD`
5. Clique em **Apply** — o deploy inicia automaticamente

### Opção B — manual
1. No Render, clique em **New → Web Service**
2. Conecte o repositório do GitHub
3. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Em **Environment**, adicione:
   - `MONGODB_URI` → sua connection string do Atlas
   - `ADMIN_PASSWORD` → a senha do modo administrador
5. Clique em **Create Web Service**

Após o deploy, o Render fornece uma URL pública (ex: `https://banco-treinamentos-nr.onrender.com`) — é ela que deve ser compartilhada com a equipe.

## 5. Primeiro acesso

- **Administrador:** use a senha definida em `ADMIN_PASSWORD`
- **Consulta:** não precisa de senha, mas só enxerga o Painel e o Banco de Treinamentos

Ao entrar como administrador pela primeira vez, cadastre:
1. Os **setores** e responsáveis
2. Ajuste o **banco de conteúdo por NR** (conteúdo programático e instrutores padrão), se necessário
3. Cadastre os **treinamentos** dos funcionários
4. Em **Documentos**, envie a **logomarca** da empresa

## Segurança — observações importantes

- A autenticação de administrador é intencionalmente simples (uma senha compartilhada, comparada no servidor via variável de ambiente). Isso é adequado para uso interno de uma equipe pequena, mas **não é uma autenticação de nível produção**.
- Para um ambiente com múltiplos administradores, dados sensíveis ou exigências de auditoria, recomenda-se evoluir para autenticação por usuário (ex: JWT + bcrypt) antes de expor o sistema publicamente.
- Sempre acesse o sistema em produção via **HTTPS** (o Render já fornece isso automaticamente).
- Troque a senha padrão de exemplo (`admin2026`) antes de qualquer uso real.

## Licença

MIT — livre para uso e adaptação.
