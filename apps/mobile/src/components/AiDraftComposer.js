import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Crown, Sparkles } from 'lucide-react-native';
import {
    AI_MAX_PROMPT_LENGTH,
    ANALYTICS_EVENTS,
    applyAiDraftToForm,
} from '@waraqah/shared';
import { apiFetch } from '../api/client';
import { captureEvent } from '../monitoring/posthog';
import { Button } from './ui';
import { fontFamily, fontSize, lineHeight, radii, spacing, useTheme } from '../theme';

const PLACEHOLDER = 'Invoice Ahmed 3 bags of cement at 8500 and delivery 2000';

export function applyMobileAiDraft(prev, draft) {
    return applyAiDraftToForm(prev, draft, { stringifyNumbers: true });
}

export function AiDraftComposer({
    documentType = 'invoice',
    premium = false,
    disabled = false,
    onApply,
    onUpgrade,
}) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [warnings, setWarnings] = useState([]);
    const label = documentType === 'quotation' ? 'quotation' : 'invoice';

    const handleDraft = async () => {
        const text = prompt.trim();
        if (!text) {
            setError('Describe the job first.');
            return;
        }

        setLoading(true);
        setError('');
        setWarnings([]);
        captureEvent(ANALYTICS_EVENTS.AI_DRAFT_STARTED, { document_type: documentType });

        try {
            const draft = await apiFetch('/ai/draft-document', {
                method: 'POST',
                body: JSON.stringify({ prompt: text, documentType }),
                timeoutMs: 45000,
            });
            onApply?.(draft);
            setWarnings(Array.isArray(draft?.warnings) ? draft.warnings : []);
            captureEvent(ANALYTICS_EVENTS.AI_DRAFT_APPLIED, {
                document_type: documentType,
                item_count: Array.isArray(draft?.items) ? draft.items.length : 0,
            });
        } catch (err) {
            setError(err.message || 'Could not draft the document.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.wrap}>
            <Text style={styles.section}>Draft from a sentence</Text>
            <Text style={styles.hint}>
                Describe the {label}. We fill the form — you still review and save.
            </Text>
            {premium ? (
                <>
                    <TextInput
                        value={prompt}
                        onChangeText={(value) => {
                            setPrompt(value.slice(0, AI_MAX_PROMPT_LENGTH));
                            if (error) setError('');
                        }}
                        placeholder={PLACEHOLDER}
                        placeholderTextColor={colors.slate400}
                        multiline
                        maxLength={AI_MAX_PROMPT_LENGTH}
                        editable={!loading && !disabled}
                        style={[styles.input, error ? styles.inputError : null]}
                        textAlignVertical="top"
                    />
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    <Button
                        title={loading ? 'Drafting…' : `Draft ${label}`}
                        onPress={handleDraft}
                        disabled={loading || disabled}
                        loading={loading}
                        leftIcon={loading ? null : <Sparkles size={16} color={colors.white} />}
                    />
                    <Text style={styles.fineprint}>
                        Nothing is saved or sent until you use the buttons below.
                    </Text>
                    {warnings.map((warning) => (
                        <Text key={warning} style={styles.warning}>
                            {warning}
                        </Text>
                    ))}
                </>
            ) : (
                <View style={styles.lock}>
                    <Text style={styles.lockText}>
                        Premium can turn a sentence into a draft {label} using your clients and products.
                    </Text>
                    <Pressable
                        onPress={onUpgrade}
                        accessibilityRole="button"
                        style={styles.upgradeBtn}
                    >
                        <Crown size={16} color={colors.amber600} />
                        <Text style={styles.upgradeText}>Upgrade to Premium</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

function createStyles(colors) {
    return StyleSheet.create({
        wrap: { marginBottom: spacing.xl },
        section: {
            marginBottom: spacing.sm,
            fontFamily: fontFamily.semibold,
            fontSize: 12,
            color: colors.slate400,
            textTransform: 'uppercase',
            letterSpacing: 0.7,
        },
        hint: {
            marginBottom: spacing.md,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.sm,
            color: colors.muted,
            lineHeight: lineHeight.sm,
        },
        input: {
            minHeight: 88,
            marginBottom: spacing.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            borderRadius: radii.md,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            backgroundColor: colors.surfaceMuted,
            color: colors.foreground,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.md,
        },
        inputError: { borderColor: colors.error },
        error: {
            marginBottom: spacing.sm,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.sm,
            color: colors.error,
        },
        fineprint: {
            marginTop: spacing.sm,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.xs,
            color: colors.slate400,
            lineHeight: lineHeight.xs,
        },
        warning: {
            marginTop: spacing.sm,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.xs,
            color: colors.amber600,
        },
        lock: {
            padding: spacing.lg,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.amber600,
            backgroundColor: colors.amber50,
        },
        lockText: {
            fontFamily: fontFamily.regular,
            fontSize: fontSize.sm,
            color: colors.muted,
            lineHeight: lineHeight.sm,
            marginBottom: spacing.md,
        },
        upgradeBtn: {
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.amber600,
            backgroundColor: colors.surface,
        },
        upgradeText: {
            fontFamily: fontFamily.semibold,
            fontSize: fontSize.sm,
            color: colors.foreground,
        },
    });
}
