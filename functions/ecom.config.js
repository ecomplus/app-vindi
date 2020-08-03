/* eslint-disable comma-dangle, no-multi-spaces, key-spacing */

/**
 * Edit base E-Com Plus Application object here.
 * Ref.: https://developers.e-com.plus/docs/api/#/store/applications/
 */

const app = {
  app_id: 120952,
  title: 'Vindi',
  slug: 'vindi',
  type: 'external',
  state: 'active',
  authentication: true,

  /**
   * Uncomment modules above to work with E-Com Plus Mods API on Storefront.
   * Ref.: https://developers.e-com.plus/modules-api/
   */
  modules: {
    /**
     * Triggered to calculate shipping options, must return values and deadlines.
     * Start editing `routes/ecom/modules/calculate-shipping.js`
     */
    // calculate_shipping:   { enabled: true },

    /**
     * Triggered to validate and apply discount value, must return discount and conditions.
     * Start editing `routes/ecom/modules/apply-discount.js`
     */
    // apply_discount:       { enabled: true },

    /**
     * Triggered when listing payments, must return available payment methods.
     * Start editing `routes/ecom/modules/list-payments.js`
     */
    list_payments:        { enabled: true },

    /**
     * Triggered when order is being closed, must create payment transaction and return info.
     * Start editing `routes/ecom/modules/create-transaction.js`
     */
    create_transaction:   { enabled: true },
  },

  /**
   * Uncomment only the resources/methods your app may need to consume through Store API.
   */
  auth_scope: {
    'stores/me': [
      'GET'            // Read store info
    ],
    procedures: [
      'POST'           // Create procedures to receive webhooks
    ],
    products: [
      // 'GET',           // Read products with public and private fields
      // 'POST',          // Create products
      // 'PATCH',         // Edit products
      // 'PUT',           // Overwrite products
      // 'DELETE',        // Delete products
    ],
    brands: [
      // 'GET',           // List/read brands with public and private fields
      // 'POST',          // Create brands
      // 'PATCH',         // Edit brands
      // 'PUT',           // Overwrite brands
      // 'DELETE',        // Delete brands
    ],
    categories: [
      // 'GET',           // List/read categories with public and private fields
      // 'POST',          // Create categories
      // 'PATCH',         // Edit categories
      // 'PUT',           // Overwrite categories
      // 'DELETE',        // Delete categories
    ],
    customers: [
      // 'GET',           // List/read customers
      // 'POST',          // Create customers
      // 'PATCH',         // Edit customers
      // 'PUT',           // Overwrite customers
      // 'DELETE',        // Delete customers
    ],
    orders: [
      'GET',           // List/read orders with public and private fields
      'POST',          // Create orders
      // 'PATCH',         // Edit orders
      // 'PUT',           // Overwrite orders
      // 'DELETE',        // Delete orders
    ],
    carts: [
      // 'GET',           // List all carts (no auth needed to read specific cart only)
      // 'POST',          // Create carts
      // 'PATCH',         // Edit carts
      // 'PUT',           // Overwrite carts
      // 'DELETE',        // Delete carts
    ],

    /**
     * Prefer using 'fulfillments' and 'payment_history' subresources to manipulate update order status.
     */
    'orders/fulfillments': [
      // 'GET',           // List/read order fulfillment and tracking events
      // 'POST',          // Create fulfillment event with new status
      // 'DELETE',        // Delete fulfillment event
    ],
    'orders/payments_history': [
      // 'GET',           // List/read order payments history events
      'POST',          // Create payments history entry with new status
      // 'DELETE',        // Delete payments history entry
    ],

    /**
     * Set above 'quantity' and 'price' subresources if you don't need access for full product document.
     * Stock and price management only.
     */
    'products/quantity': [
      // 'GET',           // Read product available quantity
      // 'PUT',           // Set product stock quantity
    ],
    'products/variations/quantity': [
      // 'GET',           // Read variaton available quantity
      // 'PUT',           // Set variation stock quantity
    ],
    'products/price': [
      // 'GET',           // Read product current sale price
      // 'PUT',           // Set product sale price
    ],
    'products/variations/price': [
      // 'GET',           // Read variation current sale price
      // 'PUT',           // Set variation sale price
    ],

    /**
     * You can also set any other valid resource/subresource combination.
     * Ref.: https://developers.e-com.plus/docs/api/#/store/
     */
  },

  admin_settings: {
    vindi_api_key: {
      schema: {
        type: 'string',
        maxLength: 255,
        title: 'Chave privada de API Vindi',
        description: 'Chave privada criada em https://app.vindi.com.br/admin/keys'
      },
      hide: true
    },
    vindi_public_key: {
      schema: {
        type: 'string',
        maxLength: 255,
        title: 'Chave pública Vindi',
        description: 'Chave pública criada em https://app.vindi.com.br/admin/keys'
      },
      hide: true
    },
    subscription_label: {
      type: 'string',
      maxLength: 50,
      title: 'Rótulo para assinatura',
      description: 'Exibido para os clientes junto ao nome da forma de pagamento'
    },
    enable_subscription: {
      schema: {
        type: 'boolean',
        default: false,
        title: 'Habilitar assinatura'
      },
      hide: false
    },
    disable_bill: {
      schema: {
        type: 'boolean',
        default: false,
        title: 'Desabilitar pagamento avulso'
      },
      hide: false
    },
    credit_card: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          disable: {
            type: 'boolean',
            title: 'Desabilitar cartão',
            description: 'Desabilitar pagamento com cartão via Vindi'
          },
          label: {
            type: 'string',
            maxLength: 50,
            title: 'Rótulo',
            description: 'Nome da forma de pagamento exibido para os clientes',
            default: 'Cartão de crédito'
          },
          text: {
            type: 'string',
            maxLength: 1000,
            title: 'Descrição',
            description: 'Texto auxiliar sobre a forma de pagamento, pode conter tags HTML'
          },
          icon: {
            type: 'string',
            maxLength: 255,
            format: 'uri',
            title: 'Ícone',
            description: 'Ícone customizado para a forma de pagamento, URL da imagem'
          }
        },
        title: 'Cartão de crédito',
        description: 'Configurações adicionais para cartão de crédito'
      },
      hide: false
    },
    banking_billet: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          disable: {
            type: 'boolean',
            title: 'Desabilitar boleto',
            description: 'Desabilitar pagamento com boleto bancário via Vindi'
          },
          label: {
            type: 'string',
            maxLength: 50,
            title: 'Rótulo',
            description: 'Nome da forma de pagamento exibido para os clientes',
            default: 'Boleto bancário'
          },
          text: {
            type: 'string',
            maxLength: 1000,
            title: 'Descrição',
            description: 'Texto auxiliar sobre a forma de pagamento, pode conter tags HTML'
          },
          icon: {
            type: 'string',
            maxLength: 255,
            format: 'uri',
            title: 'Ícone',
            description: 'Ícone customizado para a forma de pagamento, URL da imagem'
          }
        },
        title: 'Boleto bancário',
        description: 'Configurações adicionais para boleto bancário'
      },
      hide: false
    },
    discount: {
      schema: {
        type: 'object',
        required: [
          'value'
        ],
        additionalProperties: false,
        properties: {
          apply_at: {
            type: 'string',
            enum: [
              'total',
              'subtotal',
              'freight'
            ],
            default: 'subtotal',
            title: 'Aplicar desconto em',
            description: 'Em qual valor o desconto deverá ser aplicado no checkout'
          },
          min_amount: {
            type: 'integer',
            minimum: 1,
            maximum: 999999999,
            title: 'Pedido mínimo',
            description: 'Montante mínimo para aplicar o desconto'
          },
          type: {
            type: 'string',
            enum: [
              'percentage',
              'fixed'
            ],
            default: 'percentage',
            title: 'Tipo de desconto',
            description: 'Desconto com valor percentual ou fixo'
          },
          value: {
            type: 'number',
            minimum: -99999999,
            maximum: 99999999,
            title: 'Valor do desconto',
            description: 'Valor percentual ou fixo a ser descontado, dependendo to tipo configurado'
          },
          banking_billet: {
            type: 'boolean',
            default: true,
            title: 'Desconto no boleto',
            description: 'Habilitar desconto via boleto Vindi (padrão)'
          },
          credit_card: {
            type: 'boolean',
            title: 'Desconto no cartão',
            description: 'Habilitar desconto com cartão de crédito via Vindi'
          }
        },
        title: 'Desconto',
        description: 'Desconto a ser aplicado para pagamentos via Vindi'
      },
      hide: false
    },
    installments: {
      schema: {
        type: 'object',
        required: [
          'max_number'
        ],
        additionalProperties: false,
        properties: {
          min_installment: {
            type: 'number',
            minimum: 1,
            maximum: 99999999,
            default: 5,
            title: 'Parcela mínima',
            description: 'Valor mínimo da parcela'
          },
          max_number: {
            type: 'integer',
            minimum: 2,
            maximum: 999,
            title: 'Máximo de parcelas',
            description: 'Número máximo de parcelas'
          },
          monthly_interest: {
            type: 'number',
            minimum: 0,
            maximum: 9999,
            default: 0,
            title: 'Juros mensais',
            description: 'Taxa de juros mensal, zero para parcelamento sem juros'
          },
          max_interest_free: {
            type: 'integer',
            minimum: 2,
            maximum: 999,
            title: 'Parcelas sem juros',
            description: 'Mesclar parcelamento com e sem juros (ex.: até 3x sem juros e 12x com juros)'
          },
          interest_free_min_amount: {
            type: 'integer',
            minimum: 1,
            maximum: 999999999,
            title: 'Mínimo sem juros',
            description: 'Montante mínimo para parcelamento sem juros'
          }
        },
        title: 'Parcelamento',
        description: 'Opções de parcelamento no cartão via Vindi'
      },
      hide: false
    },
    vindi_plan: {
      schema: {
        type: 'object',
        properties: {
          interval: {
            type: 'string',
            enum: [
              'days',
              'months'
            ],
            default: 'months',
            title: 'Intervalo do plano'
          },
          interval_count: {
            type: 'number',
            minimum: 1,
            maximum: 99999,
            default: 1,
            title: 'Número de intervalos',
            description: 'Número de intervalos (meses ou dias) dentro de um período'
          },
          billing_cycles: {
            type: 'integer',
            minimum: 1,
            maximum: 52,
            title: 'Máximo de períodos',
            description: 'Número máximo de períodos em uma assinatura, nulo significa duração indefinida'
          }
        },
        title: 'Plano',
        description: 'Opçãos de parcelamento no cartão via Vindi'
      },
      hide: false
    }
  }
}

