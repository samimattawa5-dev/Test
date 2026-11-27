import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Quelle: "Campaign Trailer" (offiziell), Ausschnitt 40.5-54.9 s, 1920x1080 (Letterbox, Bild ~800 px hoch)
const Card: React.FC<{text: string; color?: string; size?: number; top?: number; from: number; to: number}> = ({
  text, color = '#fff', size = 64, top = 330, from, to,
}) => {
  const {fps} = useVideoConfig();
  return (
    <Sequence from={Math.round(from * fps)} durationInFrames={Math.round((to - from) * fps)}>
      <CardInner text={text} color={color} size={size} top={top} />
    </Sequence>
  );
};

const CardInner: React.FC<{text: string; color: string; size: number; top: number}> = ({text, color, size, top}) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, 6], [0, 1], {extrapolateRight: 'clamp'});
  const y = interpolate(f, [0, 6], [20, 0], {extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center',
        opacity, transform: `translateY(${y}px)`,
      }}
    >
      <div
        dir="rtl"
        lang="ar"
        style={{
          background: 'rgba(0,0,0,0.67)', borderRadius: 28, padding: '22px 42px', color,
          fontFamily: '"DejaVu Sans", "Noto Naskh Arabic", sans-serif', fontWeight: 800, fontSize: size,
          maxWidth: 960, textAlign: 'center',
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const Clip: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const vol = interpolate(frame, [durationInFrames - 21, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{opacity: fadeOut}}>
        {/* Hintergrund: Quelle gefuellt + Blur + abgedunkelt */}
        <AbsoluteFill style={{overflow: 'hidden'}}>
          <OffthreadVideo
            src={staticFile('source.mp4')}
            muted
            style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(30px) brightness(0.75)', transform: 'scale(1.1)'}}
          />
        </AbsoluteFill>
        {/* Vordergrund: Mitte 1000x800 des Letterbox-Bilds, auf 1080 Breite skaliert */}
        <div style={{position: 'absolute', left: 0, top: 520, width: 1080, height: 864, overflow: 'hidden'}}>
          <OffthreadVideo
            src={staticFile('source.mp4')}
            volume={vol}
            style={{
              position: 'absolute', width: 1920 * 1.08, height: 1080 * 1.08,
              left: -460 * 1.08, top: -140 * 1.08,
            }}
          />
        </div>
        {/* Texte (Arabisch, RTL) */}
        <Card text="هل ستنجو من هذه المعركة؟" from={0} to={4.2} size={62} />
        <Card text="حرب كاملة في MW4" color="#ffc428" from={4.4} to={9} size={72} />
        <Card text="وش رايكم؟ اكتبوا بالتعليقات" from={9.4} to={durationInFrames / fps} size={62} top={1470} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
