import { useEffect, useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Button } from './ui';
import { colors, fontFamily, fontSize, radii, spacing } from '../theme';

const EMPTY_DETAILS = {
    business: '',
    phone: '',
    address: '',
    additionalInfo: '',
};

export function ClientDetailsModal({ visible, initialData = EMPTY_DETAILS, onClose, onSave }) {
    const [form, setForm] = useState(EMPTY_DETAILS);

    useEffect(() => {
        if (visible) {
            setForm({
                business: initialData.business || '',
                phone: initialData.phone || '',
                address: initialData.address || '',
                additionalInfo: initialData.additionalInfo || '',
            });
        }
    }, [visible, initialData]);

    const handleSave = () => {
        onSave({
            business: form.business.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            additionalInfo: form.additionalInfo.trim(),
        });
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.box}>
                    <Text style={styles.title}>Client details</Text>
                    <Text style={styles.subtitle}>Optional — shown on the PDF when provided.</Text>
                    <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
                        <Text style={styles.label}>Business name (optional)</Text>
                        <TextInput
                            value={form.business}
                            onChangeText={(v) => setForm((prev) => ({ ...prev, business: v }))}
                            placeholder="Company or trading name"
                            placeholderTextColor={colors.slate400}
                            style={styles.input}
                        />
                        <Text style={styles.label}>Phone (optional)</Text>
                        <TextInput
                            value={form.phone}
                            onChangeText={(v) => setForm((prev) => ({ ...prev, phone: v }))}
                            placeholder="+234 800 000 0000"
                            placeholderTextColor={colors.slate400}
                            style={styles.input}
                            keyboardType="phone-pad"
                        />
                        <Text style={styles.label}>Address (optional)</Text>
                        <TextInput
                            value={form.address}
                            onChangeText={(v) => setForm((prev) => ({ ...prev, address: v }))}
                            placeholder="Street, city, state"
                            placeholderTextColor={colors.slate400}
                            style={[styles.input, styles.textArea]}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                        <Text style={styles.label}>Additional information (optional)</Text>
                        <TextInput
                            value={form.additionalInfo}
                            onChangeText={(v) => setForm((prev) => ({ ...prev, additionalInfo: v }))}
                            placeholder="Tax ID, attention line, or other notes"
                            placeholderTextColor={colors.slate400}
                            style={[styles.input, styles.textArea]}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </ScrollView>
                    <View style={styles.actions}>
                        <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
                        <Button title="Save details" onPress={handleSave} style={{ flex: 1 }} />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    box: {
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.xl,
        maxHeight: '85%',
    },
    title: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.lg,
        color: colors.foreground,
    },
    subtitle: {
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.slate500,
    },
    form: {
        maxHeight: 360,
    },
    label: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.foreground,
        marginBottom: spacing.xs,
        marginTop: spacing.md,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.slate200,
        borderRadius: radii.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        color: colors.foreground,
        backgroundColor: colors.white,
    },
    textArea: {
        minHeight: 88,
        paddingTop: spacing.sm,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
});
