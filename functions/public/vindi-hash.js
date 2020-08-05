;(function () {
  window._vindiHash = function (card) {
    return new Promise(function (resolve, reject) {
      // https://atendimento.vindi.com.br/hc/pt-br/articles/115009609107-Como-eu-cadastro-perfis-de-pagamento-
      window.axios({
        method: 'post',
        url: 'https://sandbox-app.vindi.com.br/api/v1/public/payment_profiles',
        headers: {
          Authorization: 'Basic ' + window.btoa(window._vindiKey + ':')
        },
        data: {
          holder_name: card.name,
          card_expiration: card.month.padStart(2, '0') + '/' + card.year.toString().padStart(4, '20'),
          card_number: card.number,
          card_cvv: card.cvc,
          payment_method_code: 'credit_card',
          payment_company_code: card.brand
        },
        responseType: 'json'
      })
        .then(function (response) {
          resolve(response.data.payment_profile.gateway_token)
        })
        .catch(reject)
    })
  }
}())
