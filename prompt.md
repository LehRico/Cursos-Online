# Prompt — Plataforma de Cursos de Dança Online (Roles, Validações e Múltiplos Endpoints)

## Instruções para o Claude que for executar este prompt

Antes de escrever qualquer código, siga esta ordem obrigatória:

1. Use a skill **`find-skills`** para localizar e listar as skills disponíveis relacionadas a front-end, design visual e bibliotecas de UI/animação (ex: bibliotecas de ícones, animação, componentes, paletas de cores). Liste o que encontrar antes de decidir a stack visual.
2. Use a skill **`frontend-design`** (a versão em `/mnt/skills/public/frontend-design/` e também a variante do usuário em `/mnt/skills/user/frontend-design/`) para guiar todas as decisões de tipografia, paleta de cores, espaçamento e composição visual. O objetivo é um resultado **impecável**, com identidade visual forte, nada de "cara de template padrão" ou Bootstrap genérico.
3. A entrega visual precisa transmitir a energia e a estética do mundo da dança: movimento, ritmo, fluidez. Evite telas frias e puramente corporativas — pense em tipografia expressiva, uso de contraste, imagens/ilustrações com sensação de movimento, microanimações de transição entre telas quando fizer sentido.
4. Documente no README quais bibliotecas visuais/de animação foram escolhidas (via a skill `find-skills`) e por quê.

---

## Contexto

Você deve desenvolver uma **plataforma de cursos de dança online**, com backend simulado via `json-server`, contendo **pelo menos 6 endpoints** integrados. A plataforma reúne múltiplas modalidades — **ballet, hip hop, dança contemporânea, danças urbanas, dança de salão, jazz, sapateado, dança do ventre, entre outras**. O sistema deve implementar **controle de acesso por perfil de usuário (roles)**, com **3 tipos de role**: aluno, professor (gerenciador de conteúdo) e administrador.

---

## Endpoints

| Endpoint | Responsabilidade |
|---|---|
| **1. `usuarios`** | Cadastro de todos os usuários da plataforma (independente do role) |
| **2. `modalidades`** | Modalidades/estilos de dança que agrupam os cursos (ex: Ballet, Hip Hop, Contemporânea, Danças Urbanas, Dança de Salão, Jazz, Sapateado) |
| **3. `cursos`** | Cursos de dança disponíveis na plataforma |
| **4. `aulas`** | Aulas (vídeo-aulas/coreografias) que compõem cada curso |
| **5. `matriculas`** | Vínculo entre um usuário e um curso, incluindo progresso |
| **6. `avaliacoes`** | Notas e comentários deixados pelos alunos nos cursos que concluíram |

---

## Sistema de Roles

O campo `role` do usuário deve aceitar **apenas 3 valores possíveis**: `"aluno"`, `"professor"` ou `"admin"`.

### 1. Usuário comum (`aluno`)
- Pode visualizar cursos **publicados** e suas respectivas modalidades e aulas.
- Pode se matricular em um curso (criação de registro em `matriculas`).
- Pode atualizar o próprio progresso na matrícula (ex: aulas de coreografia concluídas).
- Pode avaliar (nota + comentário) cursos em que já esteja com matrícula concluída.
- Pode editar apenas o **próprio** perfil (nome, senha) — não pode alterar seu `role`.
- **Não** tem acesso a: CRUD de cursos/aulas/modalidades, listagem de outros usuários, dados de matrícula de terceiros.

### 2. Usuário gerenciador de conteúdo (`professor`)
- Tem todas as permissões do `aluno` como consumidor da plataforma (opcional, dependendo do fluxo escolhido).
- Pode criar, editar e excluir **cursos**, **aulas** e **modalidades**.
- Pode visualizar as matrículas e avaliações **dos cursos que leciona/gerencia**, para acompanhar desempenho e engajamento dos alunos.
- **Não** pode: gerenciar usuários (criar, editar, excluir, listar todos), nem alterar roles de ninguém.

### 3. Administrador (`admin`)
- Acesso total ao sistema.
- É o **único role com acesso ao CRUD de `usuarios`**: pode listar todos os usuários, criar, editar, excluir e **alterar o role de qualquer usuário**.
- Pode ativar/desativar contas (`ativo: true/false`).
- Herda todas as permissões de `professor` e `aluno`.

> ⚠️ **Nota técnica:** o `json-server` não possui autenticação/autorização nativa — qualquer requisição HTTP é permitida por padrão. Por isso, o controle de roles deve ser implementado na **camada de frontend**: um usuário "logado" (simulado, ex: guardado em contexto/estado global após um login fake) define quais rotas/telas/ações ficam visíveis e habilitadas. Documentar claramente essa limitação no README do projeto.

---

## Validações obrigatórias

### `usuarios`
- `nome`: obrigatório, mínimo 3 caracteres.
- `email`: obrigatório, formato válido, único na base.
- `senha`: obrigatório, mínimo 6 caracteres.
- `role`: obrigatório, deve ser exatamente `"aluno"`, `"professor"` ou `"admin"`.
- `ativo`: booleano, default `true`.

