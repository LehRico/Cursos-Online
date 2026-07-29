# Plano técnico — Plataforma de Cursos de Dança Online

> Prompt refinado a partir de `prompt.md` + decisões confirmadas com o cliente em 2026-07-29.
> Este documento é a referência para a implementação. Nenhum código de página/estilo/dados foi escrito ainda — aguardando confirmação final.

---

## 1. Decisões confirmadas

| Decisão | Escolha |
|---|---|
| Arquitetura | Multi-página tradicional (HTML/CSS/JS puro, sem build, sem framework) |
| Modalidades no lançamento | As 8 citadas no prompt, todas separadas |
| Imagens das modalidades | Aguardar fotos reais; usar placeholder autoral próprio até lá |
| Dados do `db.json` | Seed completo e navegável (não nasce vazio) |

---

## 2. Estrutura de pastas

```
Cursos-Online/                        (raiz do repositório)
├── HTML/                             (site estático — "raiz" do front-end)
│   ├── index.html                    → Catálogo de cursos (home pública)
│   ├── login.html                    → Login simulado
│   ├── curso.html                    → Página do curso (?id=)
│   ├── painel-professor.html         → CRUD de cursos/aulas/modalidades
│   ├── painel-admin.html             → CRUD de usuários e roles
│   ├── perfil.html                   → Meu perfil
│   ├── css/
│   │   ├── tokens.css                → cores, tipografia, espaçamento (design system)
│   │   ├── base.css                  → reset + estilos globais + acessibilidade
│   │   ├── componentes.css           → botões, cards, badges, forms, tabelas, modais
│   │   ├── animacoes.css             → keyframes, transições, motion
│   │   └── paginas/                  → 1 CSS por tela (catalogo.css, login.css, ...)
│   ├── js/
│   │   ├── dados/
│   │   │   └── api.js                → wrapper fetch para o json-server
│   │   ├── sessao.js                 → login simulado, usuário ativo, guarda de roles
│   │   ├── validacoes.js             → validações client-side (espelham as do enunciado)
│   │   ├── componentes/              → helpers de render (card de curso, badge, etc.)
│   │   └── paginas/                  → 1 JS por tela
│   └── assets/
│       ├── img/
│       │   ├── modalidades/          → fotos por modalidade (ver LEIA-ME.txt já criado lá)
│       │   └── marca/                → logotipo/wordmark do produto
│       └── icons/                    → sprite local (se necessário)
├── db.json                           → banco simulado do json-server (seed completo)
├── package.json                      → scripts npm (rodar json-server)
├── docs/
│   └── plano-tecnico.md              → este arquivo
├── prompt.md                         → enunciado original (mantido como referência)
└── README.md                         → documentação final do projeto + libs escolhidas
```

As pastas já foram criadas (com `.gitkeep` nas vazias). Nenhum HTML/CSS/JS de tela nem o `db.json` foram escritos ainda.

---

## 3. Sistema de design

**Conceito:** *"Palco"* — bastidor/teatro com holofotes. Fundo profundo tipo cortina de veludo, superfícies em marfim quente, um dourado de marquise como acento de marca, e cada modalidade de dança carrega sua própria "luz de gel" (cor de spot de teatro) usada em tags, bordas e badges — em vez de ilustrações clichê (sapatilha, clip-art).

**Por que não os padrões genéricos de IA:** evitei (a) creme + serifa + terracota, (b) fundo quase-preto com **um único** acento neon, e (c) grade estilo jornal com fios finos. Aqui o fundo é um vinho profundo (não preto puro) e existem **8 acentos** (as cores-gel), não um só — a variedade é o próprio ponto, porque o produto reúne 8 modalidades distintas.

### Tokens de cor

| Token | Hex | Uso |
|---|---|---|
| `--ink` | `#150D12` | fundo mais profundo (hero, rodapé) |
| `--curtain` | `#2A1420` | fundo principal das seções (bordô/vinho) |
| `--ivory` | `#F6EEE4` | superfícies claras, cards, texto sobre fundo escuro |
| `--ink-text` | `#241318` | texto sobre superfícies claras |
| `--gold` | `#E3B23C` | acento de marca, CTAs, traço de assinatura, foco |
| `--line` | `rgba(246,238,228,.14)` | divisores sutis sobre fundo escuro |

### Cores-gel por modalidade (acento + tag + slug de arquivo)

| Modalidade | Slug | Cor-gel |
|---|---|---|
| Ballet | `ballet` | `#F0B8CE` (rosa pastel) |
| Hip Hop | `hip-hop` | `#FF7A45` (laranja quente) |
| Contemporânea | `contemporanea` | `#7FC8C4` (verde-água) |
| Danças Urbanas | `dancas-urbanas` | `#D64550` (vermelho vibrante) |
| Dança de Salão | `danca-de-salao` | `#C9A05A` (bronze/champagne) |
| Jazz | `jazz` | `#E8C94A` (dourado teatral) |
| Sapateado | `sapateado` | `#9FB2C7` (aço/metálico, som do sapateado) |
| Dança do Ventre | `danca-do-ventre` | `#C77DC9` (magenta oriental) |

Todas com luminosidade/saturação parecidas de propósito — para lerem como uma família de luzes de palco, não um arco-íris aleatório.

### Tipografia

- **Display** — `Fraunces` (itálico expressivo nos títulos de impacto; serifa com curvas "soltas" que remetem a movimento).
- **Corpo/UI** — `General Sans` (Fontshare) — grotesca limpa, ótima legibilidade em telas densas (tabelas dos painéis).
- **Utilitária/dados** — `Space Mono` — durações, %, status, badges. Reforça a ideia de ritmo/metrônomo.

