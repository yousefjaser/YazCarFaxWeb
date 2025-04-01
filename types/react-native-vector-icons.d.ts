declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { Component } from 'react';
  import { ImageSourcePropType, TextStyle, ViewStyle, StyleProp } from 'react-native';

  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle | ViewStyle>;
  }

  export default class Icon extends Component<IconProps> {
    static getImageSource(
      name: string,
      size?: number,
      color?: string,
    ): Promise<ImageSourcePropType>;

    static getImageSourceSync(
      name: string,
      size?: number,
      color?: string,
    ): ImageSourcePropType;

    static loadFont(file?: string): Promise<void>;
    static hasIcon(name: string): boolean;
  }
}

declare module 'react-native-vector-icons/FontAwesome' {
  import { Component } from 'react';
  import { ImageSourcePropType, TextStyle, ViewStyle, StyleProp } from 'react-native';

  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle | ViewStyle>;
  }

  export default class Icon extends Component<IconProps> {
    static getImageSource(
      name: string,
      size?: number,
      color?: string,
    ): Promise<ImageSourcePropType>;
  }
}

declare module 'react-native-vector-icons/Ionicons' {
  import { Component } from 'react';
  import { ImageSourcePropType, TextStyle, ViewStyle, StyleProp } from 'react-native';

  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle | ViewStyle>;
  }

  export default class Icon extends Component<IconProps> {
    static getImageSource(
      name: string,
      size?: number,
      color?: string,
    ): Promise<ImageSourcePropType>;
  }
} 