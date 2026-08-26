import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { filterClientsForSuggestion, getClientBusiness } from '@waraqah/shared';
import { Input, FieldError } from './ui';
import { colors, fontSize, radii, spacing, useTheme } from '../theme';

function useDebouncedValue(value, delayMs = 200) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debounced;
}

function getClientSubtitle(client) {
    const business = getClientBusiness(client);
    if (business) return business;
    if (client?.email) return client.email;
    return '';
}

export function ClientNameCombobox({
    value,
    onChangeText,
    onSelectClient,
    clients = [],
    selectedClientId,
    error = false,
    placeholder = 'John Doe',
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
        return filterClientsForSuggestion(clients, query, { limit: 8 });
    }, [clients, debouncedQuery, focused]);

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
                        {suggestions.map((client, index) => {
                            const subtitle = getClientSubtitle(client);
                            const isLast = index === suggestions.length - 1 && !showEmptyHint;
                            return (
                                <Pressable
                                    key={client.id}
                                    onPress={() => onSelectClient(client)}
                                    style={({ pressed }) => [
                                        styles.option,
                                        !isLast && styles.optionBorder,
                                        pressed && styles.optionPressed,
                                        selectedClientId === client.id && styles.optionSelected,
                                    ]}
                                >
                                    <Text style={styles.optionTitle}>{client.name}</Text>
                                    {subtitle ? (
                                        <Text style={styles.optionSubtitle} numberOfLines={1}>
                                            {subtitle}
                                        </Text>
                                    ) : null}
                                </Pressable>
                            );
                        })}
                        {showEmptyHint ? (
                            <View style={styles.emptyHint}>
                                <Text style={styles.emptyHintText}>
                                    New client — saved when you create or issue
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
    optionSelected: {
        backgroundColor: colors.brandSubtle,
    },
    optionTitle: {
        fontSize: fontSize.md,
        color: colors.foreground,
        fontWeight: '600',
    },
    optionSubtitle: {
        marginTop: 2,
        fontSize: fontSize.sm,
        color: colors.slate500,
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
