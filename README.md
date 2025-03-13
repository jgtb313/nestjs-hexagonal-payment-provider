![Alt text](https://splitwave.com.br/favicon.ico)

# Splitwave API

## Visão Geral

A Splitwave API é uma aplicação RESTful projetada para gerenciar solicitações de pagamento, oferece uma interface simples para criar e recuperar informações de pagamentos.

### Funcionalidades

- Criar Solicitações de Pagamento: Inicie novas solicitações.
- Recuperar Pagamentos: Acesse informações de pagamentos específicos usando identificadores únicos.

### Tecnologias

- Framework: NestJS
- Linguagem: TypeScript
- Banco de dados: PostgreSQL
- ORM: Typeorm
- Validação: Zod para validação de esquemas
- Documentação: Swagger com Scalar API Reference
- Test: Vitest

#### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/jgtb313/splitwave-api.git
   cd splitwave-api
   ```
2. Instale as dependências:
   ```bash
   yarn install
   ```
3. Copie o arquivo de variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
4. Inicia os containers Docker necessários:
   ```bash
   yarn docker
   ```
5. Inicie a aplicação:
   ```bash
   yarn start
   ```

#### Uso

- Acesse a documentação da API em http://localhost:3000/reference após iniciar o servidor.
- Endpoints:
  - GET /payments/:paymentId: Recupera um pagamento por ID.
  - POST /payments: Cria uma nova solicitação de pagamento.

![Alt text](https://i.imgur.com/ooJ9wPS.png)
![Alt text](https://i.imgur.com/b8iYoQc.png)
![Alt text](https://i.imgur.com/toGB2eY.png)

#### Directory Structure

| Directory/File  | Description                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| **`src/`**      | Main source code directory.                                                                                       |
| **`adapters/`** | Contains concrete implementations for external infrastructure communication (e.g., database, external providers). |
| **`core/`**     | Business logic layer (domain).                                                                                    |
| **`ports/`**    | Defines contracts/interfaces connecting the domain with external implementations.                                 |
| **`support/`**  | Contains utilities and feature extensions.                                                                        |
| **Main Files**  |                                                                                                                   |
| `app.module.ts` | Main application module.                                                                                          |
| `main.ts`       | Application entry point.                                                                                          |

#### Observações

- O FakePaymentProvider é tipo um gateway de pagamento genérico (Pagarme, Iugu, etc). Poderiamos implementar outros, desde que sigam a interface IPaymentProvider.
- O PaymentService pode receber outros providers e adotar um strategy pattern pra escolher qual usar, dependendo de alguma regra de negócio.
- A arquitetura hexagonal separa bem a parte de implementação concreta (adapters), abstrações (ports) e o core (regras de negócio) simplificando a manutenção e entedimento de cada parte da aplicacão.
- Cada PaymentProvider deve tratar seus erros de acordo com o gateway, e o PaymentService aplica regra de negócio de acordo com o erro.
- O status não é salvo no banco de dados pois, nessa implementação, não temos sincronização com o gateway. O ideal seria ter algo como webhook pra atualizar automaticamente, sendo assim não precisaríamos ficar batendo no gateway para consultar o status atual.
- Por enquanto, o endpoint POST "http://localhost:3000/payments" sempre retornará erro pois FAKE_PAYMENT_PROVIDER_BASE_URL não existe. Mas com os mocks no Vitest, conseguimos testar o fluxo, com respostas de sucesso ou erro.
