/**
 * Dia de EXEMPLO (valores fictícios) mostrado nas abas Entrada e Umidade pra
 * quem tem acesso "Só ver" na Granulometria: a pessoa enxerga como é o
 * lançamento, com tudo travado. Nada daqui vem do banco nem é salvo.
 *
 * Mesmo formato de um registro de verdade (ver emptyDay() em utils/calc.js).
 * Os valores foram escolhidos pra todo material fechar com o MF dentro da
 * faixa. Mudou peneira ou faixa em materials.js? Ajuste aqui também.
 */
export const EXEMPLO_DIA = {
  resp: 'João da Silva',
  filial: 'POA Norte',
  areia_fina: {
    nf: '45210',
    placa: 'ABC-1234',
    masses: { 6.3: '0', 4.8: '2.6', 2.4: '7.4', 1.2: '20.3', 0.6: '69.8', 0.3: '150.2', 0.15: '189.5', fundo: '60.2' },
    pulvMf: '489.5',
  },
  areia_media: {
    nf: '45187',
    placa: 'DEF-5678',
    masses: { 6.3: '0', 4.8: '10.3', 2.4: '39.8', 1.2: '90.4', 0.6: '119.7', 0.3: '150.1', 0.15: '69.6', fundo: '20.1' },
    pulvMf: '492.0',
  },
  diabasio_0: {
    nf: '45302',
    placa: 'GHI-9012',
    masses: { 19: '0', 12.5: '61.5', 9.5: '538.2', 6.3: '901.4', 4.8: '339.6', 2.4: '139.8', fundo: '19.5' },
    pulvMf: '991.5',
  },
  diabasio_1: {
    nf: '45303',
    placa: 'GHI-9012',
    masses: { 25: '0', 19: '251.3', 12.5: '2598.6', 9.5: '1751.2', 6.3: '329.4', 4.8: '54.8', fundo: '14.7' },
    pulvMf: '994.0',
  },
  granito_0: {
    nf: '45266',
    placa: 'JKL-3456',
    masses: { 19: '0', 12.5: '20.4', 9.5: '339.1', 6.3: '961.3', 4.8: '439.7', 2.4: '199.8', fundo: '39.7' },
    pulvMf: '990.5',
  },
  granito_1: {
    nf: '45267',
    placa: 'JKL-3456',
    masses: { 32: '0', 25: '0', 19: '401.2', 12.5: '2549.3', 9.5: '1699.8', 6.3: '275.4', 4.8: '49.6', fundo: '24.7' },
    pulvMf: '993.5',
  },
  basalto_0: {
    nf: '45291',
    placa: 'MNO-7890',
    masses: { 19: '0', 12.5: '80.6', 9.5: '619.3', 6.3: '880.2', 4.8: '300.4', 2.4: '103.7', fundo: '15.8' },
    pulvMf: '992.0',
  },
  umidade: [
    { id: 1, numero: 1, hora: '07:30', matId: 'areia_media', leitura: '405' },
    { id: 2, numero: 1, hora: '07:35', matId: 'areia_fina', leitura: '402' },
    { id: 3, numero: 2, hora: '10:15', matId: 'areia_media', leitura: '407' },
    { id: 4, numero: 2, hora: '10:20', matId: 'areia_fina', leitura: '403' },
  ],
}

// Como fica o formulário "Nova leitura" da Umidade no meio de um lançamento
export const EXEMPLO_LEITURA = { numero: 3, matId: 'areia_media', hora: '13:40', leitura: '406' }
