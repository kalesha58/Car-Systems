/**
 * Seasonal Theme Configuration
 * 
 * This file defines all seasonal themes for the application.
 * Change CURRENT_SEASON to switch between themes throughout the year.
 */

export type SeasonType = 'winter' | 'spring' | 'summer' | 'autumn' | 'default';

export interface ISeasonalTheme {
    season: SeasonType;
    name: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
    };
    animations: {
        background: any; // Main background animation (e.g., snow, rain)
        overlay?: any;   // Optional overlay animation (e.g., train, sleigh)
    };
    enabled: boolean;
}

export const seasonalThemes: Record<SeasonType, ISeasonalTheme> = {
    winter: {
        season: 'winter',
        name: 'Winter Theme',
        colors: {
            primary: '#4A90E2',    // winterBlue
            secondary: '#6DB3F2',  // winterBlueLight
            accent: '#2E5C8A',     // winterBlueDark
        },
        animations: {
            background: require('@assets/animations/Snow flakes Christmas.json'),
            overlay: require('@assets/animations/Winter Train.json'),
        },
        enabled: true,
    },
    spring: {
        season: 'spring',
        name: 'Spring Theme',
        colors: {
            primary: '#81C784',    // Green
            secondary: '#A5D6A7',  // Light green
            accent: '#66BB6A',     // Dark green
        },
        animations: {
            background: require('@assets/animations/Sakura fall.json'),
        },
        enabled: false, // Not yet implemented
    },
    summer: {
        season: 'summer',
        name: 'Summer Theme',
        colors: {
            primary: '#FFA726',    // Orange
            secondary: '#FFB74D',  // Light orange
            accent: '#FB8C00',     // Dark orange
        },
        animations: {
            background: require('@assets/animations/raining.json'), // Placeholder
        },
        enabled: false, // Not yet implemented
    },
    autumn: {
        season: 'autumn',
        name: 'Autumn Theme',
        colors: {
            primary: '#D4A574',    // Brown
            secondary: '#E6C9A8',  // Light brown
            accent: '#A67C52',     // Dark brown
        },
        animations: {
            background: require('@assets/animations/Sakura fall.json'), // Can be reused for leaves
        },
        enabled: false, // Not yet implemented
    },
    default: {
        season: 'default',
        name: 'Default Theme',
        colors: {
            primary: '#f7ca49',
            secondary: '#ffe141',
            accent: '#0d8320',
        },
        animations: {
            background: require('@assets/animations/raining.json'),
        },
        enabled: true,
    },
};

/**
 * SINGLE POINT OF CONFIGURATION
 * Change this value to switch the entire app's seasonal theme
 */
export const CURRENT_SEASON: SeasonType = 'winter';

/**
 * Get the current active seasonal theme
 */
export const getCurrentSeasonalTheme = (): ISeasonalTheme => {
    const theme = seasonalThemes[CURRENT_SEASON];

    // Fallback to default if season is disabled
    if (!theme.enabled) {
        return seasonalThemes.default;
    }

    return theme;
};
