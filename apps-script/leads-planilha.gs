/**
 * Caminho paralelo dos formulários do site (lavagem/manutenção e energia solar).
 *
 * As páginas mandam o mesmo lead para o n8n e para cá. Se o n8n cair, o lead
 * continua gravado na planilha e chega por e-mail para o dono do script.
 *
 * Instalação: crie uma planilha no Google Drive, abra Extensões > Apps Script,
 * cole este arquivo, salve e implante como "App da Web" (executar como: você;
 * quem pode acessar: qualquer pessoa). O link /exec vai no PLANILHA_ENDPOINT das páginas.
 */

var ABAS = {
  lavagem: {
    nome: 'Lavagem e manutenção',
    colunas: ['Recebido em', 'Nome', 'WhatsApp', 'Serviço', 'Tipo', 'Cidade', 'Placas', 'Problema', 'Anúncio', 'Página', 'gclid', 'fbc', 'fbp']
  },
  solar: {
    nome: 'Energia solar',
    colunas: ['Recebido em', 'Nome', 'WhatsApp', 'Tipo', 'Cidade', 'Conta de luz', 'Conta anexada', 'Anúncio', 'Página', 'gclid', 'fbc', 'fbp']
  }
};

var SERVICOS = { lavagem: 'Lavagem + preventiva', problema: 'Manutenção corretiva' };
var TIPOS = { casa: 'Casa', comercio: 'Comércio', industria: 'Indústria', usina: 'Usina solo', rural: 'Área rural' };
var PROBLEMAS = { inversor: 'Inversor parado ou com erro', gerando_menos: 'Gerando menos que o normal', dano: 'Placa ou cabo danificado', outro: 'Outro' };
var FAIXAS = { ate_300: 'Até R$ 300', '300_600': 'R$ 300 a 600', '600_1200': 'R$ 600 a 1.200', '1200_3000': 'R$ 1.200 a 3.000', acima_3000: 'Acima de R$ 3.000', nao_sei: 'Não sabe' };
var PASTA_CONTAS = 'Contas de luz - formulário do site';

function doPost(e) {
  var b;
  try {
    b = JSON.parse(e.postData.contents);
  } catch (err) {
    return resposta(false);
  }
  // Campo invisível da página: só robô preenche.
  if (b.website) return resposta(true);

  var tipoForm = b.formulario === 'solar' ? 'solar' : 'lavagem';
  var aba = obterAba(tipoForm);
  var fone = String(b.telefone || '').replace(/\D/g, '');
  if (fone && fone.indexOf('55') !== 0) fone = '55' + fone;
  var linkZap = fone ? 'https://wa.me/' + fone : '';
  var agora = new Date();

  var linha;
  var resumo;
  if (tipoForm === 'solar') {
    var linkConta = salvarConta(b.conta, b.nome, agora);
    linha = [agora, b.nome, linkZap, TIPOS[b.tipo] || b.tipo, b.cidade, FAIXAS[b.contaFaixa] || b.contaFaixa,
      linkConta || 'Não', b.anuncio, b.paginaUrl, b.gclid, b.fbc, b.fbp];
    resumo = 'Imóvel: ' + (TIPOS[b.tipo] || b.tipo) + '\nCidade: ' + b.cidade + '\nConta de luz: ' + (FAIXAS[b.contaFaixa] || b.contaFaixa)
      + '\nConta anexada: ' + (linkConta || 'não');
  } else {
    var problema = b.servico === 'problema' ? (PROBLEMAS[b.problema] || b.problema || '') : '';
    linha = [agora, b.nome, linkZap, SERVICOS[b.servico] || b.servico, TIPOS[b.tipo] || b.tipo, b.cidade,
      b.placas || 'Não sabe', problema, b.anuncio, b.paginaUrl, b.gclid, b.fbc, b.fbp];
    resumo = 'Serviço: ' + (SERVICOS[b.servico] || b.servico) + '\nTipo: ' + (TIPOS[b.tipo] || b.tipo) + '\nCidade: ' + b.cidade
      + '\nPlacas: ' + (b.placas || 'não sabe') + (problema ? '\nProblema: ' + problema : '');
  }
  aba.appendRow(linha.map(function (v) { return v == null ? '' : v; }));

  try {
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: 'Formulário do site (' + ABAS[tipoForm].nome + '): ' + (b.nome || 'sem nome'),
      body: 'Nome: ' + b.nome + '\nWhatsApp: ' + linkZap + '\n' + resumo + '\nAnúncio: ' + (b.anuncio || 'sem anúncio')
        + '\n\nPlanilha: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
    });
  } catch (err) {
    // Cota de e-mail estourada não pode perder a linha, que já foi gravada.
  }
  return resposta(true);
}

function obterAba(tipoForm) {
  var cfg = ABAS[tipoForm];
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(cfg.nome);
  if (!aba) {
    aba = planilha.insertSheet(cfg.nome);
    aba.appendRow(cfg.colunas);
    aba.setFrozenRows(1);
    aba.getRange(1, 1, 1, cfg.colunas.length).setFontWeight('bold');
  }
  return aba;
}

function salvarConta(conta, nome, quando) {
  if (!conta || typeof conta.base64 !== 'string' || conta.base64.length < 100) return '';
  try {
    var pastas = DriveApp.getFoldersByName(PASTA_CONTAS);
    var pasta = pastas.hasNext() ? pastas.next() : DriveApp.createFolder(PASTA_CONTAS);
    var ext = conta.tipo === 'application/pdf' ? '.pdf' : '.jpg';
    var arquivo = Utilities.formatDate(quando, 'America/Recife', 'yyyy-MM-dd HHmm') + ' - ' + (nome || 'sem nome') + ext;
    var blob = Utilities.newBlob(Utilities.base64Decode(conta.base64), conta.tipo, arquivo);
    return pasta.createFile(blob).getUrl();
  } catch (err) {
    return 'Anexou, mas falhou ao salvar';
  }
}

function resposta(ok) {
  return ContentService.createTextOutput(JSON.stringify({ ok: ok })).setMimeType(ContentService.MimeType.JSON);
}

// Rode uma vez pelo editor para autorizar planilha, Drive e e-mail e criar as abas.
function testar() {
  doPost({ postData: { contents: JSON.stringify({
    formulario: 'lavagem', nome: 'TESTE - pode apagar', telefone: '84900000000', servico: 'lavagem',
    tipo: 'casa', cidade: 'Natal', placas: 10, anuncio: 'teste'
  }) } });
  obterAba('solar');
}
