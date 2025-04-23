const axios = require('axios');
const fs = require('fs');

const intercomToken = 'Bearer'; // substitua pelo seu token real
const outputFile = 'ticketsAbril.json';

// Timestamp de 01/04/2025 a 21/04/2025
const dataInicial = 1743724800;
const dataFinal = 1745280000;

async function buscarConversasIntercom() {
  const resultados = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const payload = {
      query: {
        operator: 'AND',
        value: [
          {
            field: 'created_at',
            operator: '>',
            value: dataInicial
          },
          {
            field: 'created_at',
            operator: '<',
            value: dataFinal
          }
        ]
      },
      pagination: {
        per_page: 1,
        starting_after: startingAfter
      }
    };

    try {
      const response = await axios.post(
        'https://api.intercom.io/conversations/search',
        payload,
        {
          headers: {
            'Authorization': intercomToken,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      const conversas = response.data.conversations;

      for (const conversa of conversas) {
        const atributos = conversa?.custom_attributes || {};
        const ticket = {
          IntercomID: conversa.id,
          JIRA_ITSM: atributos.jira_itsm || 'Não vinculado',
          Departamento: atributos.departamento || 'Não informado'
        };

        if (atributos.jira_itsm) {
          console.log(`🟢 Com integração: ${ticket.IntercomID}`);
        } else {
          console.log(`🟡 Sem integração: ${ticket.IntercomID}`);
        }

        resultados.push(ticket);
      }

      hasMore = response.data.pages?.next?.starting_after != null;
      startingAfter = response.data.pages?.next?.starting_after;
    } catch (error) {
      console.error('❌ Erro ao buscar conversas:', error.response?.data || error.message);
      break;
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(resultados, null, 2), 'utf8');
  console.log(`✅ Salvo ${resultados.length} tickets no arquivo ${outputFile}`);
}

buscarConversasIntercom();
