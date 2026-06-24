import { forwardRef, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import GorhomBottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { colors, radii, spacing } from '../../theme';

export const BottomSheet = forwardRef(function BottomSheet(
    { children, snapPoints = ['50%'], onClose, enablePanDownToClose = true, ...rest },
    ref
) {
    const points = useMemo(() => snapPoints, [snapPoints]);

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.45}
            />
        ),
        []
    );

    return (
        <GorhomBottomSheet
            ref={ref}
            index={-1}
            snapPoints={points}
            enablePanDownToClose={enablePanDownToClose}
            backdropComponent={renderBackdrop}
            handleIndicatorStyle={styles.indicator}
            backgroundStyle={styles.background}
            onChange={(index) => {
                if (index === -1) onClose?.();
            }}
            {...rest}
        >
            <BottomSheetView style={styles.content}>{children}</BottomSheetView>
        </GorhomBottomSheet>
    );
});

export function BottomSheetModalContent({ children, style }) {
    return <View style={[styles.content, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    background: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: radii.xl,
        borderTopRightRadius: radii.xl,
    },
    indicator: {
        backgroundColor: colors.slate200,
        width: 40,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
});
