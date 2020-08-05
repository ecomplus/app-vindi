const axios = require('axios')

module.exports = (vindiApiKey, isSandbox) => {
  // https://vindi.github.io/api-docs/dist/
  return axios.create({
    baseURL: `https://${(isSandbox ? 'sandbox-' : '')}app.vindi.com.br/api/v1/`,
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${vindiApiKey}:`).toString('base64')
    }
  })
}
