const fs = require('fs');
const axios = require('axios');

console.log('🔧 Iniciando script de atualização de Departamento no Jira...');

const accessTokenJira = ' Basic aW50ZWdyYWNhb19qaXJhX2ludGVyY29vbUBlc3RhcGFyLmNvbS5icjpBVEFUVDN4RmZHRjBzR3k0cmVjY1ZaQ2ZWY1pWMFFuV0JpdXAyOTU4T1EzU3RqS1dHNTZ4QnNHX1dUSVJEYTlpUlV1LURzQ3YxR2cwVVE3ZFF4SGVRemppRWgtaTVRV0Z6aU9zMDF6QlgxMktjaGF1S2R5N3ppUkxqY2JXQ2dPV3hrSXhHZzh2X0s3NVZYbkc4cDV1Ri1CNXk1Tm4xc3ZMMU5fODZtS0JfbTlmWHRfbGwxRzBqWEk9QjI4ODU1REQ=';
const ticketsFile = 'ticketsIntercomJira.json';
const tickets = JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));

const campoDepartamento = 'customfield_10099';

async function atualizarDepartamentoNoJira(ticket) {
  const jiraId = ticket.JIRA_ITSM;

  if (!jiraId || jiraId === 'Não vinculado' || jiraId === 'N/A') {
    console.log(`⏭️ Pulado: ${ticket.IntercomID} - JIRA_ITSM inválido (${jiraId})`);
    return;
  }

  const departamento = ticket.Departamento;

  if (!departamento || departamento === 'Não informado' || departamento === 'N/A') {
    console.log(`⏭️ Pulado: ${ticket.IntercomID} - Departamento não informado (${departamento})`);
    return;
  }

  const payload = {
    fields: {
      [campoDepartamento]: departamento
    }
  };

  try {
    await axios.put(
      `https://estaparjsm.atlassian.net/rest/api/3/issue/${jiraId}`,
      payload,
      {
        headers: {
          'Authorization': accessTokenJira,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Atualizado: ${jiraId} → Departamento: ${departamento}`);
  } catch (error) {
    console.error(`❌ Erro ao atualizar ${jiraId}:`, error.response?.data || error.message);
  }
}

async function processarTickets() {
  for (const ticket of tickets) {
    await atualizarDepartamentoNoJira(ticket);
  }
  console.log('🏁 Processamento concluído.');
}

processarTickets();
