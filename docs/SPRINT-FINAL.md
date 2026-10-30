# Sprint Final — Entrega e Apresentação

**Meta:** publicar o Sentinela no GitHub com documentação completa, corrigir os bugs que aparecem na demonstração e chegar na aula com um roteiro ensaiado.

Legenda: ✅ concluído no código · ⬜ depende de você (ação manual)

## 🔴 Correções

| # | Card | Status |
|---|---|---|
| 1 | Banner de alerta cortava a 1ª palavra ("CHUVA INTENSA" → "INTENSA") | ✅ |
| 2 | Notificação "Dados atualizados" sem estilo (tipo `'OK'` ≠ classe `.ok`) | ✅ |
| 3 | Risco ficava negativo com rajadas < 30 km/h (`Math.max(0, …)`) | ✅ |
| 4 | Intervalo de atualização continuava ativo no modo demonstração | ✅ |
| 5 | Ponto central do radar saía preto (`var(--accent)` não funciona em canvas) | ✅ |
| 6 | API sem checagem de `res.ok` / dados incompletos quebravam a tela | ✅ |
| 7 | Campo "Token CEMADEN/Defesa Civil" não era usado | ✅ removido; integração oficial no roadmap |
| 7b | Banner pegava o 1º alerta, não o mais grave | ✅ |
| 7c | Coordenada `0` era trocada por São Paulo (`\|\| -23.55`) | ✅ |
| 7d | Setas da aba VENTO apontavam para o lado errado | ✅ |
| 7e | Fuso fixo em São Paulo: previsão errada para outras regiões | ✅ `timezone=auto` |
| 7f | Códigos WMO 56, 57, 66, 67 apareciam como "dado indisponível" | ✅ |

## 🟢 Melhorias

| # | Card | Status |
|---|---|---|
| 8 | Unificar as duas buscas de cidade em um só componente | ✅ |
| 9 | Não abrir o modal ao carregar; lembrar o último local | ✅ |
| 10 | Histórico 24 h com dados reais da API | ✅ |
| 11 | Avisar que o radar é ilustrativo | ✅ |
| 12 | Responsividade (celular e projetor) | ✅ 390 px sem rolagem horizontal |
| 12b | Selo AO VIVO / DESATUALIZADO / DEMONSTRAÇÃO / SEM CONEXÃO | ✅ |
| 12c | Retry, timeout, cache local e queda para demonstração | ✅ |
| 12d | Lista de opções na busca; "usar minha localização" | ✅ |
| 12e | Acessibilidade (foco visível, Esc/Tab no modal, `aria-*`, reduced-motion) | ✅ |

## 🔵 GitHub e Documentação

| # | Card | Status |
|---|---|---|
| 13 | Reorganizar estrutura (`index.html`, `src/`, `assets/`, `tests/`, `docs/`) | ✅ |
| 14 | README.md completo | ✅ (⬜ preencher nomes da equipe e usuário do GitHub) |
| 15 | Criar repositório, `git push`, ativar Pages (Source: GitHub Actions) | ⬜ |
| 16 | Release `v1.0.0` | ⬜ |
| 16b | Testes automatizados + workflow de deploy | ✅ |
| 16c | LICENSE (MIT) e `.gitignore` | ✅ |

## 🟣 Apresentação

| # | Card | Status |
|---|---|---|
| 17 | Roteiro (ver `docs/APRESENTACAO.md`) | ✅ |
| 18 | Plano B: modo demonstração + prints em `docs/img/` | ✅ (⬜ gravar vídeo curto) |
| 19 | Slides (opcional) | ⬜ |
| 20 | Ensaio cronometrado e retrospectiva | ⬜ |

## Definição de Pronto

- [x] Bugs corrigidos e cobertos por testes
- [x] `npm test` passando (37/37)
- [x] Verificado no navegador (desktop e 390 px), incluindo falha de API
- [ ] Repositório público com link do Pages funcionando
- [ ] Apresentação ensaiada
