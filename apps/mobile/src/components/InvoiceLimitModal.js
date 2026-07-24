import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Crown } from 'lucide-react-native';
import { FREE_MONTHLY_INVOICE_LIMIT } from '@waraqah/shared';
import { BottomSheet } from './ui/BottomSheet';
import { Button } from './ui/Button';
import { colors, fontFamily, fontSize, spacing } from '../theme';

export const InvoiceLimitModal = forwardRef(function InvoiceLimitModal(
    { usage, onUpgrade, onClose },
    ref
) {
    const sheetRef = useRef(null);

    useImperativeHandle(ref, () => ({
        open: () => sheetRef.current?.snapToIndex(0),
        close: () => sheetRef.current?.close(),
    }));

    const limit = usage?.limit ?? FREE_MONTHLY_INVOICE_LIMIT;
    const used = usage?.used ?? limit;

    return (
        <BottomSheet ref={sheetRef} snapPoints={['42%']} onClose={onClose} enablePanDownToClose>
            <View style={styles.iconWrap}>
                <Crown size={28} color={colors.amber600} />
            </View>
            <Text style={styles.title}>Monthly document limit reached</Text>
            <Text style={styles.message}>
                You have used all {limit} free invoices and quotations for this month ({used}/{limit}).
                Upgrade to Premium for unlimited documents, custom logos, and more.
            </Text>
            <Button title="Upgrade to Premium" onPress={onUpgrade} style={{ marginBottom: spacing.sm }} />
            <Button title="Not now" variant="secondary" onPress={() => sheetRef.current?.close()} />
        </BottomSheet>
    );
});

const styles = StyleSheet.create({
    iconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.amber50,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.lg,
        fontWeight: '700',
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    message: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.muted,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: spacing.xl,
    },
});
