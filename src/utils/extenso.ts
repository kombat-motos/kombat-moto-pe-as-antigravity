export function numeroParaExtenso(valor: number): string {
  if (valor === 0) return 'zero reais';

  const inteiros = Math.floor(valor);
  const centavos = Math.round((valor - inteiros) * 100);

  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const dezenas = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const especiais = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  function converterGrupo(num: number): string {
    if (num === 0) return '';
    if (num === 100) return 'cem';

    let extenso = '';
    const c = Math.floor(num / 100);
    const d = Math.floor((num % 100) / 10);
    const u = num % 10;

    if (c > 0) extenso += centenas[c];
    if (c > 0 && (d > 0 || u > 0)) extenso += ' e ';

    if (d === 1) {
      extenso += especiais[u];
    } else {
      if (d > 1) extenso += dezenas[d];
      if (d > 1 && u > 0) extenso += ' e ';
      if (u > 0 && d !== 1) extenso += unidades[u];
    }

    return extenso;
  }

  let partesReais: string[] = [];
  let milhar = Math.floor(inteiros / 1000);
  let resto = inteiros % 1000;

  if (milhar > 0) {
    if (milhar === 1) partesReais.push('mil');
    else partesReais.push(converterGrupo(milhar) + ' mil');
  }

  if (resto > 0) {
    if (milhar > 0 && resto < 100) partesReais.push('e');
    partesReais.push(converterGrupo(resto));
  }

  let extensoReal = partesReais.join(' ').trim();
  if (inteiros > 0) extensoReal += inteiros === 1 ? ' real' : ' reais';

  let extensoCentavos = '';
  if (centavos > 0) {
    extensoCentavos = converterGrupo(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
  }

  if (inteiros > 0 && centavos > 0) {
    return extensoReal + ' e ' + extensoCentavos;
  } else if (inteiros > 0) {
    return extensoReal;
  } else {
    return extensoCentavos;
  }
}
