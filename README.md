# Sales Goals Manager — Front-end Angular

Front-end (Angular 20, componentes standalone, signals e formulários reativos) que **consome a API já existente** do projeto SalesGoalsManager. Nenhuma regra de negócio é reimplementada aqui: as validações locais só espelham mensagens para dar retorno rápido, e o back-end continua sendo a fonte da verdade.

## Telas

| Rota | O que faz |
|---|---|
| `/metas` | Lista as metas, com busca (vendedor, produto, tipo, periodicidade), totais por tipo, editar e excluir |
| `/metas/nova` e `/metas/:id/editar` | Cadastro/edição: vendedor, produto, tipo (Monetário/Litros/Unidades), valor com máscara pt-BR, periodicidade. Botões Voltar, Limpar, Dobrar valor e Salvar. Atalhos: **F2** salva, **Esc** volta |
| `/produtos` | CRUD de produtos (nome e categoria Líquido/Diversos) |
| `/vendedores` | CRUD de vendedores |

## Como rodar

```bash
npm install
npm start          # http://localhost:4200
```

Suba a API antes (`dotnet run`, perfil https, porta **7109**). O `proxy.conf.json` encaminha `/api/*` para `https://localhost:7109/*`, então **não precisa de CORS** em desenvolvimento. Se a sua porta for outra, altere o `target` nesse arquivo.

## Endpoints consumidos

| Recurso | Chamadas |
|---|---|
| Meta | `GET /Meta`, `GET /Meta/{id}`, `POST /Meta`, `PUT /Meta/{id}`, `DELETE /Meta/{id}` |
| Produto | `GET /Produto`, `GET /Produto/{id}`, `POST /Produto`, `PUT /Produto/{id}`, `DELETE /Produto/{id}` |
| Vendedor | `GET /Vendedor`, `GET /Vendedor/{id}`, `POST /Vendedor`, `PUT /Vendedor/{id}`, `DELETE /Vendedor/{id}` |

Os modelos estão em `src/app/core/models.ts` e espelham `MetaVendedorDto`, `ProdutoDto` e `VendedorDto`.

### Enums

A API serializa enums como **número**. Os valores usados aqui:

- `Periodicidade`: Diária = 1, Semanal = 2, Mensal = 3
- `TipoMeta`: Monetário = 1, Litros = 2, Unidades = 3
- `CategoriaProduto`: Líquido = 0, Diversos = 1

Se algum valor for diferente no seu código, ajuste só `models.ts`. Se a API passar a usar `JsonStringEnumConverter`, a leitura já aceita nomes (`enum.util.ts`) e o envio de números continua aceito.

### Erros

O `ExceptionHandlingMiddleware` devolve `ProblemDetails` (`{ status, title, detail }`). O `http-error.interceptor.ts` converte isso (e também texto puro, erros de model binding e falha de rede) num `ApiError`; as telas exibem as mensagens de validação linha a linha.

## Produção

Em produção, informe a URL da API e habilite CORS no `Program.cs`:

```csharp
// Program.cs
builder.Services.AddCors(o => o.AddPolicy("web", p =>
    p.WithOrigins("https://seu-front.com").AllowAnyHeader().AllowAnyMethod()));
// ...
app.UseCors("web");   // antes de MapControllers()
```

```ts
// app.config.ts
{ provide: API_URL, useValue: 'https://sua-api.com' }
```

```bash
npm run build   # saída em dist/sales-goals-manager-web/browser
```

## Estrutura

```
src/app
├── core/        models, services HTTP, interceptor de erro, toast, confirmação
├── shared/      money-input (máscara pt-BR), toast, diálogo de confirmação
└── features/
    ├── metas/       lista e formulário
    ├── produtos/
    └── vendedores/
```

## Observações

- **Valor da meta**: em Monetário os dígitos entram como centavos (como o `DecimalMoedaConverter` do WPF). Em Litros/Unidades o campo vira inteiro, igual à regra do `MetaVendedorDto`.
- **Litros só para produto líquido**: validado antes de enviar e novamente pelo back-end.
- **Excluir produto/vendedor com metas vinculadas**: o banco usa `DeleteBehavior.Restrict`, então a API responde 500; a tela explica o motivo. Se quiser uma mensagem exata, faça a API lançar `ValidationException` nesse caso.
