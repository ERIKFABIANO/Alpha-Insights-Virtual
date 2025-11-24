// Teste de análise técnica para empresa de componentes de computador
// Simula dados reais de vendas e despesas

const testTransactions = [
  // MAIO 2025 - Vendas
  { date: '2025-05-01', category: 'Vendas - GPU', description: 'RTX 4090 x2', amount: 15000.00 },
  { date: '2025-05-02', category: 'Vendas - CPU', description: 'Intel i9-14900K x5', amount: 8500.00 },
  { date: '2025-05-03', category: 'Vendas - RAM', description: 'DDR5 64GB x10', amount: 4200.00 },
  { date: '2025-05-05', category: 'Vendas - SSD', description: 'NVMe 2TB x8', amount: 3600.00 },
  { date: '2025-05-07', category: 'Vendas - Periféricos', description: 'Teclados mecânicos x15', amount: 2250.00 },
  { date: '2025-05-10', category: 'Vendas - Placas-mãe', description: 'Z790 x3', amount: 2400.00 },
  { date: '2025-05-12', category: 'Vendas - Fontes', description: 'Corsair 1000W x4', amount: 2800.00 },
  { date: '2025-05-15', category: 'Vendas - Coolers', description: 'AIO Liquid x6', amount: 1800.00 },
  { date: '2025-05-18', category: 'Vendas - Monitores', description: '4K 144Hz x2', amount: 4000.00 },
  { date: '2025-05-20', category: 'Vendas - Cabos', description: 'Cabos diversos', amount: 800.00 },
  { date: '2025-05-22', category: 'Vendas - GPU', description: 'RTX 4080 x3', amount: 12000.00 },
  { date: '2025-05-25', category: 'Vendas - CPU', description: 'Ryzen 9 7950X x4', amount: 7200.00 },
  { date: '2025-05-28', category: 'Vendas - RAM', description: 'DDR5 32GB x12', amount: 3600.00 },
  { date: '2025-05-30', category: 'Vendas - SSD', description: 'NVMe 1TB x15', amount: 3000.00 },

  // MAIO 2025 - Despesas
  { date: '2025-05-01', category: 'Custo - Estoque', description: 'Reposição GPU', amount: -8000.00 },
  { date: '2025-05-03', category: 'Custo - Estoque', description: 'Reposição CPU', amount: -4500.00 },
  { date: '2025-05-05', category: 'Custo - Estoque', description: 'Reposição RAM', amount: -2000.00 },
  { date: '2025-05-08', category: 'Operacional', description: 'Aluguel loja', amount: -3000.00 },
  { date: '2025-05-10', category: 'Operacional', description: 'Energia elétrica', amount: -1200.00 },
  { date: '2025-05-12', category: 'Operacional', description: 'Internet/Telefone', amount: -500.00 },
  { date: '2025-05-15', category: 'Pessoal', description: 'Folha de pagamento', amount: -8000.00 },
  { date: '2025-05-18', category: 'Marketing', description: 'Publicidade digital', amount: -1500.00 },
  { date: '2025-05-20', category: 'Custo - Estoque', description: 'Reposição SSD', amount: -1800.00 },
  { date: '2025-05-22', category: 'Operacional', description: 'Manutenção equipamentos', amount: -800.00 },
  { date: '2025-05-25', category: 'Pessoal', description: 'Comissões vendedores', amount: -2500.00 },
  { date: '2025-05-28', category: 'Custo - Estoque', description: 'Reposição Periféricos', amount: -1200.00 },
  { date: '2025-05-30', category: 'Operacional', description: 'Logística/Frete', amount: -2000.00 },

  // ABRIL 2025 - Vendas
  { date: '2025-04-01', category: 'Vendas - GPU', description: 'RTX 4090 x1', amount: 7500.00 },
  { date: '2025-04-05', category: 'Vendas - CPU', description: 'Intel i9-14900K x3', amount: 5100.00 },
  { date: '2025-04-10', category: 'Vendas - RAM', description: 'DDR5 64GB x5', amount: 2100.00 },
  { date: '2025-04-15', category: 'Vendas - SSD', description: 'NVMe 2TB x4', amount: 1800.00 },
  { date: '2025-04-20', category: 'Vendas - Monitores', description: '4K 144Hz x1', amount: 2000.00 },
  { date: '2025-04-25', category: 'Vendas - Periféricos', description: 'Teclados x8', amount: 1200.00 },
  { date: '2025-04-28', category: 'Vendas - Coolers', description: 'AIO Liquid x3', amount: 900.00 },

  // ABRIL 2025 - Despesas
  { date: '2025-04-02', category: 'Custo - Estoque', description: 'Reposição GPU', amount: -4000.00 },
  { date: '2025-04-05', category: 'Custo - Estoque', description: 'Reposição CPU', amount: -2500.00 },
  { date: '2025-04-08', category: 'Operacional', description: 'Aluguel loja', amount: -3000.00 },
  { date: '2025-04-10', category: 'Operacional', description: 'Energia elétrica', amount: -1100.00 },
  { date: '2025-04-15', category: 'Pessoal', description: 'Folha de pagamento', amount: -7500.00 },
  { date: '2025-04-18', category: 'Marketing', description: 'Publicidade digital', amount: -1000.00 },
  { date: '2025-04-20', category: 'Custo - Estoque', description: 'Reposição SSD', amount: -900.00 },
  { date: '2025-04-25', category: 'Pessoal', description: 'Comissões vendedores', amount: -2000.00 },
  { date: '2025-04-28', category: 'Operacional', description: 'Logística/Frete', amount: -1500.00 },

  // MARÇO 2025 - Vendas
  { date: '2025-03-01', category: 'Vendas - GPU', description: 'RTX 4080 x2', amount: 8000.00 },
  { date: '2025-03-05', category: 'Vendas - CPU', description: 'Ryzen 9 7950X x2', amount: 3600.00 },
  { date: '2025-03-10', category: 'Vendas - RAM', description: 'DDR5 32GB x6', amount: 1800.00 },
  { date: '2025-03-15', category: 'Vendas - SSD', description: 'NVMe 1TB x10', amount: 2000.00 },
  { date: '2025-03-20', category: 'Vendas - Periféricos', description: 'Mouses x20', amount: 1000.00 },
  { date: '2025-03-25', category: 'Vendas - Monitores', description: '1440p 144Hz x1', amount: 1500.00 },
  { date: '2025-03-28', category: 'Vendas - Fontes', description: 'Corsair 850W x2', amount: 1400.00 },

  // MARÇO 2025 - Despesas
  { date: '2025-03-02', category: 'Custo - Estoque', description: 'Reposição GPU', amount: -4500.00 },
  { date: '2025-03-05', category: 'Custo - Estoque', description: 'Reposição CPU', amount: -2000.00 },
  { date: '2025-03-08', category: 'Operacional', description: 'Aluguel loja', amount: -3000.00 },
  { date: '2025-03-10', category: 'Operacional', description: 'Energia elétrica', amount: -1050.00 },
  { date: '2025-03-15', category: 'Pessoal', description: 'Folha de pagamento', amount: -7200.00 },
  { date: '2025-03-18', category: 'Marketing', description: 'Publicidade digital', amount: -800.00 },
  { date: '2025-03-20', category: 'Custo - Estoque', description: 'Reposição SSD', amount: -1000.00 },
  { date: '2025-03-25', category: 'Pessoal', description: 'Comissões vendedores', amount: -1800.00 },
  { date: '2025-03-28', category: 'Operacional', description: 'Logística/Frete', amount: -1200.00 },
]

