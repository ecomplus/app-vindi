/* eslint-disable */
;(function () {
  window._vindiHash = function (card) {
    return new Promise(function (resolve, reject) {
      // https://atendimento.vindi.com.br/hc/pt-br/articles/115009609107-Como-eu-cadastro-perfis-de-pagamento-
      var vindiSubdomain = window._vindiSandbox ? 'sandbox-app' : 'app'
      fetch('https://' + vindiSubdomain + '.vindi.com.br/api/v1/public/payment_profiles', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + window.btoa(window._vindiKey + ':'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          holder_name: card.name,
          card_expiration: card.month.padStart(2, '0') + '/' + card.year.toString().padStart(4, '20'),
          card_number: card.number,
          card_cvv: card.cvc,
          payment_method_code: 'credit_card',
          payment_company_code: card.brand
        })
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Card hash request failed with ' + response.status)
          }
          return response.json()
        })
        .then(function (data) {
          resolve(data.payment_profile.gateway_token)
        })
        .catch(reject)
    })
  }
}())

