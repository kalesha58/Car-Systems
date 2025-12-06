interface IAnimationConfig {
  id: string;
  source: any;
  name: string;
  translationKey: string;
}

export const animations: IAnimationConfig[] = [
  {
    id: 'rain',
    source: require('@assets/animations/raining.json'),
    name: 'Rain',
    translationKey: 'animations.rain',
  },
  {
    id: 'sakura',
    source: require('@assets/animations/Sakura fall.json'),
    name: 'Sakura Fall',
    translationKey: 'animations.sakuraFall',
  },
  {
    id: 'christmas',
    source: require('@assets/animations/Christmas Sleigh.json'),
    name: 'Christmas Sleigh',
    translationKey: 'animations.christmasSleigh',
  },
];

export type {IAnimationConfig};

