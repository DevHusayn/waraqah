import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { filterVendorsForSuggestion } from '@waraqah/shared';
import { Input, FieldError } from './ui';
import { fontSize, radii, spacing, useTheme } from '../theme';

function useDebouncedValue(value, delayMs = 200) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debounced;
}

export function VendorNameCombobox({
    value,
    onChangeText,
    onSelectVendor,
    vendors = [],
    error = false,
    placeholder = 'Who was paid?',
    fieldError,
}) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [focused, setFocused] = useState(false);
    const debouncedQuery = useDebouncedValue(value, 200);

    const suggestions = useMemo(() => {
        if (!focused) return [];
        const query = String(debouncedQuery || '').trim();
        if (query.length < 1) return [];
        return filterVendorsForSuggestion(vendors, query, { limit: 8 });
    }, [vendors, debouncedQuery, focused]);

    const showList = focused && String(value || '').trim().length >= 1;
    const showEmptyHint = showList && suggestions.length === 0;

    return (
        <View style={styles.wrap}>
            <Input
                value={value}
                onChangeText={onChangeText}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                    setTimeout(() => setFocused(false), 150);
                }}
                error={error}
                placeholder={placeholder}
                autoCapitalize="words"
                autoCorrect={false}
            />
            <FieldError message={fieldError} />

            {showList ? (
                <View style={styles.list}>
                    <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                        {suggestions.map((name, index) => {
                            const isLast = index === suggestions.length - 1 && !showEmptyHint;
                            return (
                                <Pressable
                                    key={`${name}-${index}`}
                                    onPress={() => onSelectVendor(name)}
                                    style={({ pressed }) => [
                                        styles.option,
                                        !isLast && styles.optionBorder,
                                        pressed && styles.optionPressed,
                                    ]}
                                >
                                    <Text style={styles.optionTitle}>{name}</Text>
                                </Pressable>
                            );
                        })}
                        {showEmptyHint ? (
                            <View style={styles.emptyHint}>
                                <Text style={styles.emptyHintText}>
                                    New name — saved with this expense
                                </Text>
                            </View>
                        ) : null}
                    </ScrollView>
                </View>
            ) : null}
        </View>
    );
}

function createStyles(colors) {
    return StyleSheet.create({
        wrap: {
            position: 'relative',
            zIndex: 2,
        },
        list: {
            marginTop: spacing.xs,
            maxHeight: 200,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            borderRadius: radii.md,
            backgroundColor: colors.surface,
            overflow: 'hidden',
        },
        option: {
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
        },
        optionBorder: {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
        },
        optionPressed: {
            backgroundColor: colors.surfaceMuted,
        },
        optionTitle: {
            fontSize: fontSize.md,
            color: colors.foreground,
            fontWeight: '600',
        },
        emptyHint: {
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
        },
        emptyHintText: {
            fontSize: fontSize.sm,
            color: colors.slate500,
        },
    });
}
