import { Text, StyleSheet, View } from 'react-native';
import { ClipboardList, FileText, Package, Users } from 'lucide-react-native';
import { BottomSheet, ListRow } from './ui';
import { colors, fontFamily, fontSize, spacing } from '../theme';

const OPTIONS = [
    {
        id: 'invoice',
        label: 'Invoice',
        subtitle: 'Bill a client for work done',
        icon: FileText,
        iconColor: colors.brand,
    },
    {
        id: 'quotation',
        label: 'Quotation',
        subtitle: 'Send a price estimate',
        icon: ClipboardList,
        iconColor: '#0284C7',
    },
    {
        id: 'client',
        label: 'Client',
        subtitle: 'Add a new client contact',
        icon: Users,
        iconColor: colors.violet600,
    },
    {
        id: 'product',
        label: 'Product',
        subtitle: 'Save a product or service',
        icon: Package,
        iconColor: colors.amber600,
    },
];

export function CreateActionSheet({ sheetRef, onSelect }) {
    return (
        <BottomSheet ref={sheetRef} snapPoints={['48%']}>
            <Text style={styles.title}>Create</Text>
            <Text style={styles.subtitle}>What would you like to add?</Text>
            <View>
                {OPTIONS.map((option, index) => {
                    const Icon = option.icon;
                    return (
                        <ListRow
                            key={option.id}
                            title={option.label}
                            subtitle={option.subtitle}
                            left={<Icon size={20} color={option.iconColor} strokeWidth={2} />}
                            onPress={() => onSelect?.(option.id)}
                            last={index === OPTIONS.length - 1}
                            dense
                        />
                    );
                })}
            </View>
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    title: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.lg,
        color: colors.foreground,
        paddingHorizontal: spacing.sm,
    },
    subtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.muted,
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.sm,
    },
});
