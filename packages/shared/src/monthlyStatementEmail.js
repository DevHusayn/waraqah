export function isAutoMonthlyStatementsEnabled(businessInfo) {
    return businessInfo?.autoEmailMonthlyStatements !== false;
}

export function formatStatementPeriodKey(year, month) {
    return `${year}-${String(month).padStart(2, '0')}`;
}