### `modalidades`
- `nome`: obrigatório, único (ex: "Ballet", "Hip Hop", "Contemporânea", "Danças Urbanas", "Dança de Salão").

### `cursos`
- `titulo`: obrigatório, mínimo 5 caracteres.
- `modalidadeId`: obrigatório, deve referenciar uma modalidade existente.
- `instrutorId`: obrigatório, deve referenciar um usuário com `role: "professor"` (ou `"admin"`).
- `status`: obrigatório, apenas `"rascunho"` ou `"publicado"`.
- `nivel`: obrigatório, apenas `"iniciante"`, `"intermediário"` ou `"avançado"`.
- `cargaHoraria`: número positivo.

### `aulas`
- `cursoId`: obrigatório, deve referenciar um curso existente.
- `titulo`: obrigatório.
- `ordem`: número inteiro positivo (define a sequência da aula/coreografia no curso).
- `duracaoMinutos`: número positivo.

### `matriculas`
- `usuarioId`: obrigatório, deve referenciar um usuário com `role: "aluno"`.
- `cursoId`: obrigatório, deve referenciar um curso com `status: "publicado"`.
- Não permitir matrícula duplicada (mesmo `usuarioId` + `cursoId`).
- `progresso`: número entre `0` e `100`.
- `status`: apenas `"em andamento"` ou `"concluído"`.

### `avaliacoes`
- `usuarioId` + `cursoId`: obrigatórios, e o usuário só pode avaliar se possuir matrícula com `status: "concluído"` para aquele curso.
- `nota`: obrigatório, número inteiro entre `1` e `5`.
- `comentario`: opcional, máximo 500 caracteres.
- Não permitir mais de uma avaliação do mesmo usuário para o mesmo curso.

---

## Telas sugeridas

- **Login (simulado)**: seleção/autenticação de um usuário existente, definindo o role ativo na sessão.
- **Catálogo de cursos de dança**: visível a todos os roles, com filtro por modalidade (Ballet, Hip Hop, Contemporânea, Danças Urbanas, Dança de Salão, etc.) e por nível.
- **Página do curso**: lista de aulas/coreografias, progresso (se matriculado) e avaliações de outros alunos.
- **Painel do professor**: CRUD de cursos, aulas e modalidades, restrito a `professor`/`admin`.
- **Painel administrativo de usuários**: CRUD de usuários e alteração de roles, restrito a `admin`.
- **Meu perfil**: edição de dados próprios, disponível a todos os roles.

---

## Diretrizes visuais (obrigatório usar as skills)

- Use a skill `find-skills` para descobrir bibliotecas de ícones, animação (ex: transições suaves entre telas, microinterações ao trocar de modalidade) e componentes visuais adequadas ao projeto.
- Use a skill `frontend-design` (pública e a versão do usuário) para guiar tipografia, paleta de cores e hierarquia visual — o resultado final deve parecer um produto profissional e **impecável**, não um layout genérico.
- Sugestão de tom visual: paleta com cores vibrantes ligadas a cada modalidade (ex: tons quentes para Hip Hop/Danças Urbanas, tons suaves/pastel para Ballet, tons contrastantes e sofisticados para Dança de Salão), tipografia com personalidade, uso de imagens/ilustrações que remetam a movimento.
- Evitar clichês visuais rasos (sapatilhas de ballet genéricas em todo lugar, clip-arts). Priorizar uma identidade visual coesa em todo o produto.

---

## Exemplo de item de cada endpoint

**`usuarios`**
```json
{
  "id": "u1a2b3",
  "nome": "Camila Rocha",
  "email": "camila.rocha@email.com",
  "senha": "senha123",
  "role": "aluno",
  "ativo": true
}
```

**`modalidades`**
```json
{
  "id": "mod1x2",
  "nome": "Hip Hop",
  "descricao": "Danças urbanas com base em movimentos de rua, groove e freestyle."
}
```

**`cursos`**
```json
{
  "id": "cur1y3",
  "titulo": "Hip Hop para Iniciantes",
  "descricao": "Fundamentos de groove, isolamentos e coreografia básica de hip hop.",
  "modalidadeId": "mod1x2",
  "instrutorId": "u2c4d5",
  "status": "publicado",
  "nivel": "iniciante",
  "cargaHoraria": 16
}
```

**`aulas`**
```json
{
  "id": "aul1z4",
  "cursoId": "cur1y3",
  "titulo": "Groove e Postura Corporal",
  "conteudo": "https://video.exemplo.com/aula1",
  "ordem": 1,
  "duracaoMinutos": 20
}
```

**`matriculas`**
```json
{
  "id": "mat1w5",
  "usuarioId": "u1a2b3",
  "cursoId": "cur1y3",
  "dataMatricula": "2026-07-10T13:00:00Z",
  "progresso": 60,
  "status": "em andamento"
}
```

**`avaliacoes`**
```json
{
  "id": "ava1v6",
  "usuarioId": "u1a2b3",
  "cursoId": "cur1y3",
  "nota": 5,
  "comentario": "Aulas muito bem explicadas, professor excelente!",
  "data": "2026-07-20T18:45:00Z"
}
```
