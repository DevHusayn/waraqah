import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { BRAND_PRESETS, isPremiumUser, LOGO_MAX_BYTES, BRAND_IMAGE_MAX_EDGE } from '@waraqah/shared';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { Button, Card, FieldError, Input, Label } from '../../components/ui';
import { useSettingsForm } from '../../hooks/useSettingsForm';
import { colors, fontFamily, fontSize, radii, spacing } from '../../theme';

async function pickImageAsBase64() {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return null;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > LOGO_MAX_BYTES) {
        throw new Error('Image must be smaller than 2 MB');
    }
    const resizeWidth = Math.min(asset.width || BRAND_IMAGE_MAX_EDGE, BRAND_IMAGE_MAX_EDGE);
    const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: resizeWidth } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.PNG, base64: true }
    );
    return `data:image/png;base64,${manipulated.base64}`;
}

export function BrandingSettingsScreen({ navigation }) {
    const { businessInfo, saveBusinessAsset } = useSettings();
    const { showToast } = useToast();
    const { form, setField, errors, saving, save, loading } = useSettingsForm('branding');
    const premium = isPremiumUser(businessInfo);
    const [uploading, setUploading] = useState(null);

    const uploadAsset = async (field) => {
        if (!premium) {
            navigation.getParent()?.navigate('Upgrade');
            return;
        }
        setUploading(field);
        try {
            const dataUrl = await pickImageAsBase64();
            if (!dataUrl) return;
            await saveBusinessAsset(field, dataUrl);
            setField(field, dataUrl);
            showToast('Image uploaded', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setUploading(null);
        }
    };

    if (loading) return null;

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Card style={styles.block} elevated>
                <Label required>Brand color</Label>
                <Input value={form.brandColor} onChangeText={(v) => setField('brandColor', v)} autoCapitalize="none" error={errors.brandColor} />
                <FieldError message={errors.brandColor} />
                <View style={styles.presets}>
                    {BRAND_PRESETS.map((p) => (
                        <Pressable
                            key={p.color}
                            onPress={() => setField('brandColor', p.color)}
                            style={[styles.swatch, { backgroundColor: p.color }, form.brandColor === p.color && styles.swatchActive]}
                        />
                    ))}
                </View>
            </Card>
            <Card style={styles.block} elevated>
                <Text style={styles.section}>Premium assets</Text>
                {!premium ? (
                    <Text style={styles.hint}>Upgrade to Premium to upload logo, stamp, and signature.</Text>
                ) : (
                    <>
                        <Text style={styles.formatHint}>
                            PNG (transparent recommended), JPG, or SVG · max 2 MB · auto-resized
                        </Text>
                        <AssetRow
                            label="Company logo"
                            hint="Appears on PDF quotations, invoices, and receipts"
                            uri={form.companyLogoUrl}
                            loading={uploading === 'companyLogoUrl'}
                            onUpload={() => uploadAsset('companyLogoUrl')}
                        />
                        <AssetRow
                            label="Company stamp"
                            hint="Near signature on paid receipt PDFs"
                            uri={form.companyStampUrl}
                            loading={uploading === 'companyStampUrl'}
                            onUpload={() => uploadAsset('companyStampUrl')}
                        />
                        <AssetRow
                            label="Authorized signature"
                            hint="Under totals on PDF quotations, invoices, and receipts"
                            uri={form.authorizedSignatureUrl}
                            loading={uploading === 'authorizedSignatureUrl'}
                            onUpload={() => uploadAsset('authorizedSignatureUrl')}
                        />
                    </>
                )}
            </Card>
            <Button title="Save" onPress={save} loading={saving} />
        </ScrollView>
    );
}

function AssetRow({ label, hint, uri, onUpload, loading }) {
    return (
        <View style={styles.assetRow}>
            <View style={{ flex: 1 }}>
                <Text style={styles.assetLabel}>{label}</Text>
                {hint ? <Text style={styles.assetHint}>{hint}</Text> : null}
                {uri ? <Image source={{ uri }} style={styles.preview} resizeMode="contain" /> : null}
            </View>
            <Button title="Upload" variant="secondary" onPress={onUpload} loading={loading} style={{ alignSelf: 'flex-start' }} />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    block: { marginBottom: spacing.lg },
    section: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, marginBottom: spacing.sm, color: colors.foreground },
    hint: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.muted },
    formatHint: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.muted,
        marginBottom: spacing.sm,
        lineHeight: 18,
    },
    presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
    swatch: { width: 36, height: 36, borderRadius: radii.md },
    swatchActive: { borderWidth: 3, borderColor: colors.foreground },
    assetRow: { marginTop: spacing.md, gap: spacing.sm },
    assetLabel: { fontFamily: fontFamily.semibold, marginBottom: 2 },
    assetHint: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.muted, marginBottom: 6 },
    preview: { width: 80, height: 80, borderRadius: radii.sm, backgroundColor: colors.slate100 },
});
