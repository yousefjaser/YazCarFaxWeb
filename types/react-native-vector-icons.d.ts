declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { Component } from 'react';
  import { TextStyle, ViewStyle } from 'react-native';

  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle | ViewStyle;
  }

  class Icon extends Component<IconProps> {
    static getImageSource(
      name: string,
      size?: number,
      color?: string,
    ): Promise<any>;
  }

  export default Icon;
}

declare module 'react-native-vector-icons/FontAwesome' {
  import { Component } from 'react';
  import { TextStyle, ViewStyle } from 'react-native';

  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle | ViewStyle;
  }

  class Icon extends Component<IconProps> {
    static getImageSource(
      name: string,
      size?: number,
      color?: string,
    ): Promise<any>;
  }

  export default Icon;
}

declare module 'react-native-vector-icons/Ionicons' {
  import { Component } from 'react';
  import { TextStyle, ViewStyle } from 'react-native';

  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle | ViewStyle;
  }

  class Icon extends Component<IconProps> {
    static getImageSource(
      name: string,
      size?: number,
      color?: string,
    ): Promise<any>;
  }

  export default Icon;
} 