# Sistema de Chamados

Sistema web de gerenciamento de chamados desenvolvido para a disciplina DAS – Design e Arquitetura de Sistemas (Univille), utilizando Java 21, Spring Boot, Spring Data JPA, H2 e front-end em HTML, CSS e JavaScript.

## Como executar

Certifique-se de ter o Java 21 instalado.

Na pasta raiz do projeto, execute:

**Windows:**
```bash
.\mvnw.cmd spring-boot:run
```

**Linux/macOS:**
```bash
./mvnw spring-boot:run
```

O sistema estará disponível em:

http://localhost:8080

O front-end é servido pelo próprio Spring Boot, não sendo necessário iniciar outro servidor.

A API responde na mesma origem, utilizando os caminhos `/chamados`, `/clientes`, `/categorias` e `/tecnicos`.

## Banco de dados

O projeto utiliza H2 em memória, com configuração automática pelo Spring Boot.

- Banco: H2
- URL JDBC: `jdbc:h2:mem:chamadoadb`
- Usuário: `sa`
- Senha: (vazia)
- Console: http://localhost:8080/h2-console

**Importante:** os dados são reiniciados quando a aplicação é encerrada.

## Ordem inicial de cadastro

Antes de criar o primeiro chamado, é necessário cadastrar:

1. Um cliente.
2. Uma categoria.
3. Um técnico.

A criação de chamados exige os IDs dos três registros.

Todo chamado novo nasce automaticamente com status `ABERTO` e recebe sua data de abertura pelo servidor.

## Consulta de chamados: filtros, paginação e ordenação

`GET /chamados` aceita os parâmetros abaixo. Todos são opcionais e podem ser combinados.

| Parâmetro | Valores | Exemplo |
|---|---|---|
| status | ABERTO, EM_ATENDIMENTO, AGUARDANDO_CLIENTE, FECHADO | `status=ABERTO` |
| prioridade | BAIXA, MEDIA, ALTA, CRITICA | `prioridade=ALTA` |
| clienteId | ID de um cliente | `clienteId=1` |
| page | Número da página, começando em 0 | `page=1` |
| size | Itens por página (padrão: 10) | `size=5` |
| sort | Campo e direção da ordenação | `sort=dataAbertura,desc` |

A ordenação utiliza o recurso `Pageable` do Spring Data.

A ordenação padrão é por `dataAbertura` em ordem decrescente (mais recentes primeiro).

### Exemplos

| Consulta | Retorna |
|---|---|
| `GET /chamados` | Todos os chamados, 10 por página |
| `GET /chamados?status=ABERTO` | Somente chamados abertos |
| `GET /chamados?prioridade=CRITICA` | Chamados de prioridade crítica |
| `GET /chamados?clienteId=1` | Chamados do cliente 1 |
| `GET /chamados?status=ABERTO&prioridade=ALTA` | Chamados abertos e de prioridade alta |
| `GET /chamados?status=EM_ATENDIMENTO&prioridade=ALTA&clienteId=2` | Combinação dos três filtros |
| `GET /chamados?page=1&size=5` | Segunda página, com 5 itens |
| `GET /chamados?sort=titulo,asc` | Ordenação pelo título |
| `GET /chamados?sort=dataAbertura,desc` | Mais recentes primeiro |
| `GET /clientes/1/chamados` | Chamados pertencentes ao cliente 1 |

A rota `/clientes/{id}/chamados` também aceita paginação e ordenação.

### Exemplo pelo terminal

```bash
curl -i "http://localhost:8080/chamados?status=ABERTO&prioridade=ALTA&page=0&size=5"
```

## Endpoints da API

### Chamados

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/chamados` | Listar com filtros e paginação |
| GET | `/chamados/{id}` | Buscar chamado por ID |
| POST | `/chamados` | Criar chamado |
| PUT | `/chamados/{id}` | Atualizar chamado |
| DELETE | `/chamados/{id}` | Excluir chamado |
| PATCH | `/chamados/{id}/status` | Atualizar status |
| PATCH | `/chamados/{id}/atribuir` | Atribuir técnico |

### Clientes

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/clientes` | Listar clientes |
| GET | `/clientes/{id}` | Buscar cliente |
| POST | `/clientes` | Cadastrar cliente |
| PUT | `/clientes/{id}` | Atualizar cliente |
| DELETE | `/clientes/{id}` | Excluir cliente |
| GET | `/clientes/{id}/chamados` | Listar chamados do cliente |

### Categorias

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/categorias` | Listar categorias |
| GET | `/categorias/{id}` | Buscar categoria |
| POST | `/categorias` | Cadastrar categoria |
| PUT | `/categorias/{id}` | Atualizar categoria |
| DELETE | `/categorias/{id}` | Excluir categoria |

### Técnicos

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/tecnicos` | Listar técnicos |
| GET | `/tecnicos/{id}` | Buscar técnico |
| POST | `/tecnicos` | Cadastrar técnico |
| PUT | `/tecnicos/{id}` | Atualizar técnico |
| DELETE | `/tecnicos/{id}` | Excluir técnico |

