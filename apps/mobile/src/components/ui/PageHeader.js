import { View } from 'react-native';
import { spacing } from '../../theme';
import { Subtitle, Title } from './Typography';

export function PageHeader({ title, subtitle, right, style }) {
    return (
        <View style={[{ marginBottom: spacing.lg }, style]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                    <Title>{title}</Title>
                    {subtitle ? <Subtitle>{subtitle}</Subtitle> : null}
                </View>
                {right}
            </View>
        </View>
    );
}
