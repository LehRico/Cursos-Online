# LeKa Dance Studio — Plataforma de Cursos de Dança Online

Atividade acadêmica: plataforma de cursos de dança (ballet, hip hop, contemporânea, danças urbanas, dança de salão, jazz, sapateado e dança do ventre) com controle de acesso por papel de usuário (aluno, professor, admin), construída em **HTML/CSS/JS puro** (sem framework, sem build) sobre um backend simulado com **json-server**.

O plano de design e o modelo de dados completo estão documentados em [docs/plano-tecnico.md](docs/plano-tecnico.md).

---

## Como rodar

Pré-requisito: Node.js instalado.

```bash
npm install
npm run api    # sobe o json-server em http://localhost:3001 (lê db.json)
npm run web    # em outro terminal: serve a pasta HTML/ em http://localhost:5500
```

Depois abra **http://localhost:5500/login.html** no navegador.

Alternativa sem servidor nenhum para o front-end: dê duplo-clique em `HTML/index.html` (ou `HTML/login.html`) para abrir via `file://` — o `fetch` para `http://localhost:3001` funciona normalmente porque o json-server libera CORS por padrão. Só o `npm run api` é obrigatório.

> ⚠️ Evite servir a pasta `HTML/` com ferramentas que fazem redirecionamento "clean URL" (como `serve`, da Vercel) — elas removem a query string ao tirar o `.html` da URL e quebram os links `curso.html?id=...`. O script `npm run web` já usa `http-server`, que não tem esse problema.

### Contas demo (senha `danca123` para todas)

| Papel | Nome | E-mail |
|---|---|---|
| Admin | Marina Ferraz | marina.ferraz@danca.com |
| Professor | Isadora Nunes | isadora.nunes@danca.com |
| Aluno | Camila Rocha | camila.rocha@email.com |

A tela de login lista só essas 3 contas (uma por papel) — basta clicar numa delas para entrar direto, sem digitar nada. O `db.json` tem outros 15 usuários (mais professores e alunos, com senha igual às de cima) só pra dar volume real aos cursos, turmas e avaliações; eles não aparecem na tela de login, mas dá pra entrar com eles digitando o e-mail manualmente.

---

## Estrutura

```
HTML/
├── index.html, login.html, curso.html, painel-professor.html, painel-admin.html, perfil.html
├── css/            → tokens.css, base.css, componentes.css, animacoes.css + css/paginas/*.css
├── js/
│   ├── dados/       → api.js (cliente do json-server), modalidades.js (metadados fixos)
│   ├── componentes/ → navegacao.js (cabeçalho), ui.js (helpers de render, avisos, revelação)
│   ├── sessao.js, validacoes.js
│   └── paginas/     → 1 arquivo por tela
└── assets/img/modalidades/ → fotos das modalidades (ver LEIA-ME.txt)
db.json               → dados simulados do json-server
docs/plano-tecnico.md → design system e modelo de dados completos
```

---

## Papéis e limitação de autenticação

O `json-server` não tem autenticação nativa — qualquer requisição HTTP é aceita. Por isso, o controle de papéis (aluno / professor / admin) é **inteiramente simulado no front-end**: o "usuário logado" fica salvo no `localStorage` do navegador (`js/sessao.js`) e cada tela decide o que mostrar/permitir com base nisso. Isso não é uma autenticação real — qualquer pessoa com acesso direto à API poderia burlar essas regras. Para o objetivo do exercício (praticar CRUD, validações e regras de acesso por papel), essa simulação é suficiente e está documentada aqui conforme pedido no enunciado.

Resumo das permissões (detalhado em `docs/plano-tecnico.md`):
- **Aluno**: navega cursos publicados, se matricula, atualiza o próprio progresso, avalia cursos concluídos, edita o próprio nome/senha.
- **Professor**: CRUD de cursos, aulas e modalidades; vê matrículas/avaliações dos cursos que leciona.
- **Admin**: tudo isso + CRUD de usuários, troca de papéis e ativação/desativação de contas.

---

## Design

Conceito visual: **"Palco"** — bastidor/teatro com holofotes. Fundo em tom de cortina (vinho profundo, não preto genérico), cards em marfim quente, dourado como acento de marca, e uma cor-gel própria por modalidade de dança (em vez de clichês como sapatilha/clip-art). O elemento de assinatura é a **"Linha de Ritmo"**: um traço ondulado em SVG que se desenha no hero, reaparece como divisor e vira a barra de progresso das matrículas.

### Bibliotecas visuais escolhidas (via skill `find-skills`)

| Biblioteca | Uso | Por quê |
|---|---|---|
| [Fraunces](https://fonts.google.com/specimen/Fraunces) (Google Fonts) | Tipografia de display | Serifa expressiva com itálico "solto" — remete a movimento sem cair no clichê de fonte corporativa |
| [General Sans](https://www.fontshare.com/fonts/general-sans) (Fontshare) | Tipografia de corpo/UI | Grotesca limpa, legível nas tabelas densas dos painéis; pareamento clássico com Fraunces |
| [Space Mono](https://fonts.google.com/specimen/Space+Mono) (Google Fonts) | Dados/duração/progresso | Reforça o tema de ritmo/metrônomo em números e badges |
| [Phosphor Icons](https://phosphoricons.com/) (CDN) | Ícones | Cobertura ampla, evita o clichê do Font Awesome; usado com moderação, sempre ao lado de texto (nunca ícone sozinho) |

Motion: CSS puro (`@keyframes`, `transition`) + `IntersectionObserver` nativo para revelar cards ao rolar a página — sem biblioteca de animação externa. A busca feita via skill `find-skills` não encontrou nenhuma skill de terceiros (ícones/paleta/animação) com adoção relevante o bastante para justificar instalação; as bibliotecas acima são pacotes de front-end padrão de mercado, carregados via CDN, sem etapa de build.

---

## Imagens das modalidades

As fotos reais ainda não foram enviadas. Até lá, cada card usa um placeholder autoral (gradiente + traço na cor-gel da modalidade), então o site já nasce com identidade visual completa. Quando as fotos chegarem, salve-as em `HTML/assets/img/modalidades/` com os nomes indicados no `LEIA-ME.txt` daquela pasta — o CSS aplica um overlay duotone automaticamente para manter tudo coeso, não importa a iluminação/cor original da foto.

---

## Responsivo

Layout testado de 320px (celulares pequenos) a telas widescreen: navegação vira menu hambúrguer abaixo de 780px (e fica ainda mais compacta abaixo de 480px), grades de cards colapsam para 1 coluna, tabelas dos painéis rolam horizontalmente dentro do próprio contêiner sem estourar a página, e os modais se ajustam a `min(92vw, 560px)`. Movimento respeita `prefers-reduced-motion`.

---

## Validações

Todas as regras obrigatórias do enunciado (tamanho mínimo de nome, e-mail único, senha mínima, papéis válidos, referências entre cursos/modalidades/instrutores, matrícula duplicada, progresso 0–100, nota 1–5, avaliação só após matrícula concluída, etc.) estão implementadas em `HTML/js/validacoes.js` e aplicadas nos formulários antes de qualquer chamada ao json-server.
