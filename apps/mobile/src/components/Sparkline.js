import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

/** Soft revenue sparkline for the dashboard hero card */
export function Sparkline({
    width = 120,
    height = 48,
    color = colors.brand,
    values = [0.35, 0.42, 0.38, 0.55, 0.48, 0.62, 0.58, 0.72, 0.68, 0.85],
}) {
    const max = Math.max(...values, 0.01);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const step = width / Math.max(values.length - 1, 1);

    const points = values.map((v, i) => {
        const x = i * step;
        const y = height - ((v - min) / range) * (height * 0.85) - height * 0.08;
        return [x, y];
    });

    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
        const [x0, y0] = points[i - 1];
        const [x1, y1] = points[i];
        const cx = (x0 + x1) / 2;
        d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }

    const fillD = `${d} L ${width} ${height} L 0 ${height} Z`;

    return (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <Defs>
                <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={color} stopOpacity="0.22" />
                    <Stop offset="100%" stopColor={color} stopOpacity="0" />
                </LinearGradient>
            </Defs>
            <Path d={fillD} fill="url(#sparkFill)" />
            <Path d={d} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}
