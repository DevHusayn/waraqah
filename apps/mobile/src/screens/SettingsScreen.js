import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import {
    validateRequired,
    validateEmail,
    validateHexColor,
    isPremiumUser,
    LOGO_MAX_BYTES,
    PREMIUM_PLAN_FEATURES,
    FREE_PLAN_FEATURES,
} from '@waraqah/shared';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { Button, Card, FieldError, Input, Label, Title, Subtitle } from '../components/ui';
import { colors } from '../theme/colors';

async function pickImageAsBase64() {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return null;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > LOGO_MAX_BYTES) {
        throw new Error('Image must be smaller than 1.5 MB');
    }
    const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.PNG, base64: true }
    );
    return `data:image/png;base64,${manipulated.base64}`;
}

export function SettingsScreen({ navigation }) {
    const { businessInfo, updateBusinessInfo, saveBusinessAsset, loading } = useSettings();
    const { showToast } = useToast();
    const [form, setForm] = useState({ ...businessInfo });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm({ ...businessInfo });
    }, [businessInfo]);

    const premium = isPremiumUser(businessInfo);
    const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const handleSave = async () => {
        const next = {
            name: validateRequired(form.name, 'Enter business name.'),
            address: validateRequired(form.address, 'Enter address.'),
            email: validateEmail(form.email, 'Enter email.', 'Invalid email.'),
            phone: validateRequired(form.phone, 'Enter phone.'),
            brandColor: validateHexColor(form.brandColor, 'Pick a brand color.'),
        };
        setErrors(next);
        if (Object.values(next).some(Boolean)) return;
        setSaving(true);
        try {
            await updateBusinessInfo(form);
            showToast('Settings saved', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const uploadAsset = async (field) => {
        if (!premium) {
            navigation.navigate('Upgrade');
            return;
        }
        try {
            const dataUrl = await pickImageAsBase64();
            if (!dataUrl) return;
            await saveBusinessAsset(field, dataUrl, form);
            setForm((f) => ({ ...f, [field]: dataUrl }));
            showToast('Image uploaded', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    if (loading) return null;

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <Title>Settings</Title>
            <Subtitle>Company profile and branding</Subtitle>

            <Card style={styles.block}>
                <Text style={styles.section}>Company</Text>
                <Label required>Business name</Label>
                <Input value={form.name} onChangeText={(v) => setField('name', v)} error={errors.name} />
                <FieldError message={errors.name} />
                <Label required>Address</Label>
                <Input value={form.address} onChangeText={(v) => setField('address', v)} error={errors.address} />
                <FieldError message={errors.address} />
                <Label required>Email</Label>
                <Input value={form.email} onChangeText={(v) => setField('email', v)} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
                <FieldError message={errors.email} />
                <Label required>Phone</Label>
                <Input value={form.phone} onChangeText={(v) => setField('phone', v)} keyboardType="phone-pad" error={errors.phone} />
                <FieldError message={errors.phone} />
                <Label>Website</Label>
                <Input value={form.website || ''} onChangeText={(v) => setField('website', v)} autoCapitalize="none" />
            </Card>

            <Card style={styles.block}>
                <Text style={styles.section}>Branding</Text>
                <Label required>Brand color (#hex)</Label>
                <Input value={form.brandColor} onChangeText={(v) => setField('brandColor', v)} autoCapitalize="none" error={errors.brandColor} />
                <FieldError message={errors.brandColor} />
                {premium ? (
                    <>
                        <AssetRow label="Company logo" uri={form.companyLogoUrl} onUpload={() => uploadAsset('companyLogoUrl')} />
                        <AssetRow label="Company stamp" uri={form.companyStampUrl} onUpload={() => uploadAsset('companyStampUrl')} />
                        <AssetRow label="Signature" uri={form.authorizedSignatureUrl} onUpload={() => uploadAsset('authorizedSignatureUrl')} />
                    </>
                ) : (
                    <Text style={styles.hint}>Upgrade to Premium to upload logo, stamp, and signature.</Text>
                )}
            </Card>

            <Card style={styles.block}>
                <Text style={styles.section}>Plan — {premium ? 'Premium' : 'Free'}</Text>
                {(premium ? PREMIUM_PLAN_FEATURES : FREE_PLAN_FEATURES).map((f) => (
                    <Text key={f} style={styles.feature}>• {f}</Text>
                ))}
                {!premium ? <Button title="Upgrade to Premium" onPress={() => navigation.navigate('Upgrade')} style={{ marginTop: 12 }} /> : null}
            </Card>

            <Button title="Save settings" onPress={handleSave} loading={saving} />
        </ScrollView>
    );
}

function AssetRow({ label, uri, onUpload }) {
    return (
        <View style={styles.assetRow}>
            <View style={{ flex: 1 }}>
                <Text style={styles.assetLabel}>{label}</Text>
                {uri ? <Image source={{ uri }} style={styles.preview} resizeMode="contain" /> : null}
            </View>
            <Button title="Upload" variant="secondary" onPress={onUpload} style={{ alignSelf: 'flex-start' }} />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.slate50 },
    content: { padding: 16, paddingBottom: 40 },
    block: { marginBottom: 12 },
    section: { fontWeight: '700', fontSize: 15, marginBottom: 10, color: colors.slate900 },
    hint: { color: colors.slate500, fontSize: 13, marginTop: 8 },
    feature: { color: colors.slate600, marginBottom: 4, fontSize: 14 },
    assetRow: { marginTop: 12, gap: 8 },
    assetLabel: { fontWeight: '600', marginBottom: 6 },
    preview: { width: 80, height: 80, borderRadius: 8, backgroundColor: colors.slate100 },
});
