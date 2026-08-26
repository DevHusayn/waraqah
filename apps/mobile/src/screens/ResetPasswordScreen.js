import { useState, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { validateRequired, isStrongPassword, PASSWORD_REQUIREMENTS_MESSAGE } from '@waraqah/shared';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Screen, Title, Label, Input, Button, FieldError } from '../components/ui';
import { useTheme } from '../theme';

export function ResetPasswordScreen({ route, navigation }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const token = route.params?.token;
    const { resetPassword } = useAuth();
    const { showToast } = useToast();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!validateRequired(password, 'Enter a password.')) {
            setError('Enter a password.');
            return;
        }
        if (!isStrongPassword(password)) {
            setError(PASSWORD_REQUIREMENTS_MESSAGE);
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            await resetPassword(token, password);
            showToast('Password updated. Sign in with your new password.', 'success');
            navigation.navigate('Auth');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen scroll style={styles.pad}>
            <Title>Reset password</Title>
            <Text style={styles.sub}>Choose a new password for your account.</Text>
            <View style={styles.card}>
                <Label required>New password</Label>
                <Input value={password} onChangeText={setPassword} secureTextEntry />
                <Label required>Confirm password</Label>
                <Input value={confirm} onChangeText={setConfirm} secureTextEntry />
                <FieldError message={error} />
                <Button title="Update password" onPress={handleSubmit} loading={loading} style={{ marginTop: 12 }} />
            </View>
        </Screen>
    );
}

function createStyles(colors) {
    return StyleSheet.create({
    pad: { padding: 16 },
    sub: { color: colors.slate500, marginTop: 4, marginBottom: 16 },
    card: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.slate200,
    },
});
}