### Ícones

`Phosphor Icons` via CDN (peso *duotone*/*bold*) — cobertura ampla, evita o clichê Font Awesome.

### Motion

- Vanilla CSS + `IntersectionObserver` para *scroll reveal* dos cards (sem dependência).
- `GSAP` (core, via CDN, sem build) reservado só para o momento de assinatura no hero (ver abaixo) — é a ferramenta certa para orquestrar um *timeline* e desenhar um traço SVG.
- Transição entre páginas: cada tela usa uma entrada animada e escalonada (hero/cabeçalho, cards) via `IntersectionObserver` + CSS; testei a View Transitions API nativa para cruzar documentos, mas ela gerava avisos de console inconsistentes entre navegadores — removida em favor de algo mais previsível.
- `prefers-reduced-motion` sempre respeitado.

### Elemento de assinatura: "Linha de Ritmo"

Um traço SVG contínuo (tipo onda sonora cruzada com trajetória de passo de dança) que:
- se desenha sozinho no hero ao carregar a página (stroke-draw via GSAP);
- reaparece como divisor entre seções do catálogo;
- vira o sublinhado animado dos links do menu no hover;
- substitui a barra de progresso reta em "meu perfil"/matrícula — o progresso preenche a linha ondulada em vez de um retângulo.

Esse é o único elemento "ousado" — o resto (cards, tabelas, formulários) fica disciplinado, em marfim/vinho/dourado.

---

## 4. Modelo de dados

Mantém integralmente as validações do `prompt.md` (nome mín. 3, email único, senha mín. 6, role em {aluno, professor, admin}, etc.). Único ajuste: modalidade final = as 8 da tabela acima, cada uma com `id` = slug (ex.: `hip-hop`) para leitura fácil no `db.json` e nas URLs de imagem.

Endpoints (iguais ao prompt.md): `usuarios`, `modalidades`, `cursos`, `aulas`, `matriculas`, `avaliacoes`.

---

## 5. Telas → arquivos

| Tela | Arquivo | Acesso |
|---|---|---|
| Login simulado | `login.html` | público |
| Catálogo de cursos | `index.html` | público (ações mudam por role logada) |
| Página do curso | `curso.html?id=` | público para ver; matricular exige aluno logado |
| Painel do professor | `painel-professor.html` | `professor`/`admin` |
| Painel admin de usuários | `painel-admin.html` | `admin` |
| Meu perfil | `perfil.html` | qualquer usuário logado |

Guarda de rota simples: cada página verifica a sessão (`localStorage`, já que não há SPA) no carregamento e redireciona/oculta ações fora do papel do usuário.

---

## 6. Estratégia de imagens

Enquanto as fotos reais não chegam: cada card/banner de modalidade usa um placeholder próprio (gradiente diagonal na cor-gel da modalidade + o traço da "Linha de Ritmo" desenhado por cima, em SVG/CSS — não é cinza genérico, já nasce com identidade). Quando as fotos forem salvas em `HTML/assets/img/modalidades/<slug>.jpg` (nomes definidos no `LEIA-ME.txt` já criado nessa pasta), o CSS troca automaticamente para a foto com um overlay duotone na cor-gel da modalidade — garante coesão visual mesmo se as fotos vierem de fontes/iluminações diferentes.

---

## 7. Seed do `db.json` (plano)

- `usuarios`: 1 admin, 3 professores (cobrindo instrutorId de modalidades diferentes), 6 alunos.
- `modalidades`: as 8 listadas acima.
- `cursos`: 1–2 por modalidade (mix `rascunho`/`publicado`, níveis variados) → ~12 cursos.
- `aulas`: 3–6 por curso publicado.
- `matriculas`: mistura de `em andamento` e `concluído` (para habilitar avaliações).
- `avaliacoes`: para as matrículas concluídas.

---

## 8. Bibliotecas externas (para documentar no README)

| Lib | Uso | Motivo |
|---|---|---|
| Google Fonts — Fraunces | Display | Serifa expressiva/itálico com personalidade de movimento |
| Fontshare — General Sans | Corpo/UI | Legibilidade em telas densas, pareamento clássico com Fraunces |
| Google Fonts — Space Mono | Dados/utilitária | Reforça o tema de ritmo/metrônomo |
| Phosphor Icons (CDN) | Ícones | Cobertura ampla, evita clichê do Font Awesome |
| GSAP core (CDN) | Animação de assinatura (hero) | Único ponto que justifica uma lib de animação; resto é CSS puro |
| json-server | Backend simulado | Pedido no enunciado |

Buscas feitas via skill `find-skills` não retornaram nenhuma skill de terceiros com adoção relevante e específica o suficiente para ícones/paleta — as decisões acima vêm da skill `frontend-design` + bibliotecas de front-end padrão de mercado (via CDN, sem build).

---

## 9. Status

Plano confirmado e implementação concluída — HTML/CSS/JS das 6 telas, `db.json` com seed completo e `README.md` já estão no repositório. Testado em Chrome headless (login, catálogo, painel do professor, painel admin, curso, perfil) de 320px a desktop, sem erros de console além dos 404 esperados das imagens de modalidade ainda não enviadas.

Pendência real: fotos das 8 modalidades (opcional — o placeholder autoral cobre o lançamento; ver `HTML/assets/img/modalidades/LEIA-ME.txt`).
