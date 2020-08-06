# Vindi

Pagamento via cartão de crédito ou boleto bancário [Vindi](https://vindi.com.br/):

- Integração direta com o Gateway da Vindi;
- Suporta integração com diversos adiquirentes;
- Atualização automática de status da transação;
- Parcelamento com e/ou sem juros;
- Desconto fixo ou percentual por forma de pagamento;
- Personalizações opcionais para o checkout;

## Configuração

Após instalar este aplicativo crie um Webhook no seu [painel da Vindi](https://sandbox-app.vindi.com.br/admin/hooks) para o URL `https://us-central1-ecom-vindi.cloudfunctions.net/app/vindi/webhook` com os eventos _Cobrança cancelada_, _Cobrança emitida_, _Cobrança estornada_, _Cobrança rejeitada_, _Fatura cancelada_, _Fatura emitida_, _Fatura paga_.