### Comentários e histórico

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/chamados/{id}/comentarios` | Listar comentários |
| POST | `/chamados/{id}/comentarios` | Registrar comentário |

## Exemplos de requisições

### Criar chamado

`POST /chamados`

```json
{
  "titulo": "Impressora não funciona",
  "descricao": "A impressora do setor financeiro não está imprimindo.",
  "prioridade": "ALTA",
  "clienteId": 1,
  "categoriaId": 1,
  "tecnicoId": 1
}
```

O status inicial será definido automaticamente como `ABERTO`, e a data de abertura será preenchida pelo sistema.

### Alterar status

`PATCH /chamados/1/status`

```json
{
  "status": "EM_ATENDIMENTO"
}
```

Status disponíveis:

- `ABERTO`
- `EM_ATENDIMENTO`
- `AGUARDANDO_CLIENTE`
- `FECHADO`

Ao fechar um chamado, o sistema preenche automaticamente a data de fechamento.

### Atribuir técnico

`PATCH /chamados/1/atribuir`

```json
{
  "tecnicoId": 2
}
```

### Adicionar comentário

`POST /chamados/1/comentarios`

```json
{
  "texto": "Iniciada a análise do problema.",
  "autor": "Maria Silva"
}
```

A data do comentário é preenchida automaticamente.

## Regras de negócio

- Não permitir nomes duplicados para categorias.
- Não permitir e-mails duplicados para clientes e técnicos.
- Todo chamado deve possuir cliente, categoria e técnico.
- Todo chamado novo inicia com status `ABERTO`.
- A data de abertura é preenchida automaticamente.
- Ao fechar um chamado, a data de fechamento é registrada.
- Não permitir alteração, atribuição de técnico ou exclusão de chamados fechados.
- Comentários são associados ao chamado correspondente e registrados em ordem cronológica.

## Formato das respostas

As consultas paginadas utilizam a estrutura `Page` do Spring Data.

Exemplo simplificado:

```json
{
  "content": [
    {
      "id": 12,
      "titulo": "Impressora parada",
      "status": "ABERTO",
      "prioridade": "ALTA",
      "clienteId": 1,
      "clienteNome": "Empresa Exemplo"
    }
  ],
  "totalElements": 12,
  "totalPages": 2,
  "number": 0,
  "size": 10
}
```

Os campos apresentados são ilustrativos. A resposta completa contém os demais dados e metadados de paginação do Spring Data.

## Tratamento de erros

A API utiliza um tratamento global de exceções por meio de `GlobalExceptionHandler`.

| Situação | Status HTTP |
|---|---|
| Recurso não encontrado | 404 |
| Regra de negócio violada | 409 |
| Dados de entrada inválidos | 400 |
| Operação de criação realizada | 201 |
| Exclusão realizada | 204 |
| Consulta realizada | 200 |

As respostas de erro incluem data, código HTTP, descrição do erro e detalhes de validação, quando aplicável.

## Front-end

O front-end está integrado ao Spring Boot e localizado em `src/main/resources/static`.

Funcionalidades disponíveis:

- Dashboard com indicadores de chamados.
- Listagem de chamados.
- Filtros por status, prioridade e cliente.
- Paginação.
- Cadastro e edição de chamados.
- Visualização dos detalhes.
- Atribuição de técnicos.
- Alteração de status.
- Registro e consulta de comentários.
- Gerenciamento de clientes.
- Gerenciamento de categorias.
- Gerenciamento de técnicos.

A comunicação com o back-end é realizada por JavaScript utilizando `fetch` e endpoints REST.

## Testes automatizados

Para executar os testes:

**Windows:**
```bash
.\mvnw.cmd test
```

**Linux/macOS:**
```bash
./mvnw test
```

O projeto contém testes de Repository com `@DataJpaTest` e testes de Controller com `@WebMvcTest`, contemplando persistência, validações, duplicidade e respostas de erro.

## Tecnologias utilizadas

- Java 21
- Spring Boot
- Spring Web MVC
- Spring Data JPA
- Spring Validation
- H2 Database
- Maven
- HTML5
- CSS3
- JavaScript
- JUnit 5
- Mockito
- MockMvc

## Estrutura do projeto

```text
sistema-chamados/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── br/com/sistemas/chamados/
│   │   │       ├── controller/
│   │   │       ├── dto/
│   │   │       ├── entity/
│   │   │       ├── exception/
│   │   │       ├── repository/
│   │   │       └── service/
│   │   └── resources/
│   │       ├── static/
│   │       │   ├── css/
│   │       │   ├── js/
│   │       │   ├── pages/
│   │       │   └── index.html
│   │       └── application.properties/
│   └── test/
│       └── java/
├── .mvn/
├── mvnw
├── mvnw.cmd
└── pom.xml
```

Projeto desenvolvido para a disciplina DAS – Design e Arquitetura de Sistemas, Univille.
