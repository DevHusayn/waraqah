import { useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClipboardList, TrendingUp, Wallet } from 'lucide-react-native';
import { useAppStore } from '../stores/appStore';
import { Button } from '../components/ui';
import { colors, fontFamily, fontSize, lineHeight, radii, spacing } from '../theme';
import { hapticSelection } from '../utils/haptics';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Quote and invoice like a pro',
        description: 'Send estimates, convert to invoices, and brand your PDFs in seconds.',
        Icon: ClipboardList,
        tint: colors.brandSubtle,
        icon: colors.brand,
    },
    {
        id: '2',
        title: 'Track every payment',
        description: 'See what’s paid, pending, or overdue at a glance.',
        Icon: Wallet,
        tint: '#FFFBEB',
        icon: colors.amber600,
    },
    {
        id: '3',
        title: 'Grow your business',
        description: 'Clients, products, quotations, and invoices in one calm workspace.',
        Icon: TrendingUp,
        tint: '#EFF6FF',
        icon: '#2563EB',
    },
];

function Slide({ item }) {
    const { Icon } = item;
    return (
        <View style={[styles.slide, { width }]}>
            <View style={[styles.illustration, { backgroundColor: item.tint }]}>
                <View style={styles.iconCircle}>
                    <Icon size={40} color={item.icon} strokeWidth={1.75} />
                </View>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
        </View>
    );
}

export function OnboardingScreen({ navigation }) {
    const completeOnboarding = useAppStore((s) => s.completeOnboarding);
    const [index, setIndex] = useState(0);
    const listRef = useRef(null);
    const isLast = index === SLIDES.length - 1;

    const finish = async () => {
        hapticSelection();
        await completeOnboarding();
        navigation.replace('Welcome');
    };

    const next = () => {
        hapticSelection();
        if (isLast) {
            finish();
            return;
        }
        const nextIndex = index + 1;
        listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        setIndex(nextIndex);
    };

    return (
        <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
            <View style={styles.topBar}>
                <Pressable onPress={finish} hitSlop={12} accessibilityRole="button" accessibilityLabel="Skip">
                    <Text style={styles.skip}>Skip</Text>
                </Pressable>
            </View>

            <FlatList
                ref={listRef}
                data={SLIDES}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
                }}
                renderItem={({ item }) => <Slide item={item} />}
            />

            <View style={styles.footer}>
                <View style={styles.dots}>
                    {SLIDES.map((slide, i) => (
                        <View key={slide.id} style={[styles.dot, i === index && styles.dotActive]} />
                    ))}
                </View>
                <Button title={isLast ? 'Get started' : 'Next'} onPress={next} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.surface },
    topBar: {
        alignItems: 'flex-end',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
    },
    skip: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.md,
        color: colors.muted,
    },
    slide: {
        paddingHorizontal: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    illustration: {
        width: width - spacing.xl * 2,
        height: 260,
        borderRadius: radii.xxl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xxl,
    },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 28,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontFamily: fontFamily.bold,
        fontSize: 26,
        color: colors.foreground,
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.md,
        lineHeight: 32,
    },
    description: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        lineHeight: lineHeight.md,
        color: colors.muted,
        textAlign: 'center',
        paddingHorizontal: spacing.lg,
        maxWidth: 320,
    },
    footer: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.lg,
        gap: spacing.xl,
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.slate200,
    },
    dotActive: {
        width: 22,
        backgroundColor: colors.brand,
    },
});
