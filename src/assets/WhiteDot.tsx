import * as React from 'react';
import svg, {svgProps, Circle} from 'react-native-svg';
const WhiteDot = ( ) => (
  <svg
    // xmlns="http://www.w3.org/2000/svg"
    width={5}
    height={4}
    fill="none"
    style={props.style}
     >
    <Circle cx={2.82} cy={2} r={2} fill="#111920" opacity={0.2} />
  </svg>
);
export default WhiteDot;
