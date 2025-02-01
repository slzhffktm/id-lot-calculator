document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('calculator-form');
  const entryPricesContainer = document.getElementById('entry-prices');
  const resultsContainer = document.getElementById('results');
  const resultsTableBody = resultsContainer.querySelector('tbody');

  // Add initial entry price
  let entryCount = 1;

  // Add new entry price field
  document.getElementById('add-entry').addEventListener('click', () => {
    entryCount++;
    const newEntry = createEntryPriceField(entryCount);
    entryPricesContainer.appendChild(newEntry);
  });

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const balance = parseFloat(form.balance.value);
    const riskPercentage = parseFloat(form.risk.value) / 100;
    const stopLoss = parseFloat(form['stop-loss'].value);
    const feePercentage = parseFloat(form.fee.value) / 100;
    const entryPrices = Array.from(document.querySelectorAll('.entry-price'))
      .map(input => parseFloat(input.value))
      .filter(price => !isNaN(price));

    // Validate inputs
    if (!validateInputs(balance, riskPercentage, stopLoss, feePercentage, entryPrices)) {
      return;
    }

    // Calculate results
    const results = calculateLots(balance, riskPercentage, stopLoss, feePercentage, entryPrices);
    
    // Display results
    displayResults(results);
    resultsContainer.classList.remove('hidden');
  });

  // Create new entry price field
  function createEntryPriceField(index) {
    const group = document.createElement('div');
    group.className = 'entry-price-group';

    const label = document.createElement('label');
    label.textContent = `Entry Price ${index}:`;
    
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'entry-price';
    input.step = '0.01';
    input.required = true;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-entry';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      group.remove();
      entryCount--;
    });

    group.append(label, input, removeBtn);
    return group;
  }

  // Validate inputs
  function validateInputs(balance, riskPercentage, stopLoss, feePercentage, entryPrices) {
    if (isNaN(balance) || balance <= 0) {
      alert('Please enter a valid balance');
      return false;
    }

    if (isNaN(riskPercentage) || riskPercentage <= 0 || riskPercentage > 1) {
      alert('Please enter a valid risk percentage (0-100%)');
      return false;
    }

    if (isNaN(stopLoss) || stopLoss <= 0) {
      alert('Please enter a valid stop loss price');
      return false;
    }

    if (isNaN(feePercentage) || feePercentage <= 0 || feePercentage > 1) {
        alert('Please enter a valid fee percentage (0-100%)');
        return false;
      }

    if (entryPrices.length === 0) {
      alert('Please enter at least one entry price');
      return false;
    }

    if (entryPrices.some(price => price <= stopLoss)) {
      alert('All entry prices must be greater than stop loss');
      return false;
    }

    return true;
  }

  // Calculate lot sizes
  function calculateLots(balance, riskPercentage, stopLoss, feePercentage, entryPrices) {
    const totalRisk = balance * riskPercentage;
    const riskPerEntry = totalRisk / entryPrices.length;

    let totalLoss = 0;
    let totalFee = 0;

    const results = entryPrices.map(entryPrice => {
      const priceDifference = entryPrice - stopLoss;
      const lots = Math.floor(riskPerEntry / (priceDifference * 100));
      const idrLoss = priceDifference * lots * 100;

      // Calculate fee.
      const tradeVal = lots * entryPrice * 100;

      totalLoss += idrLoss;
      totalFee += tradeVal * feePercentage;

      return {
        entryPrice,
        lots,
        idrLoss
      };
    });

    const adjustmentFactor = totalRisk / (totalLoss + totalFee);

    return results.map(result => {
      result.lots = Math.floor(result.lots * adjustmentFactor);
      result.idrLoss = result.lots * (result.entryPrice - stopLoss) * 100;
      return result;
    });
  }

  // Display results in table
  function displayResults(results) {
    resultsTableBody.innerHTML = '';

    results.forEach(result => {
      const row = document.createElement('tr');
      
      const entryPriceCell = document.createElement('td');
      entryPriceCell.textContent = formatCurrency(result.entryPrice);
      
      const lotsCell = document.createElement('td');
      lotsCell.textContent = result.lots;
      
      const idrLossCell = document.createElement('td');
      idrLossCell.textContent = formatCurrency(result.idrLoss);

      row.append(entryPriceCell, lotsCell, idrLossCell);
      resultsTableBody.appendChild(row);
    });
  }

  // Format IDR currency
  function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }
});
