import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { BottomSheet, ListRow, SearchBar } from './ui';
import { fontFamily, fontSize, radii, spacing, useTheme } from '../theme';

export function SearchablePickerField({
    label,
    value,
    options = [],
    placeholder = 'Choose…',
    helperText,
    onPress,
}) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const selected = options.find((option) => option.value === value);

    return (
        <>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <Pressable
                onPress={onPress}
                style={styles.field}
                accessibilityRole="button"
                accessibilityLabel={label || placeholder}
            >
                <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
                    {selected?.label || placeholder}
                </Text>
                <ChevronDown size={18} color={colors.slate400} />
            </Pressable>
            {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
        </>
    );
}

export function SearchablePickerSheet({
    sheetRef,
    title,
    options = [],
    onChange,
    searchPlaceholder = 'Search…',
}) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return options;
        return options.filter((option) => {
            const haystack = `${option.searchText || ''} ${option.label || ''} ${option.value || ''}`.toLowerCase();
            return haystack.includes(needle);
        });
    }, [options, query]);

    return (
        <BottomSheet
            ref={sheetRef}
            snapPoints={['70%']}
            onClose={() => setQuery('')}
        >
            <Text style={styles.sheetTitle}>{title}</Text>
            <SearchBar
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                style={styles.search}
            />
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
                {filtered.length === 0 ? (
                    <Text style={styles.empty}>No matches</Text>
                ) : (
                    filtered.map((option, index) => (
                        <ListRow
                            key={option.value}
                            title={option.label}
                            onPress={() => {
                                onChange(option.value);
                                setQuery('');
                                sheetRef?.current?.close?.();
                            }}
                            last={index === filtered.length - 1}
                            dense
                        />
                    ))
                )}
            </ScrollView>
        </BottomSheet>
    );
}

function createStyles(colors) {
    return StyleSheet.create({
        label: {
            fontFamily: fontFamily.medium,
            fontSize: fontSize.sm,
            color: colors.foregroundMuted,
            marginBottom: spacing.sm,
            marginTop: spacing.md,
        },
        field: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.sm,
            minHeight: 44,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            borderRadius: radii.md,
            paddingHorizontal: spacing.lg,
            backgroundColor: colors.surface,
            marginBottom: spacing.sm,
        },
        value: {
            flex: 1,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.md,
            color: colors.foreground,
        },
        placeholder: {
            color: colors.slate400,
        },
        helper: {
            fontFamily: fontFamily.regular,
            fontSize: fontSize.xs,
            color: colors.foregroundMuted,
            marginBottom: spacing.lg,
        },
        sheetTitle: {
            fontFamily: fontFamily.semibold,
            fontSize: fontSize.lg,
            color: colors.foreground,
            marginBottom: spacing.md,
            paddingHorizontal: spacing.lg,
        },
        search: {
            marginHorizontal: spacing.lg,
            marginBottom: spacing.md,
        },
        empty: {
            padding: spacing.xl,
            textAlign: 'center',
            color: colors.foregroundMuted,
            fontFamily: fontFamily.regular,
        },
    });
}
