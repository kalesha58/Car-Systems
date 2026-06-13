import {
  BackgroundEffectId,
  OverlayEffectId,
} from '@types/visualEffects';

export type AnimationEffectId = BackgroundEffectId | OverlayEffectId;

interface IAnimationConfig {
  id: AnimationEffectId;
  source: any;
  name: string;
}

const BACKGROUND_ANIMATIONS: Record<Exclude<BackgroundEffectId, 'none'>, IAnimationConfig> = {
  rain: {
    id: 'rain',
    source: require('@assets/animations/raining.json'),
    name: 'Rain',
  },
  snow: {
    id: 'snow',
    source: require('@assets/animations/Snow flakes Christmas.json'),
    name: 'Snow',
  },
  sakura: {
    id: 'sakura',
    source: require('@assets/animations/Sakura fall.json'),
    name: 'Sakura',
  },
};

const OVERLAY_ANIMATIONS: Record<Exclude<OverlayEffectId, 'none'>, IAnimationConfig> = {
  winter_train: {
    id: 'winter_train',
    source: require('@assets/animations/Winter Train.json'),
    name: 'Winter Train',
  },
  christmas_sleigh: {
    id: 'christmas_sleigh',
    source: require('@assets/animations/Christmas Sleigh.json'),
    name: 'Christmas Sleigh',
  },
};

export const getBackgroundAnimationSource = (effectId: BackgroundEffectId): any | undefined => {
  if (effectId === 'none') return undefined;
  return BACKGROUND_ANIMATIONS[effectId].source;
};

export const getOverlayAnimationSource = (effectId: OverlayEffectId): any | undefined => {
  if (effectId === 'none') return undefined;
  return OVERLAY_ANIMATIONS[effectId].source;
};

export type { IAnimationConfig };
