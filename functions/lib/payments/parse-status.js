module.exports = vindiChargeStatus => {
  switch (vindiChargeStatus) {
    case 'pending':
    case 'paid':
      return vindiChargeStatus
    case 'canceled':
      return 'voided'
    case 'processing':
      return 'under_analysis'
    case 'fraud_review':
      return 'authorized'
  }
  return 'unknown'
}