// Função para simular a análise
function analyzeComputerComponentsSales() {
  console.log('\n' + '='.repeat(80))
  console.log('🖥️  ANÁLISE TÉCNICA - EMPRESA DE COMPONENTES DE COMPUTADOR')
  console.log('='.repeat(80) + '\n')

  // Separar vendas e despesas
  const sales = testTransactions.filter(t => t.amount > 0)
  const expenses = testTransactions.filter(t => t.amount < 0)

  // Calcular totais por mês
  const byMonth = {}
  testTransactions.forEach(t => {
    const month = t.date.substring(0, 7)
    if (!byMonth[month]) byMonth[month] = { sales: 0, expenses: 0, count: 0 }
    if (t.amount > 0) byMonth[month].sales += t.amount
    else byMonth[month].expenses += Math.abs(t.amount)
    byMonth[month].count++
  })

  // Calcular totais por categoria
  const byCategory = {}
  testTransactions.forEach(t => {
    if (!byCategory[t.category]) byCategory[t.category] = 0
    byCategory[t.category] += t.amount
  })

  // Análise de vendas por produto
  const productSales = {}
  sales.forEach(t => {
    if (!productSales[t.category]) productSales[t.category] = 0
    productSales[t.category] += t.amount
  })

  // Cálculos estatísticos
  const salesValues = sales.map(s => s.amount)
  const expenseValues = expenses.map(e => Math.abs(e.amount))
  
  const calculateStats = (values) => {
    if (values.length === 0) return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 }
    const sorted = [...values].sort((a, b) => a - b)
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const median = sorted[Math.floor(sorted.length / 2)]
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    return { mean, median, stdDev, min: sorted[0], max: sorted[sorted.length - 1] }
  }

  const salesStats = calculateStats(salesValues)
  const expenseStats = calculateStats(expenseValues)

  // Totais gerais
  const totalSales = sales.reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const netProfit = totalSales - totalExpenses
  const profitMargin = (netProfit / totalSales) * 100

  console.log('📊 RESUMO EXECUTIVO\n')
  console.log(`Total de Vendas:        R$ ${totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`Total de Despesas:      R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`Lucro Líquido:          R$ ${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`Margem de Lucro:        ${profitMargin.toFixed(2)}%`)
  console.log(`Transações Totais:      ${testTransactions.length}`)

  console.log('\n' + '-'.repeat(80))
  console.log('📈 ANÁLISE ESTATÍSTICA DE VENDAS\n')
  console.log(`Média por Venda:        R$ ${salesStats.mean.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`Mediana:                R$ ${salesStats.median.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`Desvio Padrão:          R$ ${salesStats.stdDev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`Venda Mínima:           R$ ${salesStats.min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`Venda Máxima:           R$ ${salesStats.max.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)

  console.log('\n' + '-'.repeat(80))
  console.log('💰 ANÁLISE ESTATÍSTICA DE DESPESAS\n')
  console.log(`Média por Despesa:      R$ ${expenseStats.mean.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`Mediana:                R$ ${expenseStats.median.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`Desvio Padrão:          R$ ${expenseStats.stdDev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`Despesa Mínima:         R$ ${expenseStats.min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`Despesa Máxima:         R$ ${expenseStats.max.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)

  console.log('\n' + '-'.repeat(80))
  console.log('🏆 TOP 5 PRODUTOS POR RECEITA\n')
  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
  
  topProducts.forEach(([product, revenue], idx) => {
    const pct = ((revenue / totalSales) * 100).toFixed(1)
    console.log(`${idx + 1}. ${product.padEnd(25)} R$ ${revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).padStart(12)} (${pct}%)`)
  })

  console.log('\n' + '-'.repeat(80))
  console.log('📅 ANÁLISE PERÍODO A PERÍODO\n')
  
  const months = Object.keys(byMonth).sort().reverse()
  for (let i = 0; i < months.length - 1; i++) {
    const currMonth = months[i]
    const prevMonth = months[i + 1]
    const curr = byMonth[currMonth]
    const prev = byMonth[prevMonth]
    
    const salesDiff = curr.sales - prev.sales
    const salesPct = ((salesDiff / prev.sales) * 100).toFixed(1)
    const expenseDiff = curr.expenses - prev.expenses
    const expensePct = ((expenseDiff / prev.expenses) * 100).toFixed(1)
    
    console.log(`${currMonth} vs ${prevMonth}:`)
    console.log(`  Vendas:   R$ ${curr.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${salesPct > 0 ? '+' : ''}${salesPct}%)`)
    console.log(`  Despesas: R$ ${curr.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${expensePct > 0 ? '+' : ''}${expensePct}%)`)
    console.log()
  }

  console.log('-'.repeat(80))
  console.log('📊 DISTRIBUIÇÃO DE DESPESAS POR CATEGORIA\n')
  
  const expensesByCategory = {}
  expenses.forEach(t => {
    if (!expensesByCategory[t.category]) expensesByCategory[t.category] = 0
    expensesByCategory[t.category] += Math.abs(t.amount)
  })
  
  Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, amount]) => {
      const pct = ((amount / totalExpenses) * 100).toFixed(1)
      console.log(`${category.padEnd(25)} R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).padStart(12)} (${pct}%)`)
    })

  console.log('\n' + '-'.repeat(80))
  console.log('🔮 PREVISÃO PARA JUNHO 2025\n')
  
  const avgMonthlySales = Object.values(byMonth).reduce((sum, m) => sum + m.sales, 0) / months.length
  const avgMonthlyExpenses = Object.values(byMonth).reduce((sum, m) => sum + m.expenses, 0) / months.length
  const forecastProfit = avgMonthlySales - avgMonthlyExpenses
  const forecastMargin = (forecastProfit / avgMonthlySales) * 100
  
  console.log(`Vendas Estimadas:       R$ ${avgMonthlySales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`Despesas Estimadas:     R$ ${avgMonthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`Lucro Estimado:         R$ ${forecastProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`Margem Estimada:        ${forecastMargin.toFixed(2)}%`)
  console.log(`Intervalo de Confiança: ±${(avgMonthlySales * 0.15).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)

  console.log('\n' + '-'.repeat(80))
  console.log('⚠️  ANOMALIAS DETECTADAS (> 2σ)\n')
  
  const anomalies = salesValues.filter(v => Math.abs(v - salesStats.mean) > 2 * salesStats.stdDev)
  if (anomalies.length > 0) {
    anomalies.forEach(anom => {
      console.log(`  • Venda atípica: R$ ${anom.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    })
  } else {
    console.log('  ✓ Nenhuma anomalia detectada')
  }

  console.log('\n' + '='.repeat(80))
  console.log('✨ Análise concluída com sucesso!\n')
}

// Executar análise
analyzeComputerComponentsSales()

export { testTransactions, analyzeComputerComponentsSales }
