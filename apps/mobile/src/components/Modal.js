import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { Button } from './ui';

export function ConfirmModal({ visible, title, message, confirmLabel = 'Confirm', onConfirm, onCancel, danger, loading }) {
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
        backgroundColor: 'rgba(15,23,42,0.45)',
        justifyContent: 'center',
        padding: 24,
    },
    box: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.slate900,
        marginBottom: 8,
    },
    message: {
        fontSize: 15,
        color: colors.slate600,
        marginBottom: 16,
        lineHeight: 22,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    btn: {
        flex: 1,
    },
});
