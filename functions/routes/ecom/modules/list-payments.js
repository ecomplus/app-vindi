const { baseUri } = require('../../../__env')
const addInstallments = require('../../../lib/payments/add-installments')

exports.post = ({ appSdk }, req, res) => {
  // https://apx-mods.e-com.plus/api/v1/list_payments/schema.json?store_id=100
  const { params, application } = req.body
  const amount = params.amount || {}

  const config = Object.assign({}, application.data, application.hidden_data)
  if (!config.vindi_api_key || !config.vindi_public_key) {
    return res.status(409).send({
      error: 'NO_VINDI_KEYS',
      message: 'Chave de API privade e/ou publica indefinida (lojista deve configurar o aplicativo)'
    })
  }

  // https://apx-mods.e-com.plus/api/v1/list_payments/response_schema.json?store_id=100
  const response = {
    payment_gateways: []
  }

  const { discount } = config
  if (discount && discount.value > 0) {
    if (discount.apply_at !== 'freight') {
      // default discount option
      const { value } = discount
      response.discount_option = {
        label: config.discount_option_label,
        value
      }
      // specify the discount type and min amount is optional
      ;['type', 'min_amount'].forEach(prop => {
        if (discount[prop]) {
          response.discount_option[prop] = discount[prop]
        }
      })
    }

    if (amount.total) {
      // check amount value to apply discount
      if (amount.total < discount.min_amount) {
        discount.value = 0
      } else {
        delete discount.min_amount

        // fix local amount object
        const maxDiscount = amount[discount.apply_at || 'subtotal']
        let discountValue
        if (discount.type === 'percentage') {
          discountValue = maxDiscount * discount.value / 100
        } else {
          discountValue = discount.value
          if (discountValue > maxDiscount) {
            discountValue = maxDiscount
          }
        }
        if (discountValue > 0) {
          amount.discount = (amount.discount || 0) + discountValue
          amount.total -= discountValue
          if (amount.total < 0) {
            amount.total = 0
          }
        }
      }
    }
  }

  // common payment methods data
  const intermediator = {
    name: 'Vindi',
    link: 'https://app.vindi.com.br/',
    code: 'vindi_app'
  }
  const paymentTypes = []
  if (!config.disable_subscription) {
    paymentTypes.push('recurrence')
  }
  if (!config.disable_bill) {
    paymentTypes.push('payment')
  }

  // setup payment gateway objects
  ;['credit_card', 'banking_billet'].forEach(paymentMethod => {
    paymentTypes.forEach(type => {
      const methodConfig = config[paymentMethod] || {}
      if (!methodConfig.disable) {
        const isCreditCard = paymentMethod === 'credit_card'
        let label = methodConfig.label || (isCreditCard ? 'Cartão de crédito' : 'Boleto bancário')
        if (type === 'recurrence' && config.subscription_label) {
          label = config.subscription_label + label
        }
        const gateway = {
          label,
          icon: methodConfig.icon,
          text: methodConfig.text,
          payment_method: {
            code: paymentMethod,
            name: `${label} - ${intermediator.name}`
          },
          type,
          intermediator
        }

        if (isCreditCard) {
          gateway.js_client = {
            script_uri: `${baseUri}/vindi-hash.min.js`,
            onload_expression: `window._vindiKey="${config.vindi_public_key}";`,
            cc_hash: {
              function: '_vindiHash',
              is_promise: true
            }
          }
          const { installments } = config
          if (installments) {
            // list all installment options and default one
            addInstallments(amount, installments, gateway, response)
          }
        }

        if (methodConfig.discount) {
          gateway.discount = methodConfig.discount
        } else if (
          discount &&
          (discount[paymentMethod] === true || (!isCreditCard && discount[paymentMethod] !== false))
        ) {
          gateway.discount = discount
          if (response.discount_option && !response.discount_option.label) {
            response.discount_option.label = label
          }
        }

        response.payment_gateways.push(gateway)
      }
    })
  })

  res.send(response)
}
