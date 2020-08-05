const getAppData = require('../../lib/store-api/get-app-data')
const parseStatus = require('../../lib/payments/parse-status')
const createVindiAxios = require('../../lib/vindi/create-axios')

exports.post = ({ appSdk, admin }, req, res) => {
  // https://atendimento.vindi.com.br/hc/pt-br/articles/203305800-O-que-s%C3%A3o-e-como-funcionam-os-Webhooks-
  const vindiEvent = req.body && req.body.event
  if (vindiEvent && vindiEvent.data && vindiEvent.type) {
    const data = vindiEvent.data.id ? vindiEvent.data
      : (vindiEvent.data.bill || vindiEvent.data.charge)
    if (data.id) {
      let isVindiBill
      console.log('> Vindi Hook #', data.id)

      new Promise((resolve, reject) => {
        if (vindiEvent.type.startsWith('charge_')) {
          // get metadata from local database
          return admin.firestore().collection('charges').doc(String(data.id))
            .get().then(documentSnapshot => documentSnapshot && documentSnapshot.data())
        }
        switch (vindiEvent.type) {
          case 'bill_paid':
          case 'bill_canceled':
            isVindiBill = true
            // metadata included on bill payload
            return data.metadata
        }
        return false
      })

        .then(vindiMetadata => {
          if (vindiMetadata) {
            const storeId = vindiMetadata.store_id
            const orderId = vindiMetadata.order_id
            if (storeId && orderId) {
              console.log('> Webhook for #', storeId, orderId)
              // read configured E-Com Plus app data
              return getAppData({ appSdk, storeId })
                .then(config => {
                  // get secure Vindi bill payload
                  return createVindiAxios(config.vindi_api_key, config.vindi_sandbox)
                    .get('/bills/' + (isVindiBill ? data.id : data.bill.id))
                })
                .then(({ data }) => ({
                  storeId,
                  orderId,
                  vindiBill: data && data.bill ? data.bill : data
                }))
            }
          }
          return {}
        })

        .then(({ storeId, orderId, vindiBill }) => {
          if (vindiBill && vindiBill.charges) {
            const vindiCharge = vindiBill.charges[0]
            if (vindiCharge) {
              // add new transaction status to payment history
              const resource = `orders/${orderId}/payments_history.json`
              const method = 'POST'
              const body = {
                date_time: new Date().toISOString(),
                status: parseStatus(vindiCharge.status),
                notification_code: vindiEvent.type + ';' + vindiEvent.created_at,
                flags: ['vindi']
              }
              return appSdk.apiRequest(storeId, resource, method, body)
            }
          }
          return null
        })

        .then(() => {
          res.sendStatus(200)
        })

        .catch(err => {
          console.error(err)
          res.sendStatus(500)
        })
    } else {
      console.log('> Vindi Hook unexpected data:', JSON.stringify(data))
    }
  }

  res.sendStatus(410)
}
