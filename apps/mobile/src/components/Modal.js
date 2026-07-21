import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, lineHeight, radii, spacing } from '../theme';
import { Button } from './ui';

export function ConfirmModal({
    visible,
    title,
    message,
    confirmLabel = 'Confirm',
    onConfirm,
    onCancel,
    danger,
    loading,
}) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.overlay}>
                <View style={styles.box}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <View style={styles.actions}>
                        <Button title="Cancel" variant="secondary" onPress={onCancel} style={styles.btn} disabled={loading} />
                        <Button
                            title={confirmLabel}
                            variant={danger ? 'danger' : 'primary'}
                            onPress={onConfirm}
                            style={styles.btn}
                            loading={loading}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export function AlertModal({ visible, message, onClose }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose}>
                <View style={styles.box}>
                    <Text style={styles.message}>{message}</Text>
                    <Button title="OK" onPress={onClose} />
                </View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
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
    title: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.lg,
        color: colors.foreground,
        marginBottom: spacing.sm,
        letterSpacing: -0.3,
    },
    message: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        color: colors.muted,
        marginBottom: spacing.xl,
        lineHeight: lineHeight.md,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    btn: {
        flex: 1,
    },
});
