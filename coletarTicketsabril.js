const axios = require('axios');
const fs = require('fs');

// Configurações
const jiraUrl = 'https://estaparjsm.atlassian.net/rest/api/2/search';
const jiraAuth = 'Basic ';
const intercomToken = 'Bearer';
const outputFile = 'ticketsAbril.json';

async function buscarTicketsJira() {
  try {
    // Buscar os chamados do Jira com o filtro correto
    const response = await axios.get(jiraUrl, {
      headers: {
        'Authorization': jiraAuth,
        'Accept': 'application/json'
      },
      params: {
        jql: `"Departamento - Intercom[Short text]" IS EMPTY AND reporter = "712020:c5471e87-eec9-4c59-ae69-7757057e122d" AND created >= "2025-04-01" ORDER BY created DESC`,
        maxResults: 300
      }
    });

    const tickets = response.data.issues;
    console.log(`🔍 Encontrados ${tickets.length} tickets no Jira`);

    const resultados = [];

    for (const ticket of tickets) {
      // IntercomID vem do campo de descrição, sumário ou customfield_10813
      const intercomID =
        ticket.fields.customfield_10813 || // usa se existir
        extrairIntercomID(ticket.fields.description) || // ou tenta da descrição
        extrairIntercomID(ticket.fields.summary); // ou do sumário

      console.log(`🔎 Ticket ${ticket.key} | IntercomID: ${intercomID}`);

      if (intercomID) {
        const intercomTicket = await buscarTicketIntercom(intercomID);
        if (intercomTicket) {
          resultados.push(intercomTicket);
        } else {
          console.log(`⚠️ Nenhum dado do Intercom para ${intercomID}`);
        }
      } else {
        console.log(`⚠️ Ticket ${ticket.key} sem IntercomID`);
      }
    }

    // Salvar no arquivo
    console.log(`📦 Total com dados do Intercom: ${resultados.length}`);
    fs.writeFileSync(outputFile, JSON.stringify(resultados, null, 2), 'utf8');
    console.log(`✅ Dados salvos em ${outputFile}`);

  } catch (error) {
    console.error('❌ Erro ao buscar tickets do Jira:', error.response?.data || error.message);
  }
}

async function buscarTicketIntercom(intercomID) {
    try {
      const response = await axios.get(`https://api.intercom.io/conversations/${intercomID}`, {
        headers: {
          'Authorization': intercomToken,
          'Accept': 'application/json'
        }
      });
  
      const conversa = response.data;
      const atributos = conversa?.custom_attributes || {};
      const temIntegracao = atributos?.jira_itsm;
  
      const ticket = {
        IntercomID: conversa.id,
        JIRA_ITSM: atributos.jira_itsm || 'Não vinculado',
        Departamento: atributos.departamento || 'Não informado'
      };
  
      if (temIntegracao) {
        console.log(`🟢 Intercom ${intercomID} com integração`);
      } else {
        console.log(`🟡 Intercom ${intercomID} sem integração`);
      }
  
      return ticket;
  
    } catch (error) {
      console.error(`❌ Erro no Intercom ${intercomID}:`, error.response?.data || error.message);
      return null;
    }
  }
  

// Função auxiliar para extrair IntercomID de texto (ex: "IntercomID: 123456789")
function extrairIntercomID(texto) {
  if (!texto) return null;
  const match = texto.match(/IntercomID[:\s]+(\d+)/i);
  return match ? match[1] : null;
}

// Executar
buscarTicketsJira();
