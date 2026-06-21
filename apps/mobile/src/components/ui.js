import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';

export function Screen({ children, scroll = false, style }) {
    if (scroll) {
        const { ScrollView } = require('react-native');
        return (
            <ScrollView
                style={[styles.screen, style]}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {children}
            </ScrollView>
        );
    }
    return <View style={[styles.screen, style]}>{children}</View>;
}

export function Card({ children, style }) {
    return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children }) {
    return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }) {
    return <Text style={styles.subtitle}>{children}</Text>;
}

export function Label({ children, required }) {
    return (
        <Text style={styles.label}>
            {children}
            {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
    );
}

export function Input({ error, style, ...props }) {
    return (
        <TextInput
            placeholderTextColor={colors.slate400}
            style={[styles.input, error && styles.inputError, style]}
            {...props}
        />
    );
}

export function FieldError({ message }) {
    if (!message) return null;
    return <Text style={styles.fieldError}>{message}</Text>;
}

export function Button({ title, onPress, variant = 'primary', disabled, loading, style }) {
    const isPrimary = variant === 'primary';
    const isDanger = variant === 'danger';
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            style={({ pressed }) => [
                styles.button,
                isPrimary && styles.buttonPrimary,
                variant === 'secondary' && styles.buttonSecondary,
                isDanger && styles.buttonDanger,
                (disabled || loading) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
                style,
            ]}
        >
            <Text
                style={[
                    styles.buttonText,
                    isPrimary && styles.buttonTextPrimary,
                    variant === 'secondary' && styles.buttonTextSecondary,
                    isDanger && styles.buttonTextDanger,
                ]}
            >
                {loading ? 'Please wait…' : title}
            </Text>
        </Pressable>
    );
}

export function StatusBadge({ status }) {
    const map = {
        pending: { bg: '#fef3c7', text: '#92400e' },
        paid: { bg: '#d1fae5', text: '#065f46' },
        overdue: { bg: '#fee2e2', text: '#991b1b' },
        cancelled: { bg: colors.slate100, text: colors.slate600 },
    };
    const c = map[status] || map.pending;
    return (
        <View style={[styles.badge, { backgroundColor: c.bg }]}>
            <Text style={[styles.badgeText, { color: c.text }]}>
                {(status || 'pending').toUpperCase()}
            </Text>
        </View>
    );
}

export function EmptyState({ title, message, action }) {
    return (
        <Card style={styles.empty}>
            <Text style={styles.emptyTitle}>{title}</Text>
            <Text style={styles.emptyMessage}>{message}</Text>
            {action}
        </Card>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.slate50,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.slate200,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.slate900,
    },
    subtitle: {
        fontSize: 15,
        color: colors.slate500,
        marginTop: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.slate700,
        marginBottom: 6,
    },
    required: {
        color: colors.red600,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.slate200,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.slate900,
        backgroundColor: colors.white,
    },
    inputError: {
        borderColor: '#f87171',
    },
    fieldError: {
        color: colors.red600,
        fontSize: 12,
        marginTop: 4,
    },
    button: {
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    buttonPrimary: {
        backgroundColor: colors.brand,
    },
    buttonSecondary: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.slate200,
    },
    buttonDanger: {
        backgroundColor: colors.red50,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    buttonDisabled: {
        opacity: 0.55,
    },
    buttonPressed: {
        opacity: 0.85,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    buttonTextPrimary: {
        color: colors.white,
    },
    buttonTextSecondary: {
        color: colors.slate700,
    },
    buttonTextDanger: {
        color: colors.red700,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    empty: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.slate900,
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        color: colors.slate500,
        textAlign: 'center',
    },
});
