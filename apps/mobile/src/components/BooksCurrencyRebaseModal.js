import { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import {
    computeBaseAmounts,
    formatCurrency,
    formatExchangeRateValue,
    isValidExchangeRate,
    parseExchangeRateInput,
    sanitizeExchangeRateInput,
} from '@waraqah/shared';
import { Button } from './ui';
import { fontFamily, fontSize, lineHeight, radii, spacing, useTheme } from '../theme';

function quoteAmount(amount, currency) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return '';
    if (n !== 0 && Math.abs(n) < 0.01) {
        return `${formatExchangeRateValue(n)} ${currency}`;
    }
    return formatCurrency(n, currency);
}

export function BooksCurrencyRebaseModal({
    visible,
    fromCurrency,
    toCurrency,
    saving = false,
    mode = 'convert',
    initialRate = '',
    onCancel,
    onConfirm,
}) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [rate, setRate] = useState('');
    const correcting = mode === 'correct';

    useEffect(() => {
        if (!visible) return;
        setRate(initialRate ? sanitizeExchangeRateInput(String(initialRate)) : '');
    }, [visible, fromCurrency, toCurrency, initialRate, mode]);

    const parsed = parseExchangeRateInput(rate);
    const valid = isValidExchangeRate(parsed);
    const unchanged =
        correcting &&
        valid &&
        isValidExchangeRate(initialRate) &&
        parsed === Number(initialRate);
    const convertedOne = valid
        ? computeBaseAmounts({ total: 1, exchangeRate: parsed }).baseTotal
        : null;
    const convertedThousand = valid
        ? computeBaseAmounts({ total: 1000, exchangeRate: parsed }).baseTotal
        : null;
    const inverse = valid ? 1 / parsed : null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={saving ? undefined : onCancel}>
            <View style={styles.overlay}>
                <View style={styles.box}>
                    <View style={styles.iconWrap}>
                        <Text style={styles.iconText}>⇄</Text>
                    </View>
                    <Text style={styles.title}>
                        {correcting ? 'Correct conversion rate' : 'Convert your books'}
                    </Text>
                    <View style={styles.pair}>
                        <Text style={styles.pairCode}>{fromCurrency}</Text>
                        <Text style={styles.pairArrow}>→</Text>
                        <Text style={styles.pairCode}>{toCurrency}</Text>
                    </View>
                    <Text style={styles.message}>
                        {correcting
                            ? 'Enter the rate that should have been used. Only amounts from that conversion are restated; newer records stay as entered.'
                            : `Enter how many ${toCurrency} equal 1 ${fromCurrency}. Client invoices keep their original currency. Dashboard totals, expenses, payroll, and product prices convert at this rate.`}
                    </Text>
                    <Text style={styles.label}>1 {fromCurrency} equals</Text>
                    <View style={styles.inputWrap}>
                        <TextInput
                            value={rate}
                            onChangeText={(value) => setRate(sanitizeExchangeRateInput(value))}
                            placeholder="0.00"
                            placeholderTextColor={colors.slate400}
                            style={styles.input}
                            keyboardType="decimal-pad"
                            autoFocus
                            editable={!saving}
                        />
                        <Text style={styles.inputSuffix}>{toCurrency}</Text>
                    </View>
                    {valid ? (
                        <View style={styles.preview}>
                            <Text style={styles.previewLabel}>PREVIEW</Text>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewMuted}>{quoteAmount(1, fromCurrency)}</Text>
                                <Text style={styles.previewStrong}>{quoteAmount(convertedOne, toCurrency)}</Text>
                            </View>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewMuted}>{quoteAmount(1000, fromCurrency)}</Text>
                                <Text style={styles.previewStrong}>{quoteAmount(convertedThousand, toCurrency)}</Text>
                            </View>
                            {inverse != null ? (
                                <View style={[styles.previewRow, styles.previewInverse]}>
                                    <Text style={styles.previewMuted}>1 {toCurrency}</Text>
                                    <Text style={styles.previewMuted}>
                                        ≈ {formatExchangeRateValue(inverse)} {fromCurrency}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    ) : (
                        <Text style={styles.hint}>
                            Example: if 1 {fromCurrency} is worth 0.00067 {toCurrency}, enter 0.00067.
                        </Text>
                    )}
                    <Text style={styles.note}>
                        {correcting
                            ? 'Subscription billing stays in Nigerian Naira.'
                            : 'One rate applies to all existing amounts. Subscription billing stays in Nigerian Naira.'}
                    </Text>
                    <View style={styles.actions}>
                        <Button
                            title="Cancel"
                            variant="secondary"
                            onPress={onCancel}
                            style={styles.btn}
                            disabled={saving}
                        />
                        <Button
                            title={
                                saving
                                    ? correcting
                                        ? 'Updating…'
                                        : 'Converting…'
                                    : correcting
                                      ? 'Update rate'
                                      : `Convert to ${toCurrency}`
                            }
                            onPress={() => valid && !unchanged && onConfirm(parsed)}
                            style={styles.btn}
                            disabled={!valid || unchanged}
                            loading={saving}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function createStyles(colors) {
    return StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: colors.overlay,
            justifyContent: 'center',
            padding: spacing.xl,
        },
        box: {
            backgroundColor: colors.surface,
            borderRadius: radii.xl,
            padding: spacing.xl,
        },
        iconWrap: {
            width: 36,
            height: 36,
            borderRadius: radii.md,
            backgroundColor: colors.brandSubtle || colors.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.md,
        },
        iconText: {
            fontFamily: fontFamily.semibold,
            fontSize: fontSize.md,
            color: colors.brand || colors.foreground,
        },
        title: {
            fontFamily: fontFamily.semibold,
            fontSize: fontSize.lg,
            color: colors.foreground,
            marginBottom: spacing.md,
            letterSpacing: -0.3,
        },
        pair: {
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            backgroundColor: colors.surfaceMuted,
            borderRadius: radii.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            marginBottom: spacing.md,
        },
        pairCode: {
            fontFamily: fontFamily.semibold,
            fontSize: fontSize.xs,
            color: colors.foreground,
            letterSpacing: 0.3,
        },
        pairArrow: {
            fontFamily: fontFamily.regular,
            fontSize: fontSize.sm,
            color: colors.muted,
        },
        message: {
            fontFamily: fontFamily.regular,
            fontSize: fontSize.sm,
            color: colors.muted,
            marginBottom: spacing.lg,
            lineHeight: lineHeight.md,
        },
        label: {
            fontFamily: fontFamily.medium,
            fontSize: fontSize.sm,
            color: colors.foreground,
            marginBottom: spacing.sm,
        },
        inputWrap: {
            position: 'relative',
            marginBottom: spacing.md,
        },
        input: {
            minHeight: 48,
            paddingHorizontal: spacing.lg,
            paddingRight: 56,
            borderRadius: radii.md,
            backgroundColor: colors.surfaceMuted,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.md,
            color: colors.foreground,
        },
        inputSuffix: {
            position: 'absolute',
            right: spacing.lg,
            top: 0,
            bottom: 0,
            textAlignVertical: 'center',
            fontFamily: fontFamily.semibold,
            fontSize: fontSize.xs,
            color: colors.muted,
            lineHeight: 48,
        },
        preview: {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            backgroundColor: colors.surfaceMuted,
            borderRadius: radii.lg,
            padding: spacing.md,
            marginBottom: spacing.md,
            gap: 6,
        },
        previewLabel: {
            fontFamily: fontFamily.semibold,
            fontSize: 11,
            color: colors.muted,
            letterSpacing: 0.6,
            marginBottom: 2,
        },
        previewRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: spacing.md,
        },
        previewInverse: {
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
            paddingTop: spacing.sm,
            marginTop: 2,
        },
        previewMuted: {
            fontFamily: fontFamily.regular,
            fontSize: fontSize.sm,
            color: colors.muted,
        },
        previewStrong: {
            fontFamily: fontFamily.semibold,
            fontSize: fontSize.sm,
            color: colors.foreground,
            textAlign: 'right',
        },
        hint: {
            fontFamily: fontFamily.regular,
            fontSize: fontSize.xs,
            color: colors.muted,
            marginBottom: spacing.md,
            lineHeight: lineHeight.sm,
        },
        note: {
            fontFamily: fontFamily.regular,
            fontSize: fontSize.xs,
            color: colors.muted,
            marginBottom: spacing.xl,
            lineHeight: lineHeight.sm,
        },
        actions: {
            flexDirection: 'row',
            gap: spacing.sm,
        },
        btn: {
            flex: 1,
        },
    });
}