/**
 * List of Procedures to be created on each store after app installation.
 * Ref.: https://developers.e-com.plus/docs/api/#/store/procedures/
 */

const procedures = []

/**
 * Uncomment and edit code above to configure `triggers` and receive respective `webhooks`:

const { baseUri } = require('./__env')

procedures.push({
  title: app.title,

  triggers: [
    // Receive notifications when new order is created:
    {
      resource: 'orders',
      action: 'create',
    },

    // Receive notifications when order financial/fulfillment status changes:
    {
      resource: 'orders',
      field: 'financial_status',
    },
    {
      resource: 'orders',
      field: 'fulfillment_status',
    },

    // Receive notifications when products/variations stock quantity changes:
    {
      resource: 'products',
      field: 'quantity',
    },
    {
      resource: 'products',
      subresource: 'variations',
      field: 'quantity'
    },

    // Receive notifications when cart is edited:
    {
      resource: 'carts',
      action: 'change',
    },

    // Receive notifications when customer is deleted:
    {
      resource: 'customers',
      action: 'delete',
    },

    // Feel free to create custom combinations with any Store API resource, subresource, action and field.
  ],

  webhooks: [
    {
      api: {
        external_api: {
          uri: `${baseUri}/ecom/webhook`
        }
      },
      method: 'POST'
    }
  ]
})

 * You may also edit `routes/ecom/webhook.js` to treat notifications properly.
 */

exports.app = app

exports.procedures = procedures
