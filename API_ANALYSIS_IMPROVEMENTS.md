# Melhorias na API de Análise Financeira

## Resumo das Implementações Técnicas

A API foi aprimorada com análises estatísticas avançadas e indicadores financeiros para fornecer respostas mais técnicas e completas.

---

## 1. Análise Estatística Descritiva

### Função: `calculateStats()`
Calcula métricas estatísticas robustas sobre os valores de despesa:

- **Média (Mean)**: Soma total / quantidade de transações
- **Mediana**: Valor central que divide a distribuição em 50/50
- **Desvio Padrão (σ)**: Mede a dispersão dos dados em relação à média
- **Mínimo/Máximo**: Limites da distribuição
- **Quartis (Q1, Q3)**: 25º e 75º percentis para análise de distribuição

**Aplicação**: Identifica padrões de gasto e variabilidade

---

## 2. Detecção de Anomalias

### Função: `detectAnomalies()`
Identifica transações atípicas usando o método de desvios padrão:

- Detecta valores > 2σ (desvios padrão) da média
- Útil para identificar gastos extraordinários ou erros de entrada
- Retorna lista de valores anômalos para investigação

**Fórmula**: `|valor - média| > 2 × σ`

---

## 3. Análise de Tendências

### Função: `calculateTrend()`
Avalia a direção e magnitude das mudanças nos gastos:

- **Crescente**: Aumento > 5% período a período
- **Decrescente**: Redução > 5% período a período
- **Estável**: Variação entre -5% e +5%
- **Percentual de Mudança**: Cálculo exato da variação

**Aplicação**: Identifica se gastos estão aumentando ou diminuindo

---

## 4. Indicadores Financeiros

### Taxa de Poupança
```
Taxa = (Receita - Despesa) / Receita × 100%
```
- Indica percentual de renda que está sendo poupada
- Valores positivos indicam superávit
- Valores negativos indicam déficit

### Índice de Despesa
```
Índice = Despesa / Receita × 100%
```
- Percentual da renda gasto em despesas
- Ideal: < 80% para manter margem de segurança
- > 100% indica gastos acima da renda

---

## 5. Comparação Período a Período

### Função: `comparePeriodsAnalysis()`
Compara métricas entre meses consecutivos:

- Variação absoluta de despesas e receitas
- Variação percentual para contexto relativo
- Últimos 6 meses para tendência clara
- Identifica mudanças significativas

**Exemplo de Saída**:
```
Maio/2025 vs Abril/2025:
- Despesas: R$ 2.500,00 (+15.3%)
- Receitas: R$ 5.000,00 (+2.1%)
```

---

## 6. Previsão com Média Móvel

### Função: `forecastNextMonth()`
Estima despesas futuras usando média móvel de 3 meses:

- Calcula média dos últimos 3 meses
- Fornece intervalo de confiança (±15%)
- Baseado em dados históricos

**Fórmula**: `Previsão = (Mês-1 + Mês-2 + Mês-3) / 3`

---

## 7. Análise Integrada com Filtros

### Função: `analyzeWithFilters()`
Combina todas as análises anteriores com suporte a:

- Filtros por período (mês único ou intervalo)
- Filtros por categoria
- Filtros por faixa de valores
- Agrupamento por categoria/mês
- Top N categorias

**Saída Estruturada**:
1. Resumo financeiro básico
2. Análise estatística descritiva
3. Tendência de gastos
4. Anomalias detectadas
5. Ranking de categorias com percentuais
6. Comparação período a período
7. Previsão para próximo mês

---

## 8. Enriquecimento de Respostas

Cada resposta agora inclui:

- ✅ Valores absolutos em BRL
- ✅ Percentuais de participação
- ✅ Métricas estatísticas
- ✅ Indicadores de tendência (📈 📉 ➡️)
- ✅ Alertas de anomalias (⚠️)
- ✅ Previsões com intervalo de confiança
- ✅ Comparações período a período

---

## 9. Exemplos de Perguntas Suportadas

### Análise Básica
- "Qual foi meu gasto em Maio?"
- "Quanto gastei em Alimentação?"

### Análise Avançada
- "Qual foi meu gasto entre Março e Maio?"
- "Top 5 categorias de despesa?"
- "Gastos maiores que R$ 500?"

### Análise Técnica
- Todas as perguntas acima agora retornam:
  - Estatísticas descritivas
  - Detecção de anomalias
  - Tendências
  - Previsões
  - Comparações período a período

---

## 10. Melhorias Técnicas Implementadas

| Aspecto | Antes | Depois |
|--------|-------|--------|
| Métricas | Soma básica | Média, mediana, σ, quartis |
| Tendências | Não havia | Crescente/Decrescente/Estável |
| Anomalias | Não detectava | Detecta > 2σ |
| Previsões | Não havia | Média móvel 3 meses |
| Comparações | Não havia | Período a período com % |
| Indicadores | Não havia | Taxa poupança, índice despesa |
| Percentuais | Não havia | Participação de cada categoria |

---

## 11. Notas Técnicas

- **Robustez**: Trata valores nulos, inválidos e formatos variados
- **Performance**: Cálculos O(n) com uma passagem pelos dados
- **Precisão**: Usa arredondamento apropriado para moeda BRL
- **Markdown**: Respostas formatadas com emojis e estrutura clara
- **Escalabilidade**: Suporta até 2000 transações sem degradação

---

## 12. Próximas Melhorias Possíveis

- [ ] Análise de sazonalidade (padrões anuais)
- [ ] Regressão linear para previsões mais precisas
- [ ] Análise de correlação entre categorias
- [ ] Alertas automáticos para desvios
- [ ] Segmentação de gastos por tipo (fixo/variável)
- [ ] Análise de elasticidade de despesas
