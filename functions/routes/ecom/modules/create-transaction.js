const addInstallments = require('../../../lib/payments/add-installments')
const parseStatus = require('../../../lib/payments/parse-status')
const createVindiAxios = require('../../../lib/vindi/create-axios')

exports.post = ({ appSdk, admin }, req, res) => {
  // https://apx-mods.e-com.plus/api/v1/create_transaction/schema.json?store_id=100
  const { params, application } = req.body
  const { storeId } = req
  const config = Object.assign({}, application.data, application.hidden_data)
  const axiosVindi = createVindiAxios(config.vindi_api_key)

  const orderId = params.order_id
  const { amount, buyer, to, items } = params
  console.log('> Transaction #', storeId, orderId)

  // https://apx-mods.e-com.plus/api/v1/create_transaction/response_schema.json?store_id=100
  const transaction = {
    amount: amount.total
  }

  // must always create Vindi customer before
  const vindiMetadata = {
    order_number: params.order_number,
    store_id: storeId,
    order_id: orderId
  }
  const vindiCustomer = {
    name: buyer.fullname,
    email: buyer.email,
    registry_code: buyer.doc_number,
    code: `${buyer.customer_id}:${Date.now()}`,
    phones: [{
      phone_type: !buyer.phone.type || buyer.phone.type === 'personal' ? 'mobile' : 'landline',
      number: `${(buyer.phone.country_code || '55')}${buyer.phone.number}`
    }],
    notes: `E-Com Plus => Pedido #${params.order_number} em ${params.domain}`,
    metadata: vindiMetadata
  }
  const parseAddress = to => ({
    street: to.street,
    number: String(to.number) || 'S/N',
    additional_details: to.complement,
    zipcode: to.zip,
    neighborhood: to.borough,
    city: to.city,
    state: to.province_code || to.province,
    country: to.country_code || 'BR'
  })
  if (to && to.street) {
    vindiCustomer.address = parseAddress(to)
  } else if (params.billing_address) {
    vindiCustomer.address = parseAddress(params.billing_address)
  }
  let vindiBill = null

  axiosVindi({
    url: '/customers',
    method: 'post',
    timeout: 15000,
    data: vindiCustomer
  })
    .then(({ data }) => {
      console.log(data)
      if (params.payment_method.code === 'credit_card') {
        let installmentsNumber = params.installments_number
        let finalAmount = amount.total
        if (installmentsNumber > 1) {
          if (config.installments) {
            // list all installment options
            const { gateway } = addInstallments(amount, config.installments)
            const installmentOption = gateway.installment_options &&
              gateway.installment_options.find(({ number }) => number === installmentsNumber)
            if (installmentOption) {
              transaction.installments = installmentOption
              finalAmount = transaction.installments.total = installmentOption.number * installmentOption.value
            } else {
              installmentsNumber = 1
            }
          }
        }

        vindiBill = {
          payment_method_code: 'credit_card',
          amount: Math.floor(finalAmount * 100),
          installments: installmentsNumber,
          card_hash: params.credit_card && params.credit_card.hash
        }
      } else {
        // banking billet
        vindiBill = {
          payment_method_code: 'bank_slip',
          amount: Math.floor(amount.total * 100)
        }
      }

      vindiBill.customer_id = data.id
      vindiBill.code = params.order_number
      vindiBill.metadata = vindiMetadata
      vindiBill.payment_profile = {
        payment_method_code: vindiBill.payment_method_code
      }
      if (params.credit_card && params.credit_card.hash) {
        vindiBill.payment_profile.allow_as_fallback = true
        vindiBill.payment_profile.gateway_token = params.credit_card.hash
      }
      if (params.payer && params.payer.doc_number) {
        vindiBill.payment_profile.registry_code = params.payer.doc_number
      }

      if (params.type === 'recurrence') {
        // async handle plan subscription
        // must register all products and a plan on Vindi
        // check products metadata to prevent duplication
        return {
          data: {
            id: 0,
            charges: [{
              id: 0,
              status: 'pending'
            }]
          }
        }
      }

      vindiBill.bill_items = []
      items.forEach(item => {
        vindiBill.bill_items.push({
          product_code: item.sku || item.variation_id || item.product_id,
          amount: Math.round((item.final_price || item.price) * item.quantity * 100) / 100,
          description: item.name || item.sku,
          quantity: item.quantity
        })
      })

      // crate Vindi single bill
      return axiosVindi({
        url: '/bills',
        method: 'post',
        data: vindiBill
      })
    })

    .then(({ data }) => {
      const vindiCharge = data.charges[0]
      if (data.charges.length && vindiCharge.amount) {
        transaction.amount = vindiCharge.amount
      }
      transaction.intermediator = {
        buyer_id: String(vindiBill.customer_id),
        transaction_code: String(vindiCharge.id),
        transaction_reference: String(data.id)
      }

      if (vindiCharge.payment_method) {
        transaction.intermediator.payment_method = {
          code: vindiCharge.payment_method.code || params.payment_method.code
        }
        if (vindiCharge.payment_method.name) {
          transaction.intermediator.payment_method.name = vindiCharge.payment_method.name
        }
      }
      if (vindiCharge.print_url) {
        transaction.payment_link = vindiCharge.print_url
        if (params.payment_method.code === 'banking_billet') {
          transaction.banking_billet = {
            link: vindiCharge.print_url
          }
        }
      }

      const vindiTransaction = vindiCharge.last_transaction
      if (vindiTransaction) {
        transaction.intermediator.transaction_id = vindiTransaction.id
        if (vindiTransaction.payment_profile && vindiTransaction.payment_profile.token) {
          transaction.credit_card = {
            token: vindiTransaction.payment_profile.token
          }
          if (vindiTransaction.payment_profile.card_number_last_four) {
            transaction.credit_card.last_digits = vindiTransaction.payment_profile.card_number_last_four
          }
          if (vindiTransaction.payment_profile.payment_company) {
            transaction.credit_card.company = vindiTransaction.payment_profile.payment_company.name
          }
        }
      }

      transaction.status = {
        updated_at: data.updated_at || data.created_at || new Date().toISOString(),
        current: parseStatus(vindiCharge.status)
      }
      res.send({ transaction })

      // save Vindi charge do local Firestore
      admin.firestore().collection('charges').doc(vindiCharge.id)
        .set({
          ...vindiMetadata,
          vindi_bill_id: data.id,
          created_at: require('firebase-admin').firestore.Timestamp.fromDate(new Date())
        }, { merge: true })
        .catch(console.error)
    })

    .catch(error => {
      // try to debug request error
      const errCode = 'VINDI_BILL_ERR'
      let { message } = error
      const err = new Error(`${errCode} #${storeId} - ${orderId} => ${message}`)
      if (error.response) {
        const { status, data } = error.response
        if (status !== 401 && status !== 403) {
          err.url = error.config && error.config.url
          err.customer = JSON.stringify(vindiCustomer)
          err.bill = JSON.stringify(vindiBill)
          err.status = status
          if (typeof data === 'object' && data) {
            err.response = JSON.stringify(data)
          } else {
            err.response = data
          }
        } else if (data && Array.isArray(data.errors) && data.errors[0] && data.errors[0].message) {
          message = data.errors[0].message
        }
      }
      console.error(err)
      res.status(409)
      res.send({
        error: errCode,
        message
      })
    })
}
