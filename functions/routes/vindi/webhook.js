const getAppData = require('../../lib/store-api/get-app-data')
const parseStatus = require('../../lib/payments/parse-status')
const createVindiAxios = require('../../lib/vindi/create-axios')

exports.post = ({ appSdk, admin }, req, res) => {
  // https://atendimento.vindi.com.br/hc/pt-br/articles/203305800-O-que-s%C3%A3o-e-como-funcionam-os-Webhooks-
  const vindiEvent = req.body && req.body.event
  if (vindiEvent && vindiEvent.data && vindiEvent.type) {
    const data = vindiEvent.data.id ? vindiEvent.data
      : (vindiEvent.data.bill || vindiEvent.data.charge)
    if (data && data.id) {
      let isVindiBill
      console.log('> Vindi Hook', vindiEvent.type, data.id)

      return new Promise((resolve, reject) => {
        if (vindiEvent.type.startsWith('charge_')) {
          // console.log('> Searching charge on local database')
          // get metadata from local database
          admin.firestore().collection('charges').doc(String(data.id))
            .get().then(documentSnapshot => {
              if (documentSnapshot && documentSnapshot.data) {
                resolve(documentSnapshot.data())
              } else {
                // console.log('> Skipping Vindi charge not found')
                resolve(false)
              }
            }).catch(reject)
        } else {
          switch (vindiEvent.type) {
            case 'bill_paid':
            case 'bill_canceled':
              isVindiBill = true
              // metadata included on bill payload
              resolve(data.metadata)
          }
          resolve(false)
        }
      })

        .then(vindiMetadata => {
          // console.log('> Vindi metadata', JSON.stringify(vindiMetadata))
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
              let status
              switch (vindiEvent.type) {
                case 'charge_rejected':
                  status = 'unauthorized'
                  break
                case 'charge_refunded':
                  status = 'refunded'
                  break
                default:
                  status = parseStatus(vindiCharge.status)
              }
              const body = {
                date_time: new Date().toISOString(),
                status,
                notification_code: vindiEvent.type + ';' + vindiEvent.created_at,
                flags: ['vindi']
              }
              return appSdk.apiRequest(storeId, resource, method, body)
            }
          }
          return null
        })

        .then(apiResponse => {
          res.sendStatus(apiResponse === null
            // prevent flood with invalid bill events
            ? isVindiBill ? 204 : 404
            // all done successfully
            : 201)
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
