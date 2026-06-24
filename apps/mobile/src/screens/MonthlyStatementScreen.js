import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
    buildMonthlyStatement,
    parseStatementMonth,
    getDefaultStatementMonth,
    formatCurrency,
    isPremiumUser,
} from '@waraqah/shared';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { Button, Card, Input, Label, PageHeader } from '../components/ui';
import { colors, spacing } from '../theme';

export function MonthlyStatementScreen({ navigation }) {
    const { invoices, clients } = useInvoice();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();
    const [monthValue, setMonthValue] = useState(getDefaultStatementMonth());
    const [pdfLoading, setPdfLoading] = useState(false);

    const premium = isPremiumUser(businessInfo);
    const { year, month } = parseStatementMonth(monthValue);

    const statement = useMemo(
        () => buildMonthlyStatement({ invoices, clients, year, month }),
        [invoices, clients, year, month]
    );

    const handlePdf = async () => {
        if (!premium) {
            navigation.navigate('Upgrade');
            return;
        }
        setPdfLoading(true);
        try {
            const { shareStatementPdf } = await import('../pdf/sharePdf');
            await shareStatementPdf(statement, businessInfo);
            showToast('Statement ready to share', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setPdfLoading(false);
        }
    };

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <PageHeader title="Monthly statement" subtitle="Billing summary by client for the selected month" />

            <Card style={styles.block}>
                <Label>Month (YYYY-MM)</Label>
                <Input value={monthValue} onChangeText={setMonthValue} placeholder="2026-06" autoCapitalize="none" />
                <Text style={styles.period}>{statement.periodLabel}</Text>
            </Card>

            {!premium ? (
                <Text style={styles.hint}>Monthly statements are a Premium feature.</Text>
            ) : null}

            <Card style={styles.block}>
                <Text style={styles.section}>Totals</Text>
                <Row label="Paid" value={formatCurrency(statement.totals.paid)} />
                <Row label="Pending" value={formatCurrency(statement.totals.pending)} />
                <Row label="Overdue" value={formatCurrency(statement.totals.overdue)} />
                <Row label="Total billed" value={formatCurrency(statement.totals.total)} bold />
            </Card>

            {statement.rows.map((row) => (
                <Card key={row.clientId} style={styles.block}>
                    <Text style={styles.clientName}>{row.clientName}</Text>
                    <Row label="Paid" value={formatCurrency(row.paid)} />
                    <Row label="Pending" value={formatCurrency(row.pending)} />
                    <Row label="Total" value={formatCurrency(row.total)} bold />
                </Card>
            ))}

            <Button title="Share PDF statement" onPress={handlePdf} loading={pdfLoading} disabled={!statement.hasData} />
        </ScrollView>
    );
}

function Row({ label, value, bold }) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={[styles.rowValue, bold && { fontWeight: '700' }]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    block: { marginBottom: 12 },
    period: { marginTop: 8, fontWeight: '600', color: colors.brand },
    hint: { color: colors.amber600, marginBottom: 12 },
    section: { fontWeight: '700', marginBottom: 8 },
    clientName: { fontWeight: '700', marginBottom: 6 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    rowLabel: { color: colors.slate500 },
    rowValue: { color: colors.slate900 },
});
