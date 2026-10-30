# Arquitetura

## Visão geral

```
            ┌────────────── Open-Meteo (forecast + geocoding) ──────────────┐
            │                                                               │
        api/http.js  ──►  api/openMeteo.js · api/geocoding.js               │
   (timeout, retry,        (monta URL, VALIDA e NORMALIZA a resposta)       │
    erros padronizados)                    │                                │
                                           ▼                                │
   data/demo.js ───────────►  services/monitor.js  ◄── services/storage.js │
   (mesmo formato da API)     (atualização, cache, fallback)  (localStorage)│
                                           │ setState()
                                           ▼
                                       state.js  ──subscribe──►  ui/*  (renderiza)
                                                                    │
                                              core/*  ◄─────────────┘
                                   (regras puras: risco, alertas, histórico...)
```

## Camadas e responsabilidades

| Camada | Pasta | Regra de ouro |
|---|---|---|
| **API** | `src/js/api/` | Só fala com a internet. Entrega um modelo interno único (`Weather`), nunca a resposta crua. |
| **Core** | `src/js/core/` | Funções **puras**, sem DOM e sem relógio. É onde ficam as regras de negócio e é o que os testes cobrem. |
| **Serviços** | `src/js/services/` | Orquestra: quando buscar, o que fazer se falhar, o que guardar. |
| **Estado** | `src/js/state.js` | Um objeto + `subscribe`. A UI lê; só o serviço escreve. |
| **UI** | `src/js/ui/` | Um módulo por painel. Recebe dados prontos e pinta. |

Dependência sempre de cima para baixo: `ui → core`, `services → api/core/state`. O `core` não importa nada de fora dele (só `config` e `format`).

## Decisões

1. **Módulos ES, sem bundler.** Zero build, fácil de explicar e de publicar no Pages. Custo: precisa de servidor HTTP (`npm start`).
2. **Um modelo interno (`Weather`).** A demonstração gera dados no formato da API e passa pelo mesmo `normalizeForecast`, então demo e produção exercitam o mesmo caminho.
3. **Horários como string.** A Open-Meteo devolve horários no fuso do *ponto* (`timezone=auto`). Comparar as strings ISO evita o erro de usar o relógio do navegador.
4. **Falha em cascata, nunca tela vazia:** manter o que está na tela → cache (até 3 h) → demonstração (só na abertura) → mensagem de erro.
5. **Chart.js em `vendor/`.** O painel funciona sem CDN, importante para apresentar em sala.
6. **CSP no `index.html`.** Só `self` + as duas APIs; sem scripts nem estilos inline. Nomes de cidade vêm de API externa e são escapados/inseridos com `textContent`.
7. **Cores no CSS, não no JS.** O JS só troca `data-level` / `data-tone` / `data-mode`.

## Tratamento de erros da API

| Situação | Comportamento |
|---|---|
| Sem rede / timeout (10 s) | 2 novas tentativas com espera crescente |
| HTTP 5xx / 429 | Idem; 429 mostra mensagem de limite de requisições |
| HTTP 4xx (ex.: coordenada inválida) | **Não** repete; mostra o motivo devolvido pela API |
| JSON inválido ou sem `current`/`hourly` | `ApiError('invalid')`, tratado como falha |
| Busca nova enquanto outra roda | A anterior é cancelada (`AbortController`) |

## Testes

`npm test` roda 37 testes (`node:test`, sem dependências): regras de risco/alertas/histórico, validação de coordenadas, normalização da resposta, comportamento de retry/timeout/cancelamento da camada HTTP e consistência da demonstração.
