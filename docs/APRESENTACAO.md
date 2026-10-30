# Roteiro de apresentação (7–10 min)

## Antes da aula (5 min)

- [ ] Abrir o link do GitHub Pages **e** `npm start` local (reserva)
- [ ] Conferir o selo **AO VIVO**. Se estiver DESATUALIZADO/SEM CONEXÃO, a internet da sala está falhando: use o modo demonstração
- [ ] Deixar o botão **USAR DADOS DE DEMONSTRAÇÃO** à mão e o repositório aberto em outra aba
- [ ] Zoom do navegador em 110–125% para o projetor

## Sequência

| Tempo | O que mostrar | O que falar |
|---|---|---|
| 0:00 | Tela inicial | O problema: acompanhar o clima de uma região e saber **quando agir**. O Sentinela transforma dados meteorológicos em alertas e risco. |
| 1:00 | Buscar uma cidade (ex.: "Santa Cruz") | A lista aparece porque o nome é ambíguo. Dados vêm da Open-Meteo, sem chave. |
| 2:00 | Painel: condição atual, bússola, previsão, gráficos | Tudo atualiza sozinho a cada 10 min. Passe o mouse nos gráficos. |
| 3:30 | **Modo demonstração** (Localização → Demonstração) | Mostra um cenário de alerta: banner amarelo, risco 51 (moderado), 2 cartões, histórico com chuva forte. Selo vira DEMONSTRAÇÃO. |
| 5:00 | Abas Radar / Vento | **Honestidade:** é visualização ilustrativa, a tela avisa. Radar real é próximo passo. |
| 5:30 | Arquitetura (`docs/ARQUITETURA.md`) | Camadas: API → core (regras puras) → estado → UI. Testes cobrem as regras. |
| 7:00 | Trello + sprint final | Como as sprints organizaram o trabalho; bugs corrigidos (mostre `docs/SPRINT-FINAL.md`). |
| 8:00 | Limitações e próximos passos | Avisos oficiais (INMET/Defesa Civil), radar real, PWA. |

## Perguntas prováveis

- **"De onde vêm os dados?"** Open-Meteo (modelos meteorológicos públicos). Sem chave, gratuita para uso não comercial.
- **"Isso substitui a Defesa Civil?"** Não. Os alertas são calculados por limiares a partir da previsão; avisos oficiais são um próximo passo.
- **"E se a internet cair?"** Tenta de novo, usa o último dado salvo (até 3 h) e, na abertura, cai na demonstração. O selo mostra o estado real.
- **"Como o risco é calculado?"** Chuva (até 40) + rajadas acima de 30 km/h (até 25) + tipo de tempo (até 30). 0–39 baixo, 40–69 moderado, 70+ alto. Está em `src/js/core/risk.js`.
- **"O radar é real?"** Não, é ilustrativo e está sinalizado na tela.
- **"Como testaram?"** 37 testes automatizados + verificação no navegador simulando falhas de API.

## Plano B

1. Sem internet → **Modo demonstração** (funciona offline; Chart.js está no repositório).
2. Site fora do ar → `npm start` no notebook.
3. Notebook com problema → prints em `docs/img/`.
