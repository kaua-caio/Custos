// Login Simples
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    showLoader();
  
    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';
        loadSavedData();
      } else {
        alert('Nome de usuário ou senha incorretos!');
      }
      hideLoader();
    }, 1500);
  });
  
  // Funções auxiliares
  function showLoader() {
    document.getElementById('loaderOverlay').style.display = 'flex';
  }
  
  function hideLoader() {
    document.getElementById('loaderOverlay').style.display = 'none';
  }
  
  function showButtonLoading(button) {
    button.classList.add('loading');
    setTimeout(() => {
      button.classList.remove('loading');
    }, 1500);
  }
  
  // FUNÇÃO PRINCIPAL DE CÁLCULO
  function calcular() {
    const button = event.target.closest('button');
    showButtonLoading(button);
    showLoader();
  
    setTimeout(() => {
      const tabela = document.getElementById('tabela');
      const linhas = tabela.rows;
      let textoRelatorio = '📊 *RELATÓRIO DE CUSTOS AWS - EQUIPE DE TI*\n\n';
      let currentSection = '';
      let totalAnterior = 0;
      let totalAtual = 0;
      let hasData = false;
  
      for (let i = 1; i < linhas.length; i++) {
        const celulas = linhas[i].cells;
  
        if (celulas.length === 1) {
          currentSection = celulas[0].textContent.trim();
          textoRelatorio += `\n *${currentSection}*\n`;
          continue;
        }
  
        if (celulas.length === 5) {
          const nomeServico = celulas[0].textContent.trim();
          const inputAnterior = celulas[1].querySelector('input');
          const inputAtual = celulas[2].querySelector('input');
          const campoDiferenca = celulas[3];
          const campoSituacao = celulas[4];
  
          // Obter e limpar os valores
          const valorAnterior = parseUSDFloat(inputAnterior.value);
          const valorAtual = parseUSDFloat(inputAtual.value);
  
          // Pular se ambos estiverem vazios/zero
          if (valorAnterior === 0 && valorAtual === 0) {
            campoDiferenca.textContent = '';
            campoSituacao.textContent = '';
            continue;
          }
  
          hasData = true;
  
          // Cálculo preciso da diferença
          const diferenca = valorAtual - valorAnterior;
  
          // Acumular totais
          totalAnterior = preciseAdd(totalAnterior, valorAnterior);
          totalAtual = preciseAdd(totalAtual, valorAtual);
  
          // Determinar status
          let situacao, statusClass;
  
          if (diferenca > 0.001) { // Considera aumento se > 0.001
            situacao = `↑ Aumento: ${formatUSD(diferenca)}`;
            statusClass = 'status-increase';
          } else if (diferenca < -0.001) { // Considera redução se < -0.001
            situacao = `↓ Redução: ${formatUSD(Math.abs(diferenca))}`;
            statusClass = 'status-decrease';
          } else { // Considera estável se variação pequena
            situacao = `→ Sem alteração: ${formatUSD(0)}`;
            statusClass = 'status-neutral';
          }
  
          // Atualizar células
          campoDiferenca.textContent = formatUSD(diferenca);
          campoDiferenca.className = 'resultado ' + statusClass;
          campoSituacao.textContent = situacao;
          campoSituacao.className = statusClass;
  
          // Adicionar ao relatório
          textoRelatorio += `• ${nomeServico}: ${situacao}\n`;
        }
      }
  
      if (!hasData) {
        alert('Por favor, insira valores para pelo menos um serviço antes de calcular.');
        hideLoader();
        return;
      }
  
      // Atualizar totais no cabeçalho
      updateTotal('totalPrevious', totalAnterior);
      updateTotal('totalCurrent', totalAtual);
  
      const diferencaTotal = totalAtual - totalAnterior;
      updateTotal('totalDifference', diferencaTotal, true);
  
      // Gerar relatório completo
      textoRelatorio += `\n *RESUMO*\n`;
      textoRelatorio += `Total Semana Anterior: ${formatUSD(totalAnterior)}\n`;
      textoRelatorio += `Total Semana Atual: ${formatUSD(totalAtual)}\n`;
      textoRelatorio += `Variação Total: ${formatUSD(Math.abs(diferencaTotal))} `;
      textoRelatorio += diferencaTotal > 0.001 ? '(Aumento)' :
                       diferencaTotal < -0.001 ? '(Redução)' : '(Sem alteração)';
      textoRelatorio += `\n\n Atualizado em: ${new Date().toLocaleString('pt-BR')}`;
      textoRelatorio += `\n EQUIPE DE TI - Gerenciamento de Custos AWS`;
  
      document.getElementById('saidaTexto').value = textoRelatorio;
      saveData();
      hideLoader();
    }, 500);
  }
  
  // FUNÇÕES AUXILIARES PRECISAS PARA USD - VERSÃO CORRIGIDA
  
  // Converte string para número float (USD) com precisão, tratando formato brasileiro
  function parseUSDFloat(value) {
    if (!value || value.trim() === '') return 0;
    
    // Remove tudo exceto números, vírgula, ponto e sinal negativo
    const cleaned = value.replace(/[^\d.,-]/g, '');
    
    // Verifica se está no formato brasileiro (vírgula decimal)
    const isBrazilianFormat = cleaned.includes(',') && 
                            (cleaned.indexOf(',') > cleaned.indexOf('.') || !cleaned.includes('.'));
    
    let normalized;
    if (isBrazilianFormat) {
      // Formato BR: 1.000,50 → 1000.50
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato US: 1,000.50 → 1000.50
      normalized = cleaned.replace(/,/g, '');
    }
    
    const num = parseFloat(normalized) || 0;
    return parseFloat(num.toFixed(4));
  }
  
  // Soma precisa para evitar erros de ponto flutuante
  function preciseAdd(a, b) {
    return parseFloat((a + b).toFixed(4));
  }
  
  // Formata como USD ($1,234.56) - Formato internacional
  function formatUSD(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
  
  // Atualiza totais com formatação correta
  function updateTotal(elementId, value, isDifference = false) {
    const element = document.getElementById(elementId);
    const absValue = Math.abs(value);
  
    // Formata o valor absoluto
    element.textContent = formatUSD(absValue);
  
    // Reset classes
    element.className = 'stat-value';
  
    if (isDifference) {
      if (value > 0.001) {
        element.classList.add('status-increase');
      } else if (value < -0.001) {
        element.classList.add('status-decrease');
      } else {
        element.classList.add('status-neutral');
      }
    }
  }
  
  // MÁSCARA DE INPUT PARA USD - VERSÃO MELHORADA
  document.querySelectorAll('#tabela input').forEach(input => {
    input.addEventListener('blur', function() {
      if (this.value) {
        const num = parseUSDFloat(this.value);
        this.value = formatUSD(num);
      }
    });
  
    input.addEventListener('input', function() {
      // Permite apenas números, vírgula, ponto e backspace
      this.value = this.value.replace(/[^\d,.]/g, '');
      
      // Garante apenas um separador decimal
      const decimalSeparator = this.value.includes(',') ? ',' : '.';
      const parts = this.value.split(/[,.]/);
      
      if (parts.length > 2) {
        // Se tiver mais de um separador, mantém apenas o primeiro
        this.value = parts[0] + decimalSeparator + parts.slice(1).join('');
      }
      
      saveData();
    });
  });
  
  // FUNÇÕES DE FORMATAÇÃO E MANIPULAÇÃO DE DADOS
  function cleanCurrencyInput(value) {
    const cleaned = value.replace(/[^\d.,-]/g, '');
    const normalized = cleaned.replace(',', '.');
    return parseFloat(normalized) || 0;
  }
  
  // Funções de persistência e utilitárias
  function copyToClipboard() {
    const texto = document.getElementById('saidaTexto');
    texto.select();
    document.execCommand('copy');
  
    const btn = event.target.closest('button');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
  
    setTimeout(() => {
      btn.innerHTML = originalHTML;
    }, 2000);
  }
  
  function exportToCSV() {
    const button = event.target.closest('button');
    showButtonLoading(button);
  
    const tabela = document.getElementById('tabela');
    const linhas = tabela.rows;
    let csv = 'Serviço,Semana Anterior,Semana Atual,Diferença,Situação\n';
  
    for (let i = 1; i < linhas.length; i++) {
      const celulas = linhas[i].cells;
      if (celulas.length === 5) {
        const nomeServico = celulas[0].textContent.trim();
        const valorAnterior = celulas[1].querySelector('input')?.value || '0';
        const valorAtual = celulas[2].querySelector('input')?.value || '0';
        const diferenca = celulas[3].textContent.trim();
        const situacao = celulas[4].textContent.trim();
  
        csv += `"${nomeServico}","${valorAnterior}","${valorAtual}","${diferenca}","${situacao}"\n`;
      }
    }
  
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_custos_aws_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  function openGoogleDrive() {
    const button = event.target.closest('button');
    showButtonLoading(button);
    setTimeout(() => {
      window.open('https://drive.google.com', '_blank');
    }, 800);
  }
  
  function copyToWhatsApp() {
    const button = event.target.closest('button');
    showButtonLoading(button);
  
    setTimeout(() => {
      const texto = document.getElementById('saidaTexto').value;
      if (texto.trim() === '') {
        alert('Por favor, gere o relatório primeiro!');
        return;
      }
  
      const textoCodificado = encodeURIComponent(texto);
      window.open(`https://wa.me/?text=${textoCodificado}`, '_blank');
    }, 800);
  }
  
  function saveData() {
    const inputs = document.querySelectorAll('#tabela input');
    const data = Array.from(inputs).map(input => input.value);
    localStorage.setItem('awsCostData', JSON.stringify(data));
  }
  
  function loadSavedData() {
    const savedData = localStorage.getItem('awsCostData');
    if (savedData) {
      const data = JSON.parse(savedData);
      const inputs = document.querySelectorAll('#tabela input');
  
      data.forEach((value, index) => {
        if (inputs[index]) {
          inputs[index].value = value;
        }
      });
    }
  }