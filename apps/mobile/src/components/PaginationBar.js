import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, fontFamily, fontSize, spacing } from '../theme';

/**
 * Prev / page indicator / Next for offset-paginated mobile lists.
 * Hidden when there is at most one page.
 */
export function PaginationBar({
    page = 1,
    totalPages = 0,
    total = 0,
    onPageChange,
    disabled = false,
    style,
}) {
    if (!totalPages || totalPages <= 1) return null;

    const canPrev = page > 1 && !disabled;
    const canNext = page < totalPages && !disabled;

    return (
        <View style={[styles.wrap, style]} accessibilityRole="adjustable" accessibilityLabel="Pagination">
            <Text style={styles.meta}>
                Page {page} of {totalPages}
                {total > 0 ? ` · ${total} total` : ''}
            </Text>
            <View style={styles.row}>
                <Pressable
                    style={[styles.btn, !canPrev && styles.btnDisabled]}
                    disabled={!canPrev}
                    onPress={() => onPageChange?.(page - 1)}
                    accessibilityRole="button"
                    accessibilityLabel="Previous page"
                >
                    <ChevronLeft size={16} color={canPrev ? colors.foreground : colors.muted} />
                    <Text style={[styles.btnText, !canPrev && styles.btnTextDisabled]}>Prev</Text>
                </Pressable>
                <Pressable
                    style={[styles.btn, !canNext && styles.btnDisabled]}
                    disabled={!canNext}
                    onPress={() => onPageChange?.(page + 1)}
                    accessibilityRole="button"
                    accessibilityLabel="Next page"
                >
                    <Text style={[styles.btnText, !canNext && styles.btnTextDisabled]}>Next</Text>
                    <ChevronRight size={16} color={canNext ? colors.foreground : colors.muted} />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        gap: spacing.sm,
    },
    meta: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.muted,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border || '#e4e4e7',
        backgroundColor: colors.surface || '#fff',
    },
    btnDisabled: {
        opacity: 0.45,
    },
    btnText: {
        fontFamily: fontFamily.medium || fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.foreground,
    },
    btnTextDisabled: {
        color: colors.muted,
    },
});

export default PaginationBar;
