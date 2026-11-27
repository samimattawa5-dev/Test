import React from 'react';
import {Composition} from 'remotion';
import {Clip} from './Clip';

export const FPS = 30;
export const DURATION_S = 14.4;

export const Root: React.FC = () => (
  <Composition
    id="CodClip1"
    component={Clip}
    durationInFrames={Math.round(DURATION_S * FPS)}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
