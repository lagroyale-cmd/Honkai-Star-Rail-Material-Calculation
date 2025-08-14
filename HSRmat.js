(function(){
  const $ = sel => document.querySelector(sel);
  const el = id => document.getElementById(id);

  function calcRuns(reqP, reqB, reqG, cfg){
    const {
      energyPerRun, avgGreen, baseBlue, pChance, gPerB, bPerP
    } = cfg;

    // Iterate runs upward until all requirements are met in expectation
    let runs = 0;
    while (true){
      const greens = avgGreen * runs;
      const surplusG = Math.max(0, greens - reqG);
      const blues = baseBlue * runs + (surplusG / gPerB);

      // Amount of blues we must keep to satisfy B
      const keepB = Math.max(0, reqB);
      const surplusB = Math.max(0, blues - keepB);

      const pDirect = pChance * runs;
      const pFromB = surplusB / bPerP;
      const pTotal = pDirect + pFromB;

      const gOK = greens >= reqG;
      const bOK = blues >= reqB; // we only convert surplus after meeting B
      const pOK = pTotal >= reqP;

      if (gOK && bOK && pOK) break;
      runs++;
      // fail-safe to avoid infinite loops if inputs are crazy
      if (runs > 1e6) throw new Error("Inputs too large");
    }

    const energy = runs * cfg.energyPerRun;
    return { runs, energy };
  }

  function calcTime(totalEnergy, startEnergy, rechargePerHour){
    if (totalEnergy <= 0) return { days: 0, daily: rechargePerHour*24 };
    const daily = rechargePerHour * 24; // 240/day default
    const rem = Math.max(0, totalEnergy - startEnergy);
    // If we can finish entirely within starting energy → 1 day. Otherwise add days for recharges.
    const extraDays = Math.ceil(rem / daily);
    const totalDays = totalEnergy <= startEnergy ? 1 : (1 + extraDays);
    return { days: totalDays, daily };
  }

  function format(n){
    return Number.isInteger(n) ? n.toString() : n.toFixed(2);
  }

  function computeAndRender(){
    const reqP = +el('reqP').value || 0;
    const reqB = +el('reqB').value || 0;
    const reqG = +el('reqG').value || 0;

    const cfg = {
      energyPerRun: +el('energyPerRun').value || 10,
      avgGreen: +el('avgGreen').value || 1.5,
      baseBlue: +el('baseBlue').value || 1,
      pChance: +el('pChance').value || 0.1667,
      gPerB: +el('gPerB').value || 3,
      bPerP: +el('bPerP').value || 3,
      startEnergy: +el('startEnergy').value || 300,
      capEnergy: +el('capEnergy').value || 300,
      rechargePerHour: +el('rechargePerHour').value || 10
    };

    const { runs, energy } = calcRuns(reqP, reqB, reqG, cfg);

    // Compute expected materials at the chosen runs
    const greens = cfg.avgGreen * runs;
    const surplusG = Math.max(0, greens - reqG);
    const blues = cfg.baseBlue * runs + (surplusG / cfg.gPerB);
    const pDirect = cfg.pChance * runs;
    const surplusB = Math.max(0, blues - reqB);
    const pFromB = surplusB / cfg.bPerP;
    const pTotal = pDirect + pFromB;

    const time = calcTime(energy, cfg.startEnergy, cfg.rechargePerHour);

    el('outRuns').textContent = format(runs);
    el('outEnergy').textContent = format(energy);
    el('outDaily').textContent = format(time.daily) + ' / day';
    el('outDays').textContent = format(time.days);

    el('outG').textContent = format(greens);
    el('outB').textContent = format(blues);
    el('outPdirect').textContent = format(pDirect);
    el('outPtotal').textContent = format(pTotal);

    $('#results').hidden = false;
  }

  el('calcBtn').addEventListener('click', computeAndRender);
  el('resetBtn').addEventListener('click', () => {
    el('reqP').value = 0; el('reqB').value = 0; el('reqG').value = 0;
    el('energyPerRun').value = 10; el('avgGreen').value = 1.5; el('baseBlue').value = 1; el('pChance').value = 0.1667;
    el('gPerB').value = 3; el('bPerP').value = 3; el('startEnergy').value = 300; el('capEnergy').value = 300; el('rechargePerHour').value = 10;
    document.getElementById('results').hidden = true;
  });

  // Auto-calc once on load with defaults
  computeAndRender();
})();
